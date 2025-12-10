import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStoreConfigSchema } from "@shared/schema";
import { z } from "zod";
import * as cheerio from "cheerio";
import OpenAI from "openai";

function getOpenAIClient(): OpenAI | null {
  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  });
}

function isValidExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    const hostname = url.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^0\./,
      /^169\.254\./,
      /\.local$/,
      /^metadata\./,
      /^169\.254\.169\.254$/,
    ];
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize default platforms
  const defaultPlatforms = ['google-reviews', 'facebook', 'instagram', 'xiaohongshu', 'tiktok', 'whatsapp'];
  await storage.initializePlatforms(defaultPlatforms);

  // Store Configuration Routes
  app.get("/api/config", async (_req, res) => {
    try {
      const config = await storage.getStoreConfig();
      res.json(config || {
        websiteUrl: null,
        googleReviewsUrl: null,
        googlePlaceId: null,
        facebookUrl: null,
        instagramUrl: null,
        xiaohongshuUrl: null,
        tiktokUrl: null,
        whatsappUrl: null,
        shopPhotos: [],
        sliderPhotos: [],
        reviewHashtags: [],
      });
    } catch (error) {
      console.error("Error fetching config:", error);
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.put("/api/config", async (req, res) => {
    try {
      const validatedData = insertStoreConfigSchema.parse(req.body);
      const config = await storage.updateStoreConfig(validatedData);
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error updating config:", error);
        res.status(500).json({ error: "Failed to update configuration" });
      }
    }
  });

  // Analytics Routes
  app.get("/api/analytics", async (_req, res) => {
    try {
      const analytics = await storage.getAllAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { platform } = req.body;
      if (!platform || typeof platform !== 'string') {
        res.status(400).json({ error: "Platform is required" });
        return;
      }
      await storage.incrementPlatformClick(platform);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking click:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  // Social Link Discovery Endpoint
  app.post("/api/discover-social-links", async (req, res) => {
    try {
      const { websiteUrl } = req.body;
      
      if (!websiteUrl || typeof websiteUrl !== 'string') {
        res.status(400).json({ error: "Website URL is required" });
        return;
      }

      // Validate URL format and security
      let urlString: string;
      try {
        urlString = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      } catch {
        res.status(400).json({ error: "Invalid URL format" });
        return;
      }

      // SSRF Protection: Block internal/local URLs
      if (!isValidExternalUrl(urlString)) {
        res.status(400).json({ error: "Invalid URL - only public websites are allowed" });
        return;
      }

      const url = new URL(urlString);

      // Check OpenAI credentials
      const openai = getOpenAIClient();
      if (!openai) {
        res.status(503).json({ error: "AI service is not configured. Please enter social links manually." });
        return;
      }

      // Fetch the website content with timeout and size limit
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const MAX_RESPONSE_SIZE = 1024 * 1024; // 1MB limit

      let html: string;
      try {
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ShareLor/1.0; Social Link Discovery)',
          },
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          res.status(400).json({ error: `Failed to fetch website: ${response.statusText}` });
          return;
        }

        // Check content length
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
          res.status(400).json({ error: "Website content too large" });
          return;
        }
        
        html = await response.text();
        
        // Enforce size limit on actual content
        if (html.length > MAX_RESPONSE_SIZE) {
          html = html.substring(0, MAX_RESPONSE_SIZE);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          res.status(408).json({ error: "Request timeout - website took too long to respond" });
        } else {
          res.status(400).json({ error: "Failed to fetch website" });
        }
        return;
      }

      // Parse HTML and extract links
      const $ = cheerio.load(html);
      const links: string[] = [];
      
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) links.push(href);
      });

      // Extract images from the page
      const images: { url: string; alt: string; context: string }[] = [];
      $('img').each((_, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src');
        if (!src) return;
        
        // Resolve relative URLs
        try {
          src = new URL(src, url.toString()).toString();
        } catch {
          return;
        }
        
        // Skip small icons, logos, and non-http images
        if (!src.startsWith('http')) return;
        if (src.includes('logo') || src.includes('icon') || src.includes('favicon')) return;
        if (src.endsWith('.svg') || src.endsWith('.gif')) return;
        
        const alt = $(el).attr('alt') || '';
        const parent = $(el).parent();
        const context = parent.text().trim().substring(0, 100);
        
        // Validate the image URL for security
        if (isValidExternalUrl(src)) {
          images.push({ url: src, alt, context });
        }
      });

      // De-duplicate images by URL
      const uniqueImages = images.filter((img, idx, arr) => 
        arr.findIndex(i => i.url === img.url) === idx
      ).slice(0, 20); // Limit to 20 candidates

      // Also check for meta tags and footer content
      const pageText = $('body').text().substring(0, 5000);

      // Use AI to analyze and find social links + rank images + suggest hashtags
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that extracts social media URLs, Google Place IDs, photos, and hashtags from website content.

Given a list of links, images, and page content from a website (likely a salon/beauty business), identify:

1. GOOGLE BUSINESS INFO (CRITICAL):
   - googlePlaceId: Extract the Google Place ID from any Google Maps or Google Business links found on the page.
     Look for patterns like:
     - maps.google.com URLs containing "place_id=" parameter
     - g.page/ short links (the business name after g.page/ helps identify the business)
     - Google Maps URLs with "!1s" followed by the place ID (e.g., "!1s0x...")
     - search.google.com/local/writereview URLs with "placeid=" parameter
   - If no direct Place ID is found but there's a Google Maps/Business link, extract any identifiable info.
   
2. Social media and contact URLs for 6 platforms:
   - googleReviews: The Google Reviews/Google Business page URL (we'll use this as fallback)
   - xiaohongshu: The XiaoHongShu (Little Red Book) page of the business
   - instagram: The Instagram page of the business
   - facebook: The Facebook page of the business
   - tiktok: The TikTok page of the business
   - whatsapp: The WhatsApp contact link (wa.me or api.whatsapp.com format)

3. The best photos for TWO purposes:
   a) Shop/portfolio photos (before/after shots, treatment results, product photos)
   b) Slider/hero photos (eye-catching, professional photos for a carousel/banner)

