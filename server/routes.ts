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
  const defaultPlatforms = ['google', 'facebook', 'instagram', 'xiaohongshu', 'follow-facebook', 'follow-instagram'];
  await storage.initializePlatforms(defaultPlatforms);

  // Store Configuration Routes
  app.get("/api/config", async (_req, res) => {
    try {
      const config = await storage.getStoreConfig();
      res.json(config || {
        websiteUrl: null,
        googleUrl: null,
        facebookUrl: null,
        instagramUrl: null,
        xiaohongshuUrl: null,
        shopPhotos: [],
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

      // Use AI to analyze and find social links + rank images
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that extracts social media URLs and identifies good photos from website content.
Given a list of links, images, and page content from a website (likely a salon/beauty business), identify:
1. Social media profile URLs
2. The best photos that would work as shop/portfolio photos (before/after shots, treatment results, product photos)

Return a JSON object with:
- socialLinks: { google, facebook, instagram, xiaohongshu } - use null if not found
- suggestedPhotos: array of objects with { url, reason } - select up to 6 best photos that show treatments, results, or portfolio-worthy images. Reason should briefly explain why this photo is good (e.g., "Shows hair treatment results", "Before/after comparison").

Only return valid URLs. Do not make up URLs.`
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
        google: null as string | null,
        facebook: null as string | null,
        instagram: null as string | null,
        xiaohongshu: null as string | null,
      };
      
      let suggestedPhotos: { url: string; reason: string }[] = [];

      if (aiResponse) {
        try {
          const parsed = JSON.parse(aiResponse);
          const socialLinks = parsed.socialLinks || parsed;
          discoveredLinks = {
            google: socialLinks.google || null,
            facebook: socialLinks.facebook || null,
            instagram: socialLinks.instagram || null,
            xiaohongshu: socialLinks.xiaohongshu || null,
          };
          
          if (Array.isArray(parsed.suggestedPhotos)) {
            suggestedPhotos = parsed.suggestedPhotos
              .filter((p: any) => p.url && isValidExternalUrl(p.url))
              .slice(0, 6);
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

  return httpServer;
}
