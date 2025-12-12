import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Copy, RefreshCw, Share2, X, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStoreConfig, trackPlatformClick, saveTestimonial } from "@/lib/api";

const allPlatforms = [
  { 
    id: 'google-reviews', 
    name: 'Google Reviews', 
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200', 
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600',
    actionType: 'review',
    configKey: 'googleReviewsUrl' as const
  },
  { 
    id: 'xiaohongshu', 
    name: 'XiaoHongShu', 
    color: 'bg-red-50 hover:bg-red-100 border-red-200', 
    textColor: 'text-red-700',
    iconColor: 'text-red-600',
    actionType: 'share',
    configKey: 'xiaohongshuUrl' as const
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    color: 'bg-pink-50 hover:bg-pink-100 border-pink-200', 
    textColor: 'text-pink-700',
    iconColor: 'text-pink-600',
    actionType: 'share',
    configKey: 'instagramUrl' as const
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    color: 'bg-[#2D7FF9]/5 hover:bg-[#2D7FF9]/10 border-[#2D7FF9]/20', 
    textColor: 'text-[#2D7FF9]',
    iconColor: 'text-[#2D7FF9]',
    actionType: 'share',
    configKey: 'facebookUrl' as const
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    color: 'bg-slate-50 hover:bg-slate-100 border-slate-200', 
    textColor: 'text-slate-700',
    iconColor: 'text-slate-600',
    actionType: 'share',
    configKey: 'tiktokUrl' as const
  },
  { 
    id: 'whatsapp', 
    name: 'WhatsApp', 
    color: 'bg-green-50 hover:bg-green-100 border-green-200', 
    textColor: 'text-green-700',
    iconColor: 'text-green-600',
    actionType: 'contact',
    configKey: 'whatsappUrl' as const,
    icon: <MessageCircle className="w-5 h-5" />
  }
];