4. Relevant hashtags that customers could use when sharing reviews

Return a JSON object with:
- socialLinks: { googleReviews, googlePlaceId, facebook, instagram, xiaohongshu, tiktok, whatsapp } - use null if not found
  IMPORTANT: googlePlaceId should be JUST the Place ID string (e.g., "ChIJ...") not a full URL
- suggestedPhotos: array of objects with { url, reason } - select up to 6 best photos
- suggestedSliderPhotos: array of objects with { url, reason } - select up to 3 best photos for hero carousel
- suggestedHashtags: array of 8-12 hashtags (with # prefix)

Only return valid URLs. Do not make up URLs or Place IDs.`
          },
          {
            role: "user",
            content: `Website: ${url.toString()}

Links found on page:
${links.slice(0, 100).join('\n')}

Images found on page:
${uniqueImages.map(img => `URL: ${img.url}, Alt: ${img.alt}, Context: ${img.context}`).join('\n')}

Page content excerpt:
${pageText}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      let discoveredLinks = {
        googleReviews: null as string | null,
        googlePlaceId: null as string | null,
        facebook: null as string | null,
        instagram: null as string | null,
        xiaohongshu: null as string | null,
        tiktok: null as string | null,
        whatsapp: null as string | null,
      };
      
      let suggestedPhotos: { url: string; reason: string }[] = [];
      let suggestedSliderPhotos: { url: string; reason: string }[] = [];
      let suggestedHashtags: string[] = [];

      if (aiResponse) {
        try {
          const parsed = JSON.parse(aiResponse);
          const socialLinks = parsed.socialLinks || parsed;
          discoveredLinks = {
            googleReviews: socialLinks.googleReviews || null,
            googlePlaceId: socialLinks.googlePlaceId || null,
            facebook: socialLinks.facebook || null,
            instagram: socialLinks.instagram || null,
            xiaohongshu: socialLinks.xiaohongshu || null,
            tiktok: socialLinks.tiktok || null,
            whatsapp: socialLinks.whatsapp || null,
          };
          
          if (Array.isArray(parsed.suggestedPhotos)) {
            suggestedPhotos = parsed.suggestedPhotos
              .filter((p: any) => p.url && isValidExternalUrl(p.url))
              .slice(0, 6);
          }
          
          if (Array.isArray(parsed.suggestedSliderPhotos)) {
            suggestedSliderPhotos = parsed.suggestedSliderPhotos
              .filter((p: any) => p.url && isValidExternalUrl(p.url))
              .slice(0, 3);
          }
          
          if (Array.isArray(parsed.suggestedHashtags)) {
            suggestedHashtags = parsed.suggestedHashtags
              .filter((tag: any) => typeof tag === 'string')
              .map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`)
              .slice(0, 12);
          }
        } catch {
          console.error("Failed to parse AI response:", aiResponse);
        }
      }

      res.json({
        success: true,
        websiteUrl: url.toString(),
        discoveredLinks,
        suggestedPhotos,
        suggestedSliderPhotos,
        suggestedHashtags,
      });

    } catch (error) {
      console.error("Error discovering social links:", error);
      res.status(500).json({ error: "Failed to discover social links" });
    }
  });

  // Photo Approval Endpoint - download external image and add to shop photos
  app.post("/api/photos/approve", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        res.status(400).json({ error: "Image URL is required" });
        return;
      }

      // Validate URL
      if (!isValidExternalUrl(imageUrl)) {
        res.status(400).json({ error: "Invalid image URL" });
        return;
      }

      // Check photo limit first
      const currentConfig = await storage.getStoreConfig();
      const currentPhotos = currentConfig?.shopPhotos || [];
      
      if (currentPhotos.length >= 9) {
        res.status(400).json({ error: "Maximum of 9 photos allowed. Please remove some photos first." });
        return;
      }

      // Download the image with timeout and size limit
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB limit

      try {
        const response = await fetch(imageUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ShareLor/1.0)',
          },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          res.status(400).json({ error: "Failed to download image" });
          return;
        }

        // Verify content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          res.status(400).json({ error: "URL does not point to a valid image" });
          return;
        }

        // Check content length
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
          res.status(400).json({ error: "Image is too large (max 2MB)" });
          return;
        }

        // Download and convert to base64
        const arrayBuffer = await response.arrayBuffer();
        
        if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
          res.status(400).json({ error: "Image is too large (max 2MB)" });
          return;
        }

        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;

        // Add to shop photos using dedicated method (preserves other config fields)
        const updatedConfig = await storage.addShopPhoto(dataUrl);

        res.json({
          success: true,
          shopPhotos: updatedConfig.shopPhotos,
          photoCount: updatedConfig.shopPhotos?.length || 0,
        });

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          res.status(408).json({ error: "Download timeout - image took too long" });
        } else {
          res.status(400).json({ error: "Failed to download image" });
        }
        return;
      }

    } catch (error) {
      console.error("Error approving photo:", error);
      res.status(500).json({ error: "Failed to approve photo" });
    }
  });

  // Slider Photo Approval Endpoint - download external image and add to slider photos
  app.post("/api/slider-photos/approve", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        res.status(400).json({ error: "Image URL is required" });
        return;
      }

      // Validate URL
      if (!isValidExternalUrl(imageUrl)) {
        res.status(400).json({ error: "Invalid image URL" });
        return;
      }

      // Check photo limit first
      const currentConfig = await storage.getStoreConfig();
      const currentPhotos = currentConfig?.sliderPhotos || [];
      
      if (currentPhotos.length >= 3) {
        res.status(400).json({ error: "Maximum of 3 slider photos allowed. Please remove some photos first." });
        return;
      }

      // Download the image with timeout and size limit
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB limit

      try {
        const response = await fetch(imageUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ShareLor/1.0)',
          },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          res.status(400).json({ error: "Failed to download image" });
          return;
        }

        // Verify content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          res.status(400).json({ error: "URL does not point to a valid image" });
          return;
        }

        // Check content length
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
          res.status(400).json({ error: "Image is too large (max 2MB)" });
          return;
        }

        // Download and convert to base64
        const arrayBuffer = await response.arrayBuffer();
        
        if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
          res.status(400).json({ error: "Image is too large (max 2MB)" });
          return;
        }

        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;

        // Add to slider photos using dedicated method (preserves other config fields)
        const updatedConfig = await storage.addSliderPhoto(dataUrl);

        res.json({
          success: true,
          sliderPhotos: updatedConfig.sliderPhotos,
          photoCount: updatedConfig.sliderPhotos?.length || 0,
        });

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          res.status(408).json({ error: "Download timeout - image took too long" });
        } else {
          res.status(400).json({ error: "Failed to download image" });
        }
        return;
      }

    } catch (error) {
      console.error("Error approving slider photo:", error);
      res.status(500).json({ error: "Failed to approve slider photo" });
    }
  });

  // Save selected hashtags
  app.post("/api/hashtags", async (req, res) => {
    try {
      const { hashtags } = req.body;
      
      if (!Array.isArray(hashtags)) {
        res.status(400).json({ error: "Hashtags must be an array" });
        return;
      }
      
      // Validate hashtags (strings only, max 12)
      const validHashtags = hashtags
        .filter((tag): tag is string => typeof tag === 'string')
        .slice(0, 12);
      
      const config = await storage.setReviewHashtags(validHashtags);
      
      res.json({
        success: true,
        reviewHashtags: config.reviewHashtags,
      });
    } catch (error) {
      console.error("Error saving hashtags:", error);
      res.status(500).json({ error: "Failed to save hashtags" });
    }
  });

  // Get saved Google reviews
  app.get("/api/google-reviews", async (_req, res) => {
    try {
      const reviews = await storage.getGoogleReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ error: "Failed to fetch Google reviews" });
    }
  });

  // Fetch Google reviews from Places API
  app.post("/api/google-reviews/fetch", async (req, res) => {
    try {
      const { placeId } = req.body;
      
      if (!placeId || typeof placeId !== 'string') {
        res.status(400).json({ error: "Google Place ID is required" });
        return;
      }

      // Check for Google Places API key
      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!googleApiKey) {
        res.status(503).json({ 
          error: "Google Places API key is not configured. Please add GOOGLE_PLACES_API_KEY to your secrets.",
          needsApiKey: true
        });
        return;
      }

      // Fetch from Google Places API (New)
      const fieldsParam = 'id,displayName,reviews,rating,userRatingCount';
      const apiUrl = `https://places.googleapis.com/v1/places/${placeId}?fields=${fieldsParam}&key=${googleApiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Google Places API error:", errorData);
        
        if (response.status === 400) {
          res.status(400).json({ error: "Invalid Place ID. Please check your Google Place ID and try again." });
        } else if (response.status === 403) {
          res.status(403).json({ error: "Google API key is invalid or doesn't have Places API enabled." });
        } else {
          res.status(response.status).json({ error: "Failed to fetch reviews from Google" });
        }
        return;
      }

      const data = await response.json();
      
      if (!data.reviews || data.reviews.length === 0) {
        res.json({ 
          success: true, 
          reviews: [], 
          message: "No reviews found for this business.",
          businessName: data.displayName?.text || null,
          rating: data.rating || null,
          totalReviews: data.userRatingCount || 0
        });
        return;
      }

      // Transform Google reviews to our format
      const reviewsToSave = data.reviews.map((review: any) => ({
        authorName: review.authorAttribution?.displayName || 'Anonymous',
        authorPhotoUrl: review.authorAttribution?.photoUri || null,
        rating: review.rating || 0,
        text: review.text?.text || review.originalText?.text || null,
        relativeTime: review.relativePublishTimeDescription || null,
        publishTime: review.publishTime ? new Date(review.publishTime) : null,
        googleReviewId: null,
      }));

      // Save reviews to database
      const savedReviews = await storage.saveGoogleReviews(reviewsToSave);

      res.json({
        success: true,
        reviews: savedReviews,
        businessName: data.displayName?.text || null,
        rating: data.rating || null,
        totalReviews: data.userRatingCount || 0,
        message: `Successfully fetched ${savedReviews.length} reviews from Google.`
      });

    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ error: "Failed to fetch Google reviews" });
    }
  });

  // Verify Google Place ID and return business info (with 7-day cache)
  app.post("/api/google-place/verify", async (req, res) => {
    try {
      let { placeId } = req.body;
      
      if (!placeId || typeof placeId !== 'string') {
        res.status(400).json({ error: "Business name or Place ID is required" });
        return;
      }

      const input = placeId.trim();
      
      // Check for Google Places API key first
      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!googleApiKey) {
        res.status(503).json({ 
          error: "Google Places API key is not configured. Please add GOOGLE_PLACES_API_KEY to your secrets.",
          needsApiKey: true
        });
        return;
      }

      // If input doesn't look like a Place ID (ChIJ...), treat it as a business name
      if (!input.startsWith('ChIJ')) {
        console.log("Input doesn't look like Place ID, searching for business:", input);
        
        // Use legacy Find Place API (supports API keys)
        const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(input)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${googleApiKey}`;
        const searchResponse = await fetch(searchUrl);

        if (!searchResponse.ok) {
          const errData = await searchResponse.json().catch(() => ({}));
          console.error("Find Place API error:", errData);
          res.status(400).json({ error: "Could not find business. Please try a more specific name." });
          return;
        }

        const searchData = await searchResponse.json();
        if (searchData.status !== 'OK' || !searchData.candidates || searchData.candidates.length === 0) {
          res.status(404).json({ error: "No business found matching that name. Try including the city or area." });
          return;
        }

        // Use the first result
        placeId = searchData.candidates[0].place_id;
        console.log("Found Place ID:", placeId);
      }

      // Check cache first
      const cached = await storage.getVerifiedBusiness(placeId);
      if (cached) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (cached.verifiedAt > sevenDaysAgo) {
          // Return cached data with cache info
          res.json({
            success: true,
            placeId: placeId,
            businessName: cached.businessName,
            address: cached.address,
            rating: cached.rating,
            totalReviews: cached.totalReviews || 0,
            website: cached.website,
            googleMapsUrl: cached.googleMapsUrl,
            verifiedAt: cached.verifiedAt.toISOString(),
            fromCache: true,
          });
          return;
        }
      }

      // Fetch from legacy Google Places API (supports API keys)
      const encodedPlaceId = encodeURIComponent(placeId);
      const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodedPlaceId}&fields=place_id,name,formatted_address,rating,user_ratings_total,website,url&key=${googleApiKey}`;
      
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Google Places API error:", errorData);
        res.status(response.status).json({ error: "Failed to verify Place ID with Google" });
        return;
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.error("Google Places API status:", data.status, "error_message:", data.error_message);
        if (data.status === 'INVALID_REQUEST') {
          res.status(400).json({ error: "Invalid Place ID. Please check your Google Place ID and try again." });
        } else if (data.status === 'REQUEST_DENIED') {
          res.status(403).json({ error: `Google API error: ${data.error_message || 'Places API not enabled or invalid key'}` });
        } else {
          res.status(400).json({ error: `Google API error: ${data.status}` });
        }
        return;
      }

      const result = data.result;

      // Save to cache
      const businessData = {
        placeId,
        businessName: result.name || null,
        address: result.formatted_address || null,
        rating: result.rating || null,
        totalReviews: result.user_ratings_total || 0,
        website: result.website || null,
        googleMapsUrl: result.url || null,
      };
      
      const saved = await storage.saveVerifiedBusiness(businessData);

      res.json({
        success: true,
        placeId: placeId,
        businessName: saved.businessName,
        address: saved.address,
        rating: saved.rating,
        totalReviews: saved.totalReviews || 0,
        website: saved.website,
        googleMapsUrl: saved.googleMapsUrl,
        verifiedAt: saved.verifiedAt.toISOString(),
        fromCache: false,
      });

    } catch (error) {
      console.error("Error verifying Google Place ID:", error);
      res.status(500).json({ error: "Failed to verify Google Place ID" });
    }
  });

  // Resolve Google Maps URL to Place ID
  app.post("/api/google-place/resolve-url", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: "Google Maps URL is required" });
        return;
      }

      // Check if it's already a Place ID (starts with ChIJ)
      if (url.match(/^ChIJ[A-Za-z0-9_-]+$/)) {
        res.json({ success: true, placeId: url });
        return;
      }

      // Validate it looks like a Google Maps URL
      if (!url.includes('google.com/maps') && !url.includes('maps.app.goo.gl') && !url.includes('goo.gl/maps')) {
        res.status(400).json({ error: "Please enter a valid Google Maps URL or Place ID" });
        return;
      }

      // Follow redirects to get final URL
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const finalUrl = response.url;
      console.log("Resolved URL:", finalUrl);

      // Try to extract Place ID from the URL
      // Pattern 1: Direct Place ID in URL (ChIJ...)
      let placeIdMatch = finalUrl.match(/(ChIJ[A-Za-z0-9_-]+)/);
      if (placeIdMatch) {
        res.json({ success: true, placeId: placeIdMatch[1] });
        return;
      }

      // Pattern 2: place_id query parameter
      const urlObj = new URL(finalUrl);
      const placeIdParam = urlObj.searchParams.get('place_id');
      if (placeIdParam) {
        res.json({ success: true, placeId: placeIdParam });
        return;
      }

      // Pattern 2b: q parameter with place_id: prefix (e.g., ?q=place_id:ChIJ...)
      const qParam = urlObj.searchParams.get('q');
      if (qParam && qParam.startsWith('place_id:')) {
        const extractedId = qParam.replace('place_id:', '');
        if (extractedId.startsWith('ChIJ')) {
          res.json({ success: true, placeId: extractedId });
          return;
        }
      }

      // Pattern 3: Extract from data parameter (format: !1s0x...:0x... or !1sChIJ...)
      const dataMatch = finalUrl.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
      if (dataMatch) {
        res.json({ success: true, placeId: dataMatch[1] });
        return;
      }
      
      // Pattern 5: Extract business name from URL path and use Text Search
      const nameMatch = finalUrl.match(/place\/([^\/\@]+)/);
      if (nameMatch) {
        const businessName = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
        console.log("Extracted business name:", businessName);
        
        const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (googleApiKey) {
          // Use Text Search API to find the Place ID
          const searchUrl = `https://places.googleapis.com/v1/places:searchText`;
          const searchResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': googleApiKey,
              'X-Goog-FieldMask': 'places.id,places.displayName'
            },
            body: JSON.stringify({ textQuery: businessName })
          });

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.places && searchData.places.length > 0) {
              const extractedId = searchData.places[0].id;
              const foundName = searchData.places[0].displayName?.text || businessName;
              res.json({ success: true, placeId: extractedId, businessName: foundName });
              return;
            }
          } else {
            const errData = await searchResponse.json().catch(() => ({}));
            console.error("Text Search API error:", errData);
          }
        }
      }

      // Could not extract - return helpful error
      res.status(400).json({ 
        error: "Could not find the business. Please enter the business name directly in the field above.",
        resolvedUrl: finalUrl
      });

    } catch (error) {
      console.error("Error resolving Google Maps URL:", error);
      res.status(500).json({ error: "Failed to resolve Google Maps URL" });
    }
  });

  return httpServer;
}
