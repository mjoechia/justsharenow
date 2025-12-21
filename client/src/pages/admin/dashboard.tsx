import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ExternalLink, ImagePlus, Trash2, Search, Loader2, Sparkles, Check, X, Image, Hash, Plus, HelpCircle, Star, MapPin, Building2, CheckCircle2, Crop, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoreConfig, updateStoreConfig, discoverSocialLinks, discoverLogo, approvePhoto, approveSliderPhoto, saveHashtags, SuggestedPhoto, fetchGoogleReviews, GoogleReview, verifyGooglePlaceId, VerifyPlaceIdResponse, resolveGoogleMapsUrl } from "@/lib/api";
import justShareNowLogo from "@assets/JustSharenow_logo_1766216638301.png";
import QuickView from "@/pages/quick-view";
import Landing from "@/pages/landing";
import { useAuth } from "@/hooks/useAuth";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { language, setSelectedPhoto, setSelectedReview } = useStore();
  const t = translations[language];
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [fbUrl, setFbUrl] = useState("");
  const [igUrl, setIgUrl] = useState("");
  const [xhsUrl, setXhsUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [shopPhotos, setShopPhotos] = useState<string[]>([]);
  const [sliderPhotos, setSliderPhotos] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [suggestedPhotos, setSuggestedPhotos] = useState<SuggestedPhoto[]>([]);
  const [suggestedSliderPhotos, setSuggestedSliderPhotos] = useState<SuggestedPhoto[]>([]);
  const [approvingPhoto, setApprovingPhoto] = useState<string | null>(null);
  const [approvingSliderPhoto, setApprovingSliderPhoto] = useState<string | null>(null);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState("");
  const [savingHashtags, setSavingHashtags] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isFetchingReviews, setIsFetchingReviews] = useState(false);
  const [fetchedReviews, setFetchedReviews] = useState<GoogleReview[]>([]);
  const [isVerifyingPlace, setIsVerifyingPlace] = useState(false);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [verifiedBusiness, setVerifiedBusiness] = useState<{
    businessName: string | null;
    address: string | null;
    rating: number | null;
    totalReviews: number;
    googleMapsUrl: string | null;
    verifiedAt?: string;
    fromCache?: boolean;
  } | null>(null);
  const [confirmedBusinessName, setConfirmedBusinessName] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [isDiscoveringLogo, setIsDiscoveringLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const sliderFileInputRef = useRef<HTMLInputElement>(null);

  // Cropper state for slider photos
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  useEffect(() => {
    if (config) {
      setWebsiteUrl(config.websiteUrl || "");
      setGoogleReviewsUrl(config.googleReviewsUrl || "");
      // Preserve Google Place ID from saved config
      setGooglePlaceId(config.googlePlaceId || "");
      setFbUrl(config.facebookUrl || "");
      setIgUrl(config.instagramUrl || "");
      setXhsUrl(config.xiaohongshuUrl || "");
      setTiktokUrl(config.tiktokUrl || "");
      setWhatsappUrl(config.whatsappUrl || "");
      setShopPhotos(config.shopPhotos || []);
      setSliderPhotos(config.sliderPhotos || []);
      setSelectedHashtags(config.reviewHashtags || []);
      if (config.businessName) {
        setConfirmedBusinessName(config.businessName);
      }
      setCompanyLogo((config as any).companyLogo || null);
      setIsDirty(false);
      
      // Auto-fetch verified business info if Place ID is saved
      if (config.googlePlaceId && !verifiedBusiness) {
        fetch('/api/google-place/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId: config.googlePlaceId }),
        })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              setVerifiedBusiness({
                businessName: result.businessName,
                address: result.address,
                rating: result.rating,
                totalReviews: result.totalReviews || 0,
                googleMapsUrl: result.googleMapsUrl,
                verifiedAt: result.verifiedAt,
                fromCache: result.fromCache,
              });
            }
          })
          .catch(() => {
            // Silently fail - just won't show cached business info
          });
      }
    }
  }, [config]);

  // Auto-verify is disabled - Place ID field starts empty and user must verify manually

  const checkDirty = () => {
    if (!config) return false;
    return (
      websiteUrl !== (config.websiteUrl || "") ||
      googleReviewsUrl !== (config.googleReviewsUrl || "") ||
      googlePlaceId !== (config.googlePlaceId || "") ||
      fbUrl !== (config.facebookUrl || "") ||
      igUrl !== (config.instagramUrl || "") ||
      xhsUrl !== (config.xiaohongshuUrl || "") ||
      tiktokUrl !== (config.tiktokUrl || "") ||
      whatsappUrl !== (config.whatsappUrl || "") ||
      companyLogo !== ((config as any).companyLogo || null)
    );
  };

  useEffect(() => {
    setIsDirty(checkDirty());
  }, [websiteUrl, googleReviewsUrl, googlePlaceId, fbUrl, igUrl, xhsUrl, tiktokUrl, whatsappUrl, companyLogo, config]);

  const updateConfigMutation = useMutation({
    mutationFn: updateStoreConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeConfig'] });
      setIsDirty(false);
      toast({ title: "Saved", description: "Configuration updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [authLoading, isAuthenticated, setLocation]);
  
  if (authLoading) {
    return (
      <Layout isAdmin>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </Layout>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }

  const handleSaveSocials = () => {
    updateConfigMutation.mutate({
      websiteUrl,
      googleReviewsUrl,
      googlePlaceId,
      facebookUrl: fbUrl,
      instagramUrl: igUrl,
      xiaohongshuUrl: xhsUrl,
      tiktokUrl,
      whatsappUrl,
      shopPhotos,
      sliderPhotos,
      reviewHashtags: selectedHashtags,
      companyLogo: companyLogo ?? null,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 2MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCompanyLogo(base64);
      setIsDirty(true);
      toast({ title: "Logo uploaded", description: "Click 'Save Changes' to apply." });
    };
    reader.readAsDataURL(file);
  };

  const handleDiscoverLogo = async () => {
    if (!websiteUrl) {
      toast({ title: "Error", description: "Please enter your website URL first.", variant: "destructive" });
      return;
    }

    setIsDiscoveringLogo(true);
    try {
      const result = await discoverLogo(websiteUrl);
      if (result.logoUrl) {
        setCompanyLogo(result.logoUrl);
        setIsDirty(true);
        toast({ title: "Logo found!", description: "Click 'Save Changes' to apply." });
      } else {
        toast({ title: "No logo found", description: "Try uploading your logo manually.", variant: "default" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to discover logo.", variant: "destructive" });
    } finally {
      setIsDiscoveringLogo(false);
    }
  };

  const handleDiscoverLinks = async () => {
    if (!websiteUrl) {
      toast({ title: "Error", description: "Please enter your website URL first.", variant: "destructive" });
      return;
    }

    setIsDiscovering(true);
    
    // Clear ALL existing data when AI Logic starts
    setGoogleReviewsUrl("");
    setGooglePlaceId("");
    setFbUrl("");
    setIgUrl("");
    setXhsUrl("");
    setTiktokUrl("");
    setWhatsappUrl("");
    setShopPhotos([]);
    setSliderPhotos([]);
    setSelectedHashtags([]);
    setSuggestedPhotos([]);
    setSuggestedSliderPhotos([]);
    setSuggestedHashtags([]);
    
    try {
      const result = await discoverSocialLinks(websiteUrl);
      
      if (result.discoveredLinks.googleReviews) {
        setGoogleReviewsUrl(result.discoveredLinks.googleReviews);
      }
      if (result.discoveredLinks.googlePlaceId) {
        setGooglePlaceId(result.discoveredLinks.googlePlaceId);
      }
      if (result.discoveredLinks.facebook) {
        setFbUrl(result.discoveredLinks.facebook);
      }
      if (result.discoveredLinks.instagram) {
        setIgUrl(result.discoveredLinks.instagram);
      }
      if (result.discoveredLinks.xiaohongshu) {
        setXhsUrl(result.discoveredLinks.xiaohongshu);
      }
      if (result.discoveredLinks.tiktok) {
        setTiktokUrl(result.discoveredLinks.tiktok);
      }
      if (result.discoveredLinks.whatsapp) {
        setWhatsappUrl(result.discoveredLinks.whatsapp);
      }

      // Store suggested shop photos
      if (result.suggestedPhotos && result.suggestedPhotos.length > 0) {
        setSuggestedPhotos(result.suggestedPhotos);
      }

      // Store suggested slider photos
      if (result.suggestedSliderPhotos && result.suggestedSliderPhotos.length > 0) {
        setSuggestedSliderPhotos(result.suggestedSliderPhotos);
      }

      // Store suggested hashtags (filter out already selected ones)
      if (result.suggestedHashtags && result.suggestedHashtags.length > 0) {
        const newSuggestions = result.suggestedHashtags.filter(
          tag => !selectedHashtags.includes(tag)
        );
        setSuggestedHashtags(newSuggestions);
      }

      const foundCount = Object.values(result.discoveredLinks).filter(Boolean).length;
      const shopPhotoCount = result.suggestedPhotos?.length || 0;
      const sliderPhotoCount = result.suggestedSliderPhotos?.length || 0;
      const hashtagCount = result.suggestedHashtags?.length || 0;
      
      if (foundCount > 0 || shopPhotoCount > 0 || sliderPhotoCount > 0 || hashtagCount > 0) {
        let parts = [];
        if (foundCount > 0) parts.push(`${foundCount} social link${foundCount > 1 ? 's' : ''}`);
        if (shopPhotoCount > 0) parts.push(`${shopPhotoCount} shop photo${shopPhotoCount > 1 ? 's' : ''}`);
        if (sliderPhotoCount > 0) parts.push(`${sliderPhotoCount} slider photo${sliderPhotoCount > 1 ? 's' : ''}`);
        if (hashtagCount > 0) parts.push(`${hashtagCount} hashtag${hashtagCount > 1 ? 's' : ''}`);
        
        toast({ 
          title: "Discovery Complete!", 
          description: `AI found ${parts.join(', ')} from your website.` 
        });
      } else {
        toast({ 
          title: "No Content Found", 
          description: "No social media links, photos, or hashtags were found on your website.", 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Discovery Failed", 
        description: error.message || "Failed to discover content. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleApprovePhoto = async (photo: SuggestedPhoto) => {
    if (shopPhotos.length >= 9) {
      toast({ 
        title: "Limit Reached", 
        description: "Maximum 9 photos allowed. Remove some photos first.", 
        variant: "destructive" 
      });
      return;
    }

    setApprovingPhoto(photo.url);
    try {
      const result = await approvePhoto(photo.url);
      setShopPhotos(result.shopPhotos);
      setSuggestedPhotos(prev => prev.filter(p => p.url !== photo.url));
      queryClient.invalidateQueries({ queryKey: ['storeConfig'] });
      toast({ 
        title: "Photo Added!", 
        description: `Photo added to your shop photos (${result.photoCount}/9).` 
      });
    } catch (error: any) {
      toast({ 
        title: "Failed to Add Photo", 
        description: error.message || "Could not add this photo. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setApprovingPhoto(null);
    }
  };

  const handleDismissPhoto = (photo: SuggestedPhoto) => {
    setSuggestedPhotos(prev => prev.filter(p => p.url !== photo.url));
  };

  const handleApproveSliderPhoto = async (photo: SuggestedPhoto) => {
    if (sliderPhotos.length >= 3) {
      toast({ 
        title: "Limit Reached", 
        description: "Maximum 3 slider photos allowed. Remove some photos first.", 
        variant: "destructive" 
      });
      return;
    }

    setApprovingSliderPhoto(photo.url);
    try {
      const result = await approveSliderPhoto(photo.url);
      setSliderPhotos(result.sliderPhotos);
      setSuggestedSliderPhotos(prev => prev.filter(p => p.url !== photo.url));
      queryClient.invalidateQueries({ queryKey: ['storeConfig'] });
      toast({ 
        title: "Photo Added!", 
        description: `Photo added to your slider (${result.photoCount}/3).` 
      });
    } catch (error: any) {
      toast({ 
        title: "Failed to Add Photo", 
        description: error.message || "Could not add this photo. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setApprovingSliderPhoto(null);
    }
  };

  const handleDismissSliderPhoto = (photo: SuggestedPhoto) => {
    setSuggestedSliderPhotos(prev => prev.filter(p => p.url !== photo.url));
  };

  const handleApproveHashtag = (hashtag: string) => {
    if (selectedHashtags.length >= 12) {
      toast({ 
        title: "Limit Reached", 
        description: "Maximum 12 hashtags allowed.", 
        variant: "destructive" 
      });
      return;
    }
    if (!selectedHashtags.includes(hashtag)) {
      setSelectedHashtags(prev => [...prev, hashtag]);
    }
    setSuggestedHashtags(prev => prev.filter(h => h !== hashtag));
  };

  const handleDismissHashtag = (hashtag: string) => {
    setSuggestedHashtags(prev => prev.filter(h => h !== hashtag));
  };

  const handleRemoveSelectedHashtag = (hashtag: string) => {
    setSelectedHashtags(prev => prev.filter(h => h !== hashtag));
  };

  const handleAddCustomHashtag = () => {
    if (!newHashtag.trim()) return;
    
    const formatted = newHashtag.trim().startsWith('#') ? newHashtag.trim() : `#${newHashtag.trim()}`;
    
    if (selectedHashtags.length >= 12) {
      toast({ 
        title: "Limit Reached", 
        description: "Maximum 12 hashtags allowed.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (selectedHashtags.includes(formatted)) {
      toast({ 
        title: "Already Added", 
        description: "This hashtag is already in your list.", 
        variant: "destructive" 
      });
      return;
    }
    
    setSelectedHashtags(prev => [...prev, formatted]);
    setNewHashtag("");
  };

  const handleSaveHashtags = async () => {
    setSavingHashtags(true);
    try {
      await saveHashtags(selectedHashtags);
      queryClient.invalidateQueries({ queryKey: ['storeConfig'] });
      toast({ 
        title: "Saved!", 
        description: `${selectedHashtags.length} hashtags saved successfully.` 
      });
    } catch (error: any) {
      toast({ 
        title: "Failed to Save", 
        description: error.message || "Could not save hashtags. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setSavingHashtags(false);
    }
  };

  const handleVerifyPlaceId = async () => {
    if (!googlePlaceId) {
      toast({ 
        title: "Place ID Required", 
        description: "Please enter a Google Place ID or Google Maps link.", 
        variant: "destructive" 
      });
      return;
    }

    setIsVerifyingPlace(true);
    setVerifiedBusiness(null);
    
    let placeIdToVerify = googlePlaceId.trim();
    
    try {
      // Check if it's a Google Maps URL and resolve it first
      if (placeIdToVerify.includes('google.com/maps') || placeIdToVerify.includes('maps.app.goo.gl') || placeIdToVerify.includes('goo.gl/maps')) {
        setIsResolvingUrl(true);
        toast({ 
          title: "Resolving URL...", 
          description: "Converting your Google Maps link to a Place ID." 
        });
        
        const resolveResult = await resolveGoogleMapsUrl(placeIdToVerify);
        if (resolveResult.success && resolveResult.placeId) {
          placeIdToVerify = resolveResult.placeId;
          // Update the input field with the resolved Place ID
          setGooglePlaceId(resolveResult.placeId);
          setIsDirty(true);
        } else {
          throw new Error("Could not extract Place ID from the URL");
        }
        setIsResolvingUrl(false);
      }
      
      const result = await verifyGooglePlaceId(placeIdToVerify);
      if (result.success) {
        const finalPlaceId = result.placeId || placeIdToVerify;
        
        // If the API returns a placeId (from business name search), update the field
        if (result.placeId && result.placeId !== placeIdToVerify) {
          setGooglePlaceId(result.placeId);
        }
        setVerifiedBusiness({
          businessName: result.businessName,
          address: result.address,
          rating: result.rating,
          totalReviews: result.totalReviews,
          googleMapsUrl: result.googleMapsUrl,
          verifiedAt: result.verifiedAt,
          fromCache: result.fromCache,
        });
        
        // Auto-save the Place ID, Google Reviews URL, and Business Name after successful verification
        const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${finalPlaceId}`;
        setGoogleReviewsUrl(googleReviewUrl);
        setGooglePlaceId(finalPlaceId);
        
        // Also set the confirmed business name
        if (result.businessName) {
          setConfirmedBusinessName(result.businessName);
        }
        
        // Save to database immediately with error handling
        try {
          await updateStoreConfig({
            businessName: result.businessName || undefined,
            websiteUrl,
            googleReviewsUrl: googleReviewUrl,
            googlePlaceId: finalPlaceId,
            facebookUrl: fbUrl,
            instagramUrl: igUrl,
            xiaohongshuUrl: xhsUrl,
            tiktokUrl,
            whatsappUrl,
            shopPhotos,
            sliderPhotos,
            reviewHashtags: selectedHashtags,
          });
          queryClient.invalidateQueries({ queryKey: ['storeConfig'] });
          setIsDirty(false);
          
          toast({ 
            title: "Business Set!",
            description: result.businessName ? `Business: ${result.businessName}` : undefined
          });
        } catch (saveError) {
          // Verification succeeded but save failed - show partial success
          setIsDirty(true);
          toast({ 
            title: "Business Found", 
            description: "Business found. Please click Save Changes to persist."
          });
        }
      }
    } catch (error: any) {
      toast({ 
        title: "Verification Failed", 
        description: error.message || "Could not verify. Please check and try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsVerifyingPlace(false);
      setIsResolvingUrl(false);
    }
  };

  const handleFetchGoogleReviews = async () => {
    if (!googlePlaceId) {
      toast({ 
        title: "Place ID Required", 
        description: "Please enter a Google Place ID first.", 
        variant: "destructive" 
      });
      return;
    }

    setIsFetchingReviews(true);
    try {
      const result = await fetchGoogleReviews(googlePlaceId);
      if (result.success) {
        setFetchedReviews(result.reviews);
        const reviewCount = result.reviews.length;
        toast({ 
          title: "Reviews Fetched!", 
          description: `Found ${reviewCount} review${reviewCount !== 1 ? 's' : ''} from Google.${result.businessName ? ` Business: ${result.businessName}` : ''}` 
        });
      } else {
        if (result.needsApiKey) {
          toast({ 
            title: "API Key Required", 
            description: "Please add GOOGLE_PLACES_API_KEY in your secrets to fetch reviews.", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "No Reviews Found", 
            description: result.message || "No reviews were found for this business.", 
          });
        }
      }
    } catch (error: any) {
      toast({ 
        title: "Failed to Fetch Reviews", 
        description: error.message || "Could not fetch reviews. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsFetchingReviews(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (shopPhotos.length >= 9) {
            toast({
                title: "Limit Reached",
                description: "You can only upload up to 9 photos.",
                variant: "destructive"
            });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const newPhotos = [...shopPhotos, reader.result as string];
            setShopPhotos(newPhotos);
            updateConfigMutation.mutate({
              websiteUrl,
              googleReviewsUrl,
              googlePlaceId,
              facebookUrl: fbUrl,
              instagramUrl: igUrl,
              xiaohongshuUrl: xhsUrl,
              tiktokUrl,
              whatsappUrl,
              shopPhotos: newPhotos,
              sliderPhotos,
              reviewHashtags: selectedHashtags,
            });
        };
        reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = shopPhotos.filter((_, i) => i !== index);
    setShopPhotos(newPhotos);
    updateConfigMutation.mutate({
      websiteUrl,
      googleReviewsUrl,
      googlePlaceId,
      facebookUrl: fbUrl,
      instagramUrl: igUrl,
      xiaohongshuUrl: xhsUrl,
      tiktokUrl,
      whatsappUrl,
      shopPhotos: newPhotos,
      sliderPhotos,
      reviewHashtags: selectedHashtags,
    });
  };

  const handleSliderPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (sliderPhotos.length >= 3) {
        toast({
          title: "Limit Reached",
          description: "You can only upload up to 3 slider photos.",
          variant: "destructive"
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const newPhotos = [...sliderPhotos, croppedImage];
      setSliderPhotos(newPhotos);
      updateConfigMutation.mutate({
        websiteUrl,
        googleReviewsUrl,
        googlePlaceId,
        facebookUrl: fbUrl,
        instagramUrl: igUrl,
        xiaohongshuUrl: xhsUrl,
        tiktokUrl,
        whatsappUrl,
        shopPhotos,
        sliderPhotos: newPhotos,
        reviewHashtags: selectedHashtags,
      });
      setCropDialogOpen(false);
      resetCropState();
      toast({
        title: "Photo Added",
        description: "Slider photo has been cropped and added.",
      });
    } catch (error) {
      console.error("Crop failed:", error);
      toast({
        title: "Crop Failed",
        description: "Could not crop the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetCropState = useCallback(() => {
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    // Reset file input to allow re-selecting the same file
    if (sliderFileInputRef.current) {
      sliderFileInputRef.current.value = '';
    }
  }, []);

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    resetCropState();
  };

  const removeSliderPhoto = (index: number) => {
    const newPhotos = sliderPhotos.filter((_, i) => i !== index);
    setSliderPhotos(newPhotos);
    updateConfigMutation.mutate({
      websiteUrl,
      googleReviewsUrl,
      googlePlaceId,
      facebookUrl: fbUrl,
      instagramUrl: igUrl,
      xiaohongshuUrl: xhsUrl,
      tiktokUrl,
      whatsappUrl,
      shopPhotos,
      sliderPhotos: newPhotos,
      reviewHashtags: selectedHashtags,
    });
  };

  // Render Quick View tab
  if (activeTab === "quick-view") {
    return (
      <Layout isAdmin activeAdminTab={activeTab} onAdminTabChange={setActiveTab}>
        <div className="container mx-auto px-4 py-8">
          <QuickView embedded />
        </div>
      </Layout>
    );
  }

  // Render Shop View tab
  if (activeTab === "shop-view") {
    return (
      <Layout isAdmin activeAdminTab={activeTab} onAdminTabChange={setActiveTab}>
        <Landing embedded />
      </Layout>
    );
  }

  // Render Dashboard tab (default)
  return (
    <Layout isAdmin activeAdminTab={activeTab} onAdminTabChange={setActiveTab}>
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                {confirmedBusinessName && (
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold text-primary" data-testid="text-header-business-name">
                      {confirmedBusinessName}
                    </span>
                  </div>
                )}
                <h1 className="text-3xl font-heading font-bold text-foreground">{t.admin.dashboard.title}</h1>
                <p className="text-muted-foreground">{t.admin.dashboard.subtitle}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.open('/help', '_blank')}
              className="flex items-center gap-2"
              data-testid="button-help"
            >
              <HelpCircle className="w-4 h-4" />
              Help Guide
            </Button>
        </div>

        <div className="space-y-8">
            {/* Social Links Section */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Social Media Links</CardTitle>
                        <CardDescription>Enter your website URL and let AI find your social media links automatically.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Website URL with AI Discovery */}
                        <div className="p-4 rounded-lg bg-gradient-to-r from-[#2D7FF9]/5 to-[#23C7C3]/5 border border-[#2D7FF9]/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-[#2D7FF9]" />
                                <span className="font-semibold text-[#0B1E3F]">AI-Powered Discovery</span>
                            </div>
                            <div className="flex gap-2">
                                <Input 
                                    type="url" 
                                    placeholder="https://your-business.com" 
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    className="flex-1"
                                    data-testid="input-website-url"
                                />
                                <Button 
                                    onClick={handleDiscoverLinks}
                                    disabled={isDiscovering || !websiteUrl}
                                    className="bg-[#2D7FF9] hover:bg-[#2D7FF9]/90"
                                    data-testid="button-discover-links"
                                >
                                    {isDiscovering ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4 mr-2" />
                                            Find Links
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                AI will scan your website to find social media links and suggest photos for your shop.
                            </p>
                        </div>

                        {/* Suggested Photos Section */}
                        {suggestedPhotos.length > 0 && (
                            <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Image className="w-5 h-5 text-amber-600" />
                                    <span className="font-semibold text-amber-900">Suggested Photos from Your Website</span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {shopPhotos.length}/9 photos used
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">
                                    AI found these photos that might work well in your shop. Click approve to add them.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {suggestedPhotos.map((photo, idx) => (
                                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-amber-200 bg-white">
                                            <img 
                                                src={photo.url} 
                                                alt={photo.reason}
                                                className="w-full aspect-square object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                                data-testid={`img-suggested-photo-${idx}`}
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                                <p className="text-white text-xs text-center line-clamp-2">{photo.reason}</p>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-green-600 hover:bg-green-700 h-8"
                                                        onClick={() => handleApprovePhoto(photo)}
                                                        disabled={approvingPhoto === photo.url || shopPhotos.length >= 9}
                                                        data-testid={`button-approve-photo-${idx}`}
                                                    >
                                                        {approvingPhoto === photo.url ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="destructive"
                                                        className="h-8"
                                                        onClick={() => handleDismissPhoto(photo)}
                                                        data-testid={`button-dismiss-photo-${idx}`}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggested Hashtags Section */}
                        {suggestedHashtags.length > 0 && (
                            <div className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Hash className="w-5 h-5 text-teal-600" />
                                    <span className="font-semibold text-teal-900">Suggested Hashtags for Reviews</span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {selectedHashtags.length}/12 selected
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">
                                    These hashtags can help customers when sharing reviews. Approve the ones you'd like to offer.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedHashtags.map((hashtag, idx) => (
                                        <div 
                                            key={idx} 
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-teal-200 text-sm"
                                            data-testid={`tag-suggested-${idx}`}
                                        >
                                            <span className="text-teal-700">{hashtag}</span>
                                            <button
                                                onClick={() => handleApproveHashtag(hashtag)}
                                                className="ml-1 p-0.5 rounded-full hover:bg-green-100 text-green-600"
                                                disabled={selectedHashtags.length >= 12}
                                                data-testid={`button-approve-hashtag-${idx}`}
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDismissHashtag(hashtag)}
                                                className="p-0.5 rounded-full hover:bg-red-100 text-red-600"
                                                data-testid={`button-dismiss-hashtag-${idx}`}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Selected Hashtags Management */}
                        <div className="p-4 rounded-lg border bg-card">
                            <div className="flex items-center gap-2 mb-3">
                                <Hash className="w-5 h-5 text-[#23C7C3]" />
                                <span className="font-semibold">Review Hashtags</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                    {selectedHashtags.length}/12 hashtags
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-4">
                                Customers can use these hashtags when sharing their reviews.
                            </p>
                            
                            {/* Add custom hashtag */}
                            <div className="flex gap-2 mb-4">
                                <Input 
                                    placeholder="Add custom hashtag..."
                                    value={newHashtag}
                                    onChange={(e) => setNewHashtag(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomHashtag()}
                                    className="flex-1"
                                    data-testid="input-new-hashtag"
                                />
                                <Button 
                                    size="sm" 
                                    onClick={handleAddCustomHashtag}
                                    disabled={!newHashtag.trim() || selectedHashtags.length >= 12}
                                    data-testid="button-add-hashtag"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                </Button>
                            </div>
                            
                            {/* Selected hashtags display */}
                            {selectedHashtags.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {selectedHashtags.map((hashtag, idx) => (
                                        <div 
                                            key={idx}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#23C7C3]/10 border border-[#23C7C3]/30 text-sm"
                                            data-testid={`tag-selected-${idx}`}
                                        >
                                            <span className="text-[#23C7C3]">{hashtag}</span>
                                            <button
                                                onClick={() => handleRemoveSelectedHashtag(hashtag)}
                                                className="ml-1 p-0.5 rounded-full hover:bg-red-100 text-red-600"
                                                data-testid={`button-remove-hashtag-${idx}`}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mb-4">
                                    No hashtags selected yet. Use AI discovery or add custom ones.
                                </p>
                            )}
                            
                            <Button 
                                onClick={handleSaveHashtags} 
                                disabled={savingHashtags}
                                className="w-full"
                                data-testid="button-save-hashtags"
                            >
                                {savingHashtags ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving Hashtags...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Save Hashtags
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {/* Business Name Display */}
                            {confirmedBusinessName && (
                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-primary" />
                                        <span className="font-semibold text-primary" data-testid="text-confirmed-business-name">{confirmedBusinessName}</span>
                                    </div>
                                </div>
                            )}

                            {/* Company Logo Section */}
                            <div className="grid gap-2">
                                <Label>Company Logo</Label>
                                <div className="flex items-center gap-4">
                                    {companyLogo ? (
                                        <div className="relative group">
                                            <img 
                                                src={companyLogo} 
                                                alt="Company Logo" 
                                                className="w-16 h-16 object-contain rounded border bg-white"
                                                data-testid="img-company-logo"
                                            />
                                            <button
                                                onClick={() => {
                                                    setCompanyLogo(null);
                                                    setIsDirty(true);
                                                }}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                data-testid="button-remove-logo"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                                            <Image className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            ref={logoFileInputRef}
                                            onChange={handleLogoUpload}
                                            accept="image/*"
                                            className="hidden"
                                            data-testid="input-logo-file"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => logoFileInputRef.current?.click()}
                                            data-testid="button-upload-logo"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDiscoverLogo}
                                            disabled={isDiscoveringLogo || !websiteUrl}
                                            data-testid="button-discover-logo"
                                        >
                                            {isDiscoveringLogo ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-4 h-4 mr-2" />
                                            )}
                                            AI Find
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Upload your logo or use AI to find it from your website. Max 2MB.
                                </p>
                            </div>

                            {/* Google Place ID - Full Width Below Business Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="google-place-id">Google Place ID</Label>
                                {config?.googlePlaceId && (
                                    <p className="text-sm text-primary font-medium truncate" data-testid="text-saved-place-id">
                                        Saved: {config.googlePlaceId}
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <Input 
                                        type="text" 
                                        id="google-place-id" 
                                        placeholder="ChIJ..."
                                        value={googlePlaceId}
                                        onChange={(e) => {
                                          setGooglePlaceId(e.target.value);
                                          setVerifiedBusiness(null);
                                        }}
                                        className="flex-1"
                                        data-testid="input-google-place-id"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Enter your business name (e.g., "Derma Floral Beauty Singapore") or paste a Google Place ID. Click "Set" to find and save your business.
                                </p>
                                <Button 
                                    onClick={handleVerifyPlaceId}
                                    disabled={isVerifyingPlace || !googlePlaceId}
                                    variant="default"
                                    className="w-full mt-2"
                                    data-testid="button-set-place-id"
                                >
                                    {isVerifyingPlace ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {isResolvingUrl ? "Resolving URL..." : "Setting..."}
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Set
                                        </>
                                    )}
                                </Button>
                                
                                {verifiedBusiness && (
                                    <div className="mt-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200" data-testid="verified-business-info">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-green-100 rounded-full">
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Verified Business</p>
                                                    {verifiedBusiness.verifiedAt && (
                                                        <p className="text-xs text-gray-500" data-testid="text-verified-at">
                                                            {verifiedBusiness.fromCache ? "Checked " : "Verified "}
                                                            {(() => {
                                                                const verifiedDate = new Date(verifiedBusiness.verifiedAt);
                                                                const now = new Date();
                                                                const diffDays = Math.floor((now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24));
                                                                if (diffDays === 0) return "today";
                                                                if (diffDays === 1) return "yesterday";
                                                                if (diffDays < 7) return `${diffDays} days ago`;
                                                                return verifiedDate.toLocaleDateString();
                                                            })()}
                                                        </p>
                                                    )}
                                                </div>
                                                <h4 className="font-semibold text-gray-900 text-lg" data-testid="text-business-name">
                                                    {verifiedBusiness.businessName || "Unknown Business"}
                                                </h4>
                                                {verifiedBusiness.address && (
                                                    <div className="flex items-start gap-1.5 mt-1.5 text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                                                        <span data-testid="text-business-address">{verifiedBusiness.address}</span>
                                                    </div>
                                                )}
                                                {verifiedBusiness.rating && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                    className={`w-4 h-4 ${i < Math.round(verifiedBusiness.rating!) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-gray-600">
                                                            {verifiedBusiness.rating.toFixed(1)} ({verifiedBusiness.totalReviews} reviews)
                                                        </span>
                                                    </div>
                                                )}
                                                {verifiedBusiness.googleMapsUrl && (
                                                    <div className="mt-3">
                                                        <a 
                                                            href={verifiedBusiness.googleMapsUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                            data-testid="link-google-maps"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            View on Google Maps
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Google Reviews URL */}
                            <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="google-reviews">Google Reviews URL</Label>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button 
                                                type="button" 
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                                data-testid="button-google-help"
                                            >
                                                <HelpCircle className="w-4 h-4" />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>How to Find Your Google Maps Link</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 text-sm">
                                                <p className="text-muted-foreground">Follow these steps to get the correct Google Maps link for your business:</p>
                                                
                                                <div className="space-y-3">
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <h4 className="font-semibold text-[#2D7FF9] mb-1">STEP 1 — Open Google Maps</h4>
                                                        <p>Go to: <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-[#2D7FF9] underline">https://maps.google.com</a></p>
                                                        <p className="text-muted-foreground">Or open the Google Maps app on your phone.</p>
                                                    </div>
                                                    
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <h4 className="font-semibold text-[#2D7FF9] mb-1">STEP 2 — Search for Your Business</h4>
                                                        <p>In the search bar, type your business name exactly as customers know it.</p>
                                                        <p className="text-muted-foreground">Example: Regrow</p>
                                                        <p>Tap <strong>Search</strong>.</p>
                                                    </div>
                                                    
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <h4 className="font-semibold text-[#2D7FF9] mb-1">STEP 3 — Select Your Business</h4>
                                                        <p>From the search results, tap your business listing. You should now see your business info page with:</p>
                                                        <ul className="list-disc list-inside text-muted-foreground mt-1">
                                                            <li>Name</li>
                                                            <li>Address</li>
                                                            <li>Photos</li>
                                                            <li>Reviews</li>
                                                        </ul>
                                                    </div>
                                                    
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <h4 className="font-semibold text-[#2D7FF9] mb-1">STEP 4 — Copy Your Business Link</h4>
                                                        <p className="font-medium">On Phone (iOS or Android):</p>
                                                        <ol className="list-decimal list-inside text-muted-foreground">
                                                            <li>Tap <strong>Share</strong></li>
                                                            <li>Tap <strong>Copy</strong> — This copies your official Google Maps business link.</li>
                                                        </ol>
                                                        <p className="font-medium mt-2">On Computer:</p>
                                                        <ol className="list-decimal list-inside text-muted-foreground">
                                                            <li>Click <strong>Share</strong></li>
                                                            <li>Click <strong>Copy Link</strong></li>
                                                        </ol>
                                                    </div>
                                                    
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <h4 className="font-semibold text-[#2D7FF9] mb-1">STEP 5 — Paste the Link Into the App</h4>
                                                        <p>Return to the app and paste the link where requested. This is all we need to identify your business.</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-3 bg-[#23C7C3]/10 border border-[#23C7C3]/30 rounded-lg text-center">
                                                    <p className="font-semibold text-[#23C7C3]">Done!</p>
                                                    <p className="text-muted-foreground">You now have the correct Google Maps business link. This link ensures the system can detect the right business name, address, and review page.</p>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                {config?.googleReviewsUrl && (
                                    <p className="text-sm text-primary font-medium truncate" data-testid="text-saved-google-reviews-url">
                                        Saved: {config.googleReviewsUrl}
                                    </p>
                                )}
                                <Input 
                                    type="url" 
                                    id="google-reviews" 
                                    placeholder="https://g.page/r/..."
                                    value={googleReviewsUrl}
                                    onChange={(e) => setGoogleReviewsUrl(e.target.value)}
                                    data-testid="input-google-reviews-url"
                                />
                            </div>

                            {/* Fetched Google Reviews Display */}
                            {fetchedReviews.length > 0 && (
                                <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        <span className="font-semibold text-amber-900">Google Reviews ({fetchedReviews.length})</span>
                                    </div>
                                    <div className="space-y-3">
                                        {fetchedReviews.map((review) => (
                                            <div key={review.id} className="p-3 bg-white rounded-lg border border-yellow-100" data-testid={`review-card-${review.id}`}>
                                                <div className="flex items-start gap-3">
                                                    {review.authorPhotoUrl && (
                                                        <img 
                                                            src={review.authorPhotoUrl} 
                                                            alt={review.authorName}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-medium text-sm truncate">{review.authorName}</span>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star 
                                                                        key={i} 
                                                                        className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {review.relativeTime && (
                                                            <p className="text-xs text-muted-foreground">{review.relativeTime}</p>
                                                        )}
                                                        {review.text && (
                                                            <p className="text-sm text-gray-700 mt-2 line-clamp-3">{review.text}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="facebook">Facebook URL</Label>
                                    {config?.facebookUrl && (
                                        <p className="text-sm text-primary font-medium truncate" data-testid="text-saved-facebook-url">
                                            Saved: {config.facebookUrl}
                                        </p>
                                    )}
                                    <Input 
                                        type="url" 
                                        id="facebook" 
                                        placeholder="https://facebook.com/..."
                                        value={fbUrl}
                                        onChange={(e) => setFbUrl(e.target.value)}
                                        data-testid="input-facebook-url"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="instagram">Instagram URL</Label>
                                    {config?.instagramUrl && (
                                        <p className="text-sm text-primary font-medium truncate" data-testid="text-saved-instagram-url">
                                            Saved: {config.instagramUrl}
                                        </p>
                                    )}
                                    <Input 
                                        type="url" 
                                        id="instagram" 
                                        placeholder="https://instagram.com/..." 
                                        value={igUrl}
                                        onChange={(e) => setIgUrl(e.target.value)}
                                        data-testid="input-instagram-url"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="xhs">XiaoHongShu URL</Label>
                                    {config?.xiaohongshuUrl && (
                                        <p className="text-sm text-primary font-medium truncate" data-testid="text-saved-xiaohongshu-url">
                                            Saved: {config.xiaohongshuUrl}
                                        </p>
                                    )}
                                    <Input 
                                        type="url" 
                                        id="xhs" 
                                        placeholder="https://xiaohongshu.com/..."
                                        value={xhsUrl}
                                        onChange={(e) => setXhsUrl(e.target.value)}
                                        data-testid="input-xiaohongshu-url"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tiktok">TikTok URL</Label>
                                    {config?.tiktokUrl && (
                                        <p className="text-sm text-primary font-medium truncate" data-testid="text-saved-tiktok-url">
                                            Saved: {config.tiktokUrl}
                                        </p>
                                    )}
                                    <Input 
                                        type="url" 
                                        id="tiktok" 
                                        placeholder="https://tiktok.com/@..."
                                        value={tiktokUrl}
                                        onChange={(e) => setTiktokUrl(e.target.value)}
                                        data-testid="input-tiktok-url"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="whatsapp">WhatsApp URL</Label>
                                    {config?.whatsappUrl && (
                                        <p className="text-sm text-primary font-medium truncate" data-testid="text-saved-whatsapp-url">
                                            Saved: {config.whatsappUrl}
                                        </p>
                                    )}
                                    <Input 
                                        type="url" 
                                        id="whatsapp" 
                                        placeholder="https://wa.me/..."
                                        value={whatsappUrl}
                                        onChange={(e) => setWhatsappUrl(e.target.value)}
                                        data-testid="input-whatsapp-url"
                                    />
                                </div>
                            </div>

                            {isDirty && (
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                                    You have unsaved changes. Please save before leaving.
                                </div>
                            )}

                            <Button 
                                onClick={handleSaveSocials} 
                                disabled={updateConfigMutation.isPending || !isDirty}
                                className={isDirty ? "bg-amber-600 hover:bg-amber-700" : ""}
                                data-testid="button-save-socials"
                            >
                                {updateConfigMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : isDirty ? (
                                    "Save Changes (Required)"
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Shop Photos Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Shop View Photos</h2>
                        <p className="text-muted-foreground">Manage the photos available for customers to select. Max 9 photos.</p>
                    </div>
                    <div className="relative">
                         <Input 
                            type="file" 
                            className="hidden" 
                            id="photo-upload" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={shopPhotos.length >= 9}
                        />
                        <Button asChild disabled={shopPhotos.length >= 9}>
                            <Label htmlFor="photo-upload" className="cursor-pointer">
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Upload Photo ({shopPhotos.length}/9)
                            </Label>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* JustShareNow Logo - Featured */}
                    <Card className="group relative overflow-hidden border-2 border-[#2D7FF9]/30 bg-gradient-to-br from-[#2D7FF9]/5 to-[#23C7C3]/5">
                         <CardContent className="p-0 aspect-square flex items-center justify-center">
                            <img 
                                src={justShareNowLogo} 
                                alt="JustShareNow Logo" 
                                className="w-full h-full object-contain p-4"
                                data-testid="img-justsharenow-logo"
                            />
                         </CardContent>
                         <div className="absolute bottom-0 left-0 right-0 bg-[#2D7FF9]/90 text-white text-xs text-center py-1">
                            JustShareNow Logo
                         </div>
                    </Card>
                    
                    {/* User Uploaded Photos */}
                    {shopPhotos.map((photo, index) => (
                        <Card key={index} className="group relative overflow-hidden">
                            <CardContent className="p-0">
                                <img src={photo} alt={`Uploaded ${index}`} className="w-full aspect-square object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="destructive" size="icon" onClick={() => removePhoto(index)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Slider Photos Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Slider Photos</h2>
                        <p className="text-muted-foreground">Manage hero carousel photos for your landing page. Max 3 photos.</p>
                    </div>
                    <div className="relative">
                        <Input 
                            ref={sliderFileInputRef}
                            type="file" 
                            className="hidden" 
                            id="slider-upload" 
                            accept="image/*"
                            onChange={handleSliderPhotoUpload}
                            disabled={sliderPhotos.length >= 3}
                        />
                        <Button asChild disabled={sliderPhotos.length >= 3}>
                            <Label htmlFor="slider-upload" className="cursor-pointer">
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Upload Photo ({sliderPhotos.length}/3)
                            </Label>
                        </Button>
                    </div>
                </div>

                {/* AI Suggested Slider Photos */}
                {suggestedSliderPhotos.length > 0 && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-violet-600" />
                            <span className="font-semibold text-violet-900">AI Suggested Slider Photos</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                                {sliderPhotos.length}/3 photos used
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                            These eye-catching photos are perfect for your hero carousel. Click approve to add them.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {suggestedSliderPhotos.map((photo, idx) => (
                                <div key={idx} className="relative group rounded-lg overflow-hidden border border-violet-200 bg-white">
                                    <img 
                                        src={photo.url} 
                                        alt={photo.reason}
                                        className="w-full aspect-video object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                        data-testid={`img-suggested-slider-${idx}`}
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                        <p className="text-white text-xs text-center line-clamp-2">{photo.reason}</p>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700 h-8"
                                                onClick={() => handleApproveSliderPhoto(photo)}
                                                disabled={approvingSliderPhoto === photo.url || sliderPhotos.length >= 3}
                                                data-testid={`button-approve-slider-${idx}`}
                                            >
                                                {approvingSliderPhoto === photo.url ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="destructive"
                                                className="h-8"
                                                onClick={() => handleDismissSliderPhoto(photo)}
                                                data-testid={`button-dismiss-slider-${idx}`}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Slider Photos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sliderPhotos.length === 0 ? (
                        <div className="col-span-3 text-center py-12 border-2 border-dashed rounded-lg">
                            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No slider photos yet.</p>
                            <p className="text-sm text-muted-foreground">Upload photos or use AI discovery to add photos for your carousel.</p>
                        </div>
                    ) : (
                        sliderPhotos.map((photo, index) => (
                            <Card key={index} className="group relative overflow-hidden">
                                <CardContent className="p-0">
                                    <img src={photo} alt={`Slider ${index + 1}`} className="w-full aspect-video object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="destructive" size="icon" onClick={() => removeSliderPhoto(index)} data-testid={`button-remove-slider-${index}`}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Crop Dialog for Slider Photos */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => {
        setCropDialogOpen(open);
        if (!open) {
          resetCropState();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5" />
              Crop Slider Photo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Adjust the crop area to fit the slider. Use a 16:9 aspect ratio for best results on desktop.
            </p>
            {imageToCrop && (
              <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Zoom</Label>
              <input
                type="range"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                min={1}
                max={3}
                step={0.1}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-muted-foreground w-12">{zoom.toFixed(1)}x</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCropCancel}>
                Cancel
              </Button>
              <Button onClick={handleCropConfirm} data-testid="button-confirm-crop">
                <Check className="w-4 h-4 mr-2" />
                Crop & Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