export default function CustomerPlatform() {
  const { language, selectedReview, selectedPhoto, incrementStat, setSelectedPhoto, setSelectedReview } = useStore();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const t = translations[language];

  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });

  const availablePlatforms = useMemo(() => {
    if (!config) return [];
    return allPlatforms.filter(platform => {
      if (platform.id === 'google-reviews') {
        return (config.googlePlaceId && config.googlePlaceId.trim() !== '') || 
               (config.googleReviewsUrl && config.googleReviewsUrl.trim() !== '');
      }
      const url = config[platform.configKey];
      return url && url.trim() !== '';
    });
  }, [config]);

  const [activePlatform, setActivePlatform] = useState<typeof allPlatforms[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [instagramRating, setInstagramRating] = useState(0);
  const [instagramSubmitting, setInstagramSubmitting] = useState(false);
  const [facebookRating, setFacebookRating] = useState(0);
  const [facebookSubmitting, setFacebookSubmitting] = useState(false);
  const [facebookAutoCopied, setFacebookAutoCopied] = useState(false);

  // Auto-copy review text when Facebook modal opens (only once per modal session)
  useEffect(() => {
    if (isModalOpen && activePlatform?.id === 'facebook' && selectedReview && !facebookAutoCopied) {
      setFacebookAutoCopied(true);
      navigator.clipboard.writeText(selectedReview).then(() => {
        toast({
          title: t.common.copied,
          description: t.customer.platform.everythingCopied || "Everything copied. Paste when Facebook opens.",
        });
      }).catch((err) => {
        console.warn("Auto-copy failed:", err);
      });
    }
  }, [isModalOpen, activePlatform?.id, selectedReview, facebookAutoCopied]);

  const handlePlatformClick = (platform: typeof allPlatforms[0]) => {
    // Reset all platform-specific states when opening modal
    setInstagramRating(0);
    setFacebookRating(0);
    setFacebookAutoCopied(false);
    setActivePlatform(platform);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setActivePlatform(null);
    setInstagramRating(0);
    setFacebookRating(0);
    setFacebookAutoCopied(false);
  };

  const handleSwitch = () => {
    setIsModalOpen(false);
    setSelectedPhoto("");
    setSelectedReview("");
    setLocation('/drafting');
  };

  const getPlatformUrl = (platformId: string) => {
    if (!config) return null;
    switch (platformId) {
      case 'google-reviews': return config.googleReviewsUrl;
      case 'facebook': return config.facebookUrl;
      case 'instagram': return config.instagramUrl;
      case 'xiaohongshu': return config.xiaohongshuUrl;
      case 'tiktok': return config.tiktokUrl;
      case 'whatsapp': return config.whatsappUrl;
      default: return null;
    }
  };

  const handleReviewAction = async () => {
    if (activePlatform?.id === 'google-reviews') {
      if (config?.googlePlaceId && selectedReview) {
        const prefilledUrl = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(config.googlePlaceId)}&review=${encodeURIComponent(selectedReview)}`;
        window.open(prefilledUrl, '_blank');
      } else if (config?.googlePlaceId) {
        const reviewUrl = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(config.googlePlaceId)}`;
        window.open(reviewUrl, '_blank');
      } else {
        const url = getPlatformUrl('google-reviews');
        if (url) {
          window.open(url, '_blank');
        }
      }
    }
    incrementStat(activePlatform?.id || 'unknown');
    try {
      await trackPlatformClick(activePlatform?.id || 'unknown');
    } catch (e) {
      console.error("Failed to track click:", e);
    }
  };

  const handleShareAction = async () => {
    if (selectedReview) {
      try {
        await navigator.clipboard.writeText(selectedReview);
        toast({
          title: t.common.copied,
          description: t.customer.platform.reviewCopied,
        });
      } catch (clipboardErr) {
        console.warn("Clipboard write failed:", clipboardErr);
      }
    }
    
    const url = getPlatformUrl(activePlatform?.id || '');
    if (url) {
      window.open(url, '_blank');
    }
    
    incrementStat(activePlatform?.id || 'unknown');
    try {
      await trackPlatformClick(activePlatform?.id || 'unknown');
    } catch (e) {
      console.error("Failed to track click:", e);
    }
  };

  const handleContactAction = async () => {
    const url = getPlatformUrl(activePlatform?.id || '');
    if (url) {
      window.open(url, '_blank');
    }
    
    incrementStat(activePlatform?.id || 'unknown');
    try {
      await trackPlatformClick(activePlatform?.id || 'unknown');
    } catch (e) {
      console.error("Failed to track click:", e);
    }
  };

  const handleInstagramSubmit = async () => {
    if (instagramRating === 0) {
      toast({
        title: t.customer.platform.selectRating,
        variant: "destructive",
      });
      return;
    }

    const instagramUrl = getPlatformUrl('instagram');
    if (!instagramUrl) {
      toast({
        title: t.common.error || "Error",
        description: t.customer.platform.noPlatforms,
        variant: "destructive",
      });
      return;
    }

    setInstagramSubmitting(true);
    
    try {
      // Try to save testimonial if we have a business ID (graceful degradation)
      if (config?.googlePlaceId) {
        try {
          await saveTestimonial({
            placeId: config.googlePlaceId,
            platform: 'instagram',
            rating: instagramRating,
            reviewText: selectedReview || null,
            photoUrl: selectedPhoto || null,
            language: language,
          });
        } catch (saveError) {
          // Log error but continue to Instagram - don't block the user
          console.warn("Failed to save testimonial:", saveError);
        }
      }
      
      // Copy review text to clipboard with fallback
      if (selectedReview) {
        try {
          await navigator.clipboard.writeText(selectedReview);
          toast({
            title: t.common.copied,
            description: t.customer.platform.reviewCopied,
          });
        } catch (clipboardErr) {
          console.warn("Clipboard write failed:", clipboardErr);
        }
      }
      
      // Open Instagram profile
      window.open(instagramUrl, '_blank');
      
      incrementStat('instagram');
      await trackPlatformClick('instagram');
      
      handleClose();
    } catch (e) {
      console.error("Instagram flow error:", e);
      toast({
        title: t.common.error || "Error",
        variant: "destructive",
      });
    } finally {
      setInstagramSubmitting(false);
    }
  };

  const handleFacebookSubmit = async () => {
    if (facebookRating === 0) {
      toast({
        title: t.customer.platform.selectRating,
        variant: "destructive",
      });
      return;
    }

    const facebookUrl = getPlatformUrl('facebook');
    if (!facebookUrl) {
      toast({
        title: t.common.error || "Error",
        description: t.customer.platform.noPlatforms,
        variant: "destructive",
      });
      return;
    }

    setFacebookSubmitting(true);
    
    try {
      // 1. Save testimonial if we have a business ID (graceful degradation)
      if (config?.googlePlaceId) {
        try {
          await saveTestimonial({
            placeId: config.googlePlaceId,
            platform: 'facebook',
            rating: facebookRating,
            reviewText: selectedReview || null,
            photoUrl: selectedPhoto || null,
            language: language,
          });
        } catch (saveError) {
          console.warn("Failed to save testimonial:", saveError);
        }
      }
      
      // 2. Copy text to clipboard again to ensure it's ready
      if (selectedReview) {
        try {
          await navigator.clipboard.writeText(selectedReview);
        } catch (clipboardErr) {
          console.warn("Clipboard write failed:", clipboardErr);
        }
      }
      
      // 3. Build reviews URL - append /reviews if not already present
      let reviewsUrl = facebookUrl;
      try {
        const urlObj = new URL(facebookUrl);
        if (!urlObj.pathname.includes('/reviews')) {
          urlObj.pathname = urlObj.pathname.replace(/\/?$/, '/reviews');
        }
        reviewsUrl = urlObj.toString();
      } catch {
        if (!reviewsUrl.includes('/reviews')) {
          reviewsUrl = reviewsUrl.replace(/\/?(\?.*)?$/, '/reviews$1');
        }
      }
      
      // 4. Open Facebook reviews page
      window.open(reviewsUrl, '_blank');
      
      incrementStat('facebook');
      await trackPlatformClick('facebook');
      
      handleClose();
    } catch (e) {
      console.error("Facebook flow error:", e);
      toast({
        title: t.common.error || "Error",
        variant: "destructive",
      });
    } finally {
      setFacebookSubmitting(false);
    }
  };

  if (!selectedReview || !selectedPhoto) {
    setLocation('/drafting');
    return null;
  }

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:bg-transparent text-muted-foreground" 
          onClick={() => setLocation('/drafting')}
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          {t.common.back}
        </Button>

        <div className="mb-8 animate-in-slide-up">
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">{t.customer.platform.title}</h1>
            <p className="text-muted-foreground">{t.customer.platform.instruction}</p>
        </div>

        {availablePlatforms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t.customer.platform.noPlatforms}</p>
            <p className="text-sm mt-2">{t.customer.platform.askOwner}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 animate-in-slide-up" style={{ animationDelay: '100ms' }}>
              {availablePlatforms.map((platform) => (
                  <button
                      key={platform.id}
                      onClick={() => handlePlatformClick(platform)}
                      className={`
                          w-full p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group
                          ${platform.color}
                      `}
                      data-testid={`button-platform-${platform.id}`}
                  >
                      <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${platform.iconColor}`}>
                              {platform.icon || <ExternalLink className="w-5 h-5" />}
                          </div>
                          <div className="text-left">
                              <span className={`block font-bold ${platform.textColor}`}>{platform.name}</span>
                              <span className="text-xs text-muted-foreground/80">
                                  {platform.actionType === 'review' ? t.customer.platform.leaveReview : 
                                   platform.actionType === 'contact' ? t.customer.platform.contactUs : t.customer.platform.shareExperience}
                              </span>
                          </div>
                      </div>
                  </button>
              ))}
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsModalOpen(true); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>{activePlatform?.name}</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose} data-testid="button-close-modal">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    
                    {activePlatform?.id === 'google-reviews' && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                {t.customer.platform.googleFeedback}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={handleSwitch} className="h-12" data-testid="button-switch">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {t.common.switch}
                                </Button>
                                <Button onClick={handleReviewAction} className="h-12 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-review">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {t.customer.platform.leaveReview}
                                </Button>
                            </div>
                        </div>
                    )}

                    {activePlatform?.id === 'xiaohongshu' && (
                         <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                {t.customer.platform.copyXHS}
                            </p>
                            <Button onClick={handleShareAction} className="h-12 bg-red-600 hover:bg-red-700 text-white w-full" data-testid="button-share-xhs">
                                <Copy className="mr-2 h-4 w-4" />
                                {t.customer.platform.copyShare}
                            </Button>
                        </div>
                    )}

                    {activePlatform?.id === 'facebook' && (
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-center font-medium text-foreground">
                                {t.customer.platform.facebookThankYou}
                            </p>
                            
                            {/* Preview of selected content */}
                            <div className="p-3 rounded-lg bg-gray-50 border">
                                {selectedPhoto && (
                                    <div className="w-full h-24 rounded-md overflow-hidden mb-2">
                                        <img src={selectedPhoto} alt="Selected" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                {selectedReview && (
                                    <p className="text-xs text-gray-600 line-clamp-3">{selectedReview}</p>
                                )}
                            </div>
                            
                            {/* Star rating selector */}
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-sm text-muted-foreground">
                                    {t.customer.platform.rateExperience}
                                </p>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setFacebookRating(star)}
                                            className="p-1 transition-transform hover:scale-110"
                                            data-testid={`button-fb-star-${star}`}
                                        >
                                            <Star 
                                                className={`w-7 h-7 ${
                                                    star <= facebookRating 
                                                        ? 'fill-yellow-400 text-yellow-400' 
                                                        : 'text-gray-300'
                                                }`} 
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Single action button */}
                            <Button 
                                onClick={handleFacebookSubmit} 
                                className="h-12 w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                                disabled={facebookRating === 0 || facebookSubmitting}
                                data-testid="button-post-facebook"
                            >
                                {facebookSubmitting ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                )}
                                {t.customer.platform.postOnFacebook || "Post on Facebook Reviews"}
                            </Button>
                            
                            <p className="text-xs text-muted-foreground text-center">
                                {t.customer.platform.facebookNote}
                            </p>
                        </div>
                    )}

                    {activePlatform?.id === 'instagram' && (
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-muted-foreground text-center">
                                {t.customer.platform.rateExperience || "How was your experience?"}
                            </p>
                            
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setInstagramRating(star)}
                                        className="p-1 transition-transform hover:scale-110"
                                        data-testid={`button-star-${star}`}
                                    >
                                        <Star 
                                            className={`w-8 h-8 ${
                                                star <= instagramRating 
                                                    ? 'fill-yellow-400 text-yellow-400' 
                                                    : 'text-gray-300'
                                            }`} 
                                        />
                                    </button>
                                ))}
                            </div>
                            
                            <p className="text-xs text-muted-foreground text-center">
                                {t.customer.platform.instagramNote || "Your review will be saved. Then you'll be directed to Instagram."}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <Button variant="outline" onClick={handleSwitch} className="h-12" data-testid="button-switch-instagram">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {t.common.switch}
                                </Button>
                                <Button 
                                    onClick={handleInstagramSubmit} 
                                    className="h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white"
                                    disabled={instagramRating === 0 || instagramSubmitting}
                                    data-testid="button-submit-instagram"
                                >
                                    {instagramSubmitting ? (
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Share2 className="mr-2 h-4 w-4" />
                                    )}
                                    {t.customer.platform.goToInstagram || "Go to Instagram"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {activePlatform?.id === 'tiktok' && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                {t.customer.platform.shareTikTok}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={handleSwitch} className="h-12" data-testid="button-switch">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {t.common.switch}
                                </Button>
                                <Button onClick={handleShareAction} className="h-12 bg-slate-800 hover:bg-slate-900 text-white" data-testid="button-share-tiktok">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    {t.common.share}
                                </Button>
                            </div>
                        </div>
                    )}

                    {activePlatform?.id === 'whatsapp' && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                {t.customer.platform.chatWhatsApp}
                            </p>
                            <Button onClick={handleContactAction} className="h-12 bg-green-600 hover:bg-green-700 text-white w-full" data-testid="button-contact-whatsapp">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                {t.customer.platform.openWhatsApp}
                            </Button>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
