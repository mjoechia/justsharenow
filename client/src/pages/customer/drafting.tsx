import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, RefreshCw, Share2, ExternalLink, Copy, Hash, MessageCircle, Download, Clipboard, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getStoreConfig, trackPlatformClick, saveTestimonial } from "@/lib/api";

import regrowLogo from "@assets/generated_images/regrow_group_corporate_logo.png";
import justShareNowLogo from "@assets/justsharenow_logo_1765236628260.jpg";

const formatForXiaohongshu = (review: string, hashtags: string[], businessName?: string): string => {
  const stars = "⭐️⭐️⭐️⭐️⭐️";
  const hashtagText = hashtags.length > 0 ? hashtags.join(' ') : '#真实测评 #推荐 #探店';
  
  return `真实体验分享✨

📍 商家：${businessName || 'XXX'}
💬 体验：${review}
${stars}

${hashtagText}

收藏不迷路 ❤️`;
};

const openXiaohongshu = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  
  if (isIOS) {
    window.location.href = "xhsdiscover://";
    setTimeout(() => {
      window.open("https://apps.apple.com/app/id741292507", "_blank");
    }, 2000);
  } else if (isAndroid) {
    window.location.href = "intent://#Intent;scheme=xhsdiscover;package=com.xingin.xhs;end";
    setTimeout(() => {
      window.open("https://play.google.com/store/apps/details?id=com.xingin.xhs", "_blank");
    }, 2000);
  } else {
    window.open("https://www.xiaohongshu.com", "_blank");
  }
};

const generateReviewsFromHashtags = (hashtags: string[], setIndex: number): string[] => {
  if (hashtags.length === 0) {
    return [];
  }
  
  const cleanTags = hashtags.map(h => h.replace('#', '').trim());
  const primaryTag = cleanTags[0] || '';
  const secondaryTag = cleanTags[1] || primaryTag;
  const allTags = hashtags.slice(0, 4).join(' ');
  
  const reviewTemplates = [
    [
      `Amazing ${primaryTag} experience! The results exceeded my expectations. The ${secondaryTag} treatment was exactly what I needed. Highly recommend!`,
      `Professional ${primaryTag} service! Will definitely come back for more ${secondaryTag} sessions. The transformation is incredible!`,
      `Best ${primaryTag} decision I made! The quality of ${secondaryTag} here is unmatched. Worth every penny!`,
    ],
    [
      `Absolutely love the ${primaryTag} results! The team was so professional and caring. Perfect ${secondaryTag} treatment!`,
      `Such a wonderful ${primaryTag} experience from start to finish! The ${secondaryTag} service is top-notch!`,
      `Truly exceptional ${primaryTag}! I can't stop recommending their ${secondaryTag} services to everyone!`,
    ],
    [
      `Life-changing ${primaryTag} results! The staff are true professionals in ${secondaryTag}. I'm so happy!`,
      `Exceeded all my ${primaryTag} expectations! The ${secondaryTag} quality here is amazing!`,
      `Outstanding ${primaryTag} service! Best ${secondaryTag} experience I've ever had. Will be back!`,
    ],
  ];
  
  const templateSet = reviewTemplates[setIndex % reviewTemplates.length];
  
  return templateSet.map(review => `${review}\n\n${allTags}`);
};

const allPlatforms = [
  { 
    id: 'google-reviews', 
    name: 'Google Reviews', 
    actionType: 'review',
    configKey: 'googleReviewsUrl' as const
  },
  { 
    id: 'xiaohongshu', 
    name: 'XiaoHongShu', 
    actionType: 'share',
    configKey: 'xiaohongshuUrl' as const
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    actionType: 'share',
    configKey: 'instagramUrl' as const
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    actionType: 'share',
    configKey: 'facebookUrl' as const
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    actionType: 'share',
    configKey: 'tiktokUrl' as const
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    actionType: 'contact',
    configKey: 'whatsappUrl' as const
  }
];


export default function CustomerDrafting() {
  const { language, setSelectedReview, setSelectedPhoto, selectedPhoto, selectedReview, selectedPlatform, setSelectedPlatform } = useStore();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewSetIndex, setReviewSetIndex] = useState(0);
  const [photoSetIndex, setPhotoSetIndex] = useState(0);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [facebookRating, setFacebookRating] = useState(0);
  const [facebookSubmitting, setFacebookSubmitting] = useState(false);
  const [facebookAutoCopied, setFacebookAutoCopied] = useState(false);
  const [modalView, setModalView] = useState<'platforms' | 'action'>('platforms');
  const [xhsCopied, setXhsCopied] = useState(false);
  
  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });
  
  const socialLinks = {
    googleReviews: config?.googleReviewsUrl || "",
    googlePlaceId: config?.googlePlaceId || "",
    facebook: config?.facebookUrl || "",
    instagram: config?.instagramUrl || "",
    xiaohongshu: config?.xiaohongshuUrl || "",
    tiktok: config?.tiktokUrl || "",
    whatsapp: config?.whatsappUrl || "",
  };
  
  const availableHashtags = config?.reviewHashtags || [];
  const shopPhotos = config?.shopPhotos || [];
  
  const displayPhotos = useMemo(() => {
    if (shopPhotos.length === 0) {
      return [{ id: 'logo', src: justShareNowLogo, label: 'JustShareNow' }];
    }
    
    const photosPerPage = 2;
    const startIndex = (photoSetIndex * photosPerPage) % shopPhotos.length;
    const selectedPhotos: { id: string; src: string; label: string }[] = [];
    
    for (let i = 0; i < Math.min(photosPerPage, shopPhotos.length); i++) {
      const idx = (startIndex + i) % shopPhotos.length;
      selectedPhotos.push({
        id: `photo-${idx}`,
        src: shopPhotos[idx],
        label: `Photo ${idx + 1}`,
      });
    }
    
    return selectedPhotos;
  }, [shopPhotos, photoSetIndex]);
  
  const generatedReviews = useMemo(() => {
    return generateReviewsFromHashtags(availableHashtags, reviewSetIndex);
  }, [availableHashtags, reviewSetIndex]);
  
  const toggleHashtag = (hashtag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(hashtag) 
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    );
  };
  
  const getReviewWithHashtags = () => {
    if (!selectedReview) return "";
    if (selectedHashtags.length === 0) return selectedReview;
    return `${selectedReview}\n\n${selectedHashtags.join(' ')}`;
  };
  
  const t = translations[language];
  
  const availablePlatforms = useMemo(() => {
    if (!config) return [];
    return allPlatforms.filter(platform => {
      const url = config[platform.configKey];
      return url && url.trim() !== '';
    });
  }, [config]);
  
  const activePlatform = allPlatforms.find(p => p.id === selectedPlatform);
  const currentReviews = generatedReviews.length > 0 
    ? generatedReviews 
    : t.customer.drafting.reviewSets[reviewSetIndex];

  useEffect(() => {
    if (isModalOpen && modalView === 'action' && activePlatform?.id === 'facebook' && selectedReview && !facebookAutoCopied) {
      setFacebookAutoCopied(true);
      const reviewText = getReviewWithHashtags();
      navigator.clipboard.writeText(reviewText).then(() => {
        toast({
          title: t.common.copied,
          description: t.customer.platform?.everythingCopied || "Everything copied. Paste when Facebook opens.",
        });
      }).catch((err) => {
        console.warn("Auto-copy failed:", err);
      });
    }
  }, [isModalOpen, modalView, activePlatform?.id, selectedReview, facebookAutoCopied]);

  // XHS auto-copy when modal opens
  useEffect(() => {
    if (isModalOpen && modalView === 'action' && activePlatform?.id === 'xiaohongshu' && selectedReview && !xhsCopied) {
      setXhsCopied(true);
      const formattedText = formatForXiaohongshu(
        selectedReview,
        selectedHashtags,
        config?.businessName || undefined
      );
      navigator.clipboard.writeText(formattedText).then(() => {
        toast({
          title: "✅ 内容已复制",
          description: "打开小红书后直接粘贴发布",
        });
      }).catch((err) => {
        console.warn("XHS auto-copy failed:", err);
      });
    }
  }, [isModalOpen, modalView, activePlatform?.id, selectedReview, xhsCopied, selectedHashtags, config?.businessName]);
  
  const handleNext = () => {
    if (selectedPhoto && selectedReview) {
      setFacebookRating(0);
      setFacebookAutoCopied(false);
      setXhsCopied(false);
      // If platform already selected from Shop View, go directly to action
      if (selectedPlatform) {
        setModalView('action');
      } else {
        setModalView('platforms');
      }
      setIsModalOpen(true);
    }
  };

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setModalView('action');
  };

  const handleBackToPlatforms = () => {
    setModalView('platforms');
    setSelectedPlatform('');
    setFacebookRating(0);
    setFacebookAutoCopied(false);
    setXhsCopied(false);
  };

  const handleSwitch = () => {
    setSelectedReview("");
    setSelectedHashtags([]);
    
    // Calculate next photo set index
    const nextPhotoSetIndex = shopPhotos.length > 0 ? photoSetIndex + 1 : 0;
    setPhotoSetIndex(nextPhotoSetIndex);
    
    // Auto-select first photo of new set
    if (shopPhotos.length > 0) {
      const photosPerPage = 2;
      const startIndex = (nextPhotoSetIndex * photosPerPage) % shopPhotos.length;
      setSelectedPhoto(shopPhotos[startIndex]);
    } else {
      setSelectedPhoto(justShareNowLogo);
    }
    
    // Rotate to next review set
    const totalSets = generatedReviews.length > 0 ? 3 : t.customer.drafting.reviewSets.length;
    setReviewSetIndex((prev) => (prev + 1) % totalSets);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsModalOpen(false);
    
    toast({
      title: t.customer.drafting.switched,
      description: t.customer.drafting.newPhotosReady,
    });
  };

  const handleReviewAction = async () => {
    if (activePlatform?.id === 'google-reviews') {
      const reviewText = getReviewWithHashtags();
      
      // Copy review text to clipboard first
      if (reviewText) {
        await navigator.clipboard.writeText(reviewText);
        toast({
          title: t.customer.drafting.reviewCopied,
          description: t.customer.drafting.pasteInGoogle,
        });
      }
      
      // Open Google Reviews page
      if (socialLinks.googlePlaceId) {
        const reviewUrl = `https://search.google.com/local/writereview?placeid=${socialLinks.googlePlaceId}`;
        window.open(reviewUrl, '_blank');
      } else {
        const url = socialLinks.googleReviews || "https://www.google.com/maps";
        window.open(url, '_blank');
      }
    }
    if (activePlatform?.id) {
      await trackPlatformClick(activePlatform.id);
    }
    setIsModalOpen(false);
  };

  const handleDownloadPhoto = async () => {
    if (!selectedPhoto) return;
    
    try {
      const response = await fetch(selectedPhoto);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'review-photo.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t.customer.drafting.photoDownloaded,
        description: t.customer.drafting.uploadPhoto,
      });
    } catch (e) {
      // Fallback: open in new tab
      window.open(selectedPhoto, '_blank');
      toast({
        title: t.customer.drafting.photoOpened,
        description: t.customer.drafting.savePhoto,
      });
    }
  };

  const handleCopyReview = async () => {
    const reviewText = getReviewWithHashtags();
    if (reviewText) {
      await navigator.clipboard.writeText(reviewText);
      toast({
        title: t.common.copied,
        description: t.customer.drafting.pasteInGoogle,
      });
    }
  };

  const handleShareAction = async () => {
    // Get the platform URL first - if not available, show error
    let url = "";
    const platformId = activePlatform?.id;
    
    switch (platformId) {
      case 'facebook':
        url = socialLinks.facebook;
        if (url && !url.includes('/reviews')) {
          try {
            const urlObj = new URL(url);
            urlObj.pathname = urlObj.pathname.replace(/\/?$/, '/reviews');
            url = urlObj.toString();
          } catch {
            url = url.replace(/\/?(\?.*)?$/, '/reviews$1');
          }
        }
        break;
      case 'instagram':
        url = socialLinks.instagram;
        break;
      case 'xiaohongshu':
        url = socialLinks.xiaohongshu;
        break;
      case 'tiktok':
        url = socialLinks.tiktok;
        break;
    }
    
    if (!url) {
      toast({
        title: t.common.error || "Error",
        description: `No URL configured for ${activePlatform?.name || 'this platform'}`,
        variant: "destructive",
      });
      return;
    }
    
    // Copy text to clipboard
    const textToCopy = getReviewWithHashtags();
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        toast({
          title: t.common.copied,
          description: t.customer.drafting.textCopiedReady,
        });
      } catch (e) {
        console.warn("Clipboard write failed:", e);
      }
    }
    
    // Open the platform URL
    window.open(url, '_blank');
    
    if (platformId) {
      await trackPlatformClick(platformId);
    }
    setIsModalOpen(false);
  };

  const handleContactAction = async () => {
    let url = "";
    if (activePlatform?.id === 'whatsapp') {
      url = socialLinks.whatsapp || "";
    }
    if (url) window.open(url, '_blank');
    if (activePlatform?.id) {
      await trackPlatformClick(activePlatform.id);
    }
    setIsModalOpen(false);
  };

  const handleXiaohongshuAction = async () => {
    const formattedText = formatForXiaohongshu(
      selectedReview || '',
      selectedHashtags,
      config?.businessName || undefined
    );
    
    try {
      await navigator.clipboard.writeText(formattedText);
      setXhsCopied(true);
      toast({
        title: "✅ 内容已复制",
        description: "打开小红书后直接粘贴发布",
      });
    } catch (e) {
      console.warn("Clipboard failed:", e);
    }
    
    await trackPlatformClick('xiaohongshu');
    
    setTimeout(() => {
      openXiaohongshu();
      setIsModalOpen(false);
    }, 800);
  };

  const handleFacebookSubmit = async () => {
    if (facebookRating === 0) {
      toast({
        title: t.customer.platform?.selectRating || "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    const facebookUrl = socialLinks.facebook;
    if (!facebookUrl) {
      toast({
        title: t.common.error || "Error",
        description: t.customer.platform?.noPlatforms || "No Facebook URL configured",
        variant: "destructive",
      });
      return;
    }

    setFacebookSubmitting(true);
    
    try {
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
      
      const reviewText = getReviewWithHashtags();
      if (reviewText) {
        try {
          await navigator.clipboard.writeText(reviewText);
        } catch (clipboardErr) {
          console.warn("Clipboard write failed:", clipboardErr);
        }
      }
      
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
      
      window.open(reviewsUrl, '_blank');
      
      await trackPlatformClick('facebook');
      
      setIsModalOpen(false);
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

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-8 pb-32">
        <div className="text-center mb-8 animate-in-slide-up">
          <img src={regrowLogo} alt="Regrow" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">{t.customer.drafting.title}</h1>
          <p className="text-muted-foreground text-sm">{t.customer.drafting.subtitle}</p>
        </div>

        {/* Photo Selection */}
        <section className="mb-8 animate-in-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 ml-1">
            {t.customer.drafting.selectPhoto}
          </h2>
          <div className={`grid gap-3 ${displayPhotos.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-2'}`}>
            {displayPhotos.map((photo) => (
              <div 
                key={photo.id}
                onClick={() => setSelectedPhoto(photo.src)}
                data-testid={`photo-${photo.id}`}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
                  selectedPhoto === photo.src 
                    ? 'border-primary ring-2 ring-primary/20 scale-95' 
                    : 'border-transparent hover:border-border'
                }`}
              >
                <img src={photo.src} alt={photo.label} className="w-full h-full object-cover" />
                {selectedPhoto === photo.src && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-xs">
                    <div className="bg-white text-primary rounded-full p-1 shadow-lg">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Review Selection */}
        <section className="mb-8 animate-in-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 ml-1">
            {t.customer.drafting.selectReview}
          </h2>
          <div className="space-y-3">
            {currentReviews.map((review, idx) => (
              <Card 
                key={`${reviewSetIndex}-${idx}`}
                onClick={() => setSelectedReview(review)}
                className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedReview === review 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm leading-relaxed text-foreground">{review}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Hashtags Section */}
        {availableHashtags.length > 0 && (
          <section className="mb-8 animate-in-slide-up" style={{ animationDelay: '300ms' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 ml-1 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              {t.customer.drafting.addHashtags}
            </h2>
            <div className="flex flex-wrap gap-2">
              {availableHashtags.map((hashtag, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleHashtag(hashtag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedHashtags.includes(hashtag)
                      ? 'bg-[#23C7C3] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-[#23C7C3]/10 hover:text-[#23C7C3]'
                  }`}
                  data-testid={`button-hashtag-${idx}`}
                >
                  {hashtag}
                </button>
              ))}
            </div>
            {selectedHashtags.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedHashtags.length} {t.customer.drafting.hashtagsAdded}
              </p>
            )}
          </section>
        )}
      </div>

      {/* Floating Action Button Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t z-10">
        <div className="container max-w-md mx-auto flex gap-3">
          <Button 
            variant="outline"
            className="flex-1 h-12 text-base font-medium"
            onClick={handleSwitch}
          >
            <RefreshCw className="mr-2 w-4 h-4" />
            {t.common.switch}
          </Button>
          
          <Button 
            className="flex-1 h-12 text-base font-medium shadow-lg shadow-primary/20" 
            onClick={handleNext}
            disabled={!selectedPhoto || !selectedReview}
          >
            {t.common.share}
            <Share2 className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Modal for sharing */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="share-modal">
          <div className="flex flex-col items-center gap-4 py-4">
            
            {/* Platform Selection View */}
            {modalView === 'platforms' && (
              <>
                <DialogTitle className="text-xl font-bold text-center">
                  {t.customer.platform?.title || "Choose a Platform"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground text-center">
                  {t.customer.platform?.instruction || "Select where you'd like to share"}
                </p>
                
                {availablePlatforms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t.customer.platform?.noPlatforms || "No platforms configured"}</p>
                  </div>
                ) : (
                  <div className="w-full space-y-3">
                    {availablePlatforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => handlePlatformSelect(platform.id)}
                        className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 hover:shadow-md ${
                          platform.id === 'google-reviews' ? 'bg-blue-50 hover:bg-blue-100 border-blue-200' :
                          platform.id === 'facebook' ? 'bg-[#2D7FF9]/5 hover:bg-[#2D7FF9]/10 border-[#2D7FF9]/20' :
                          platform.id === 'instagram' ? 'bg-pink-50 hover:bg-pink-100 border-pink-200' :
                          platform.id === 'xiaohongshu' ? 'bg-red-50 hover:bg-red-100 border-red-200' :
                          platform.id === 'tiktok' ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' :
                          'bg-green-50 hover:bg-green-100 border-green-200'
                        }`}
                        data-testid={`button-platform-${platform.id}`}
                      >
                        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${
                          platform.id === 'google-reviews' ? 'text-blue-600' :
                          platform.id === 'facebook' ? 'text-[#2D7FF9]' :
                          platform.id === 'instagram' ? 'text-pink-600' :
                          platform.id === 'xiaohongshu' ? 'text-red-600' :
                          platform.id === 'tiktok' ? 'text-slate-600' :
                          'text-green-600'
                        }`}>
                          {platform.id === 'whatsapp' ? <MessageCircle className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                        </div>
                        <div className="text-left">
                          <span className={`block font-bold ${
                            platform.id === 'google-reviews' ? 'text-blue-700' :
                            platform.id === 'facebook' ? 'text-[#2D7FF9]' :
                            platform.id === 'instagram' ? 'text-pink-700' :
                            platform.id === 'xiaohongshu' ? 'text-red-700' :
                            platform.id === 'tiktok' ? 'text-slate-700' :
                            'text-green-700'
                          }`}>{platform.name}</span>
                          <span className="text-xs text-muted-foreground/80">
                            {platform.actionType === 'review' ? (t.customer.platform?.leaveReview || 'Leave a review') : 
                             platform.actionType === 'contact' ? (t.customer.platform?.contactUs || 'Contact us') : 
                             (t.customer.platform?.shareExperience || 'Share your experience')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Platform Action View */}
            {modalView === 'action' && (
              <>
                <DialogTitle className="text-xl font-bold text-center">{activePlatform?.name}</DialogTitle>
            
            {/* Google Review */}
            {activePlatform?.id === 'google-reviews' && (
              <>
                <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 text-center mb-3">
                    📋 {t.customer.drafting.reviewCopiedAuto}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-blue-700">
                    <span className="bg-blue-100 px-2 py-1 rounded-full">{t.customer.drafting.step1}</span>
                    <span>→</span>
                    <span className="bg-blue-100 px-2 py-1 rounded-full">{t.customer.drafting.step2}</span>
                    <span>→</span>
                    <span className="bg-blue-100 px-2 py-1 rounded-full">{t.customer.drafting.step3}</span>
                  </div>
                </div>
                
                {/* Selected photo with download button */}
                {selectedPhoto && (
                  <div className="w-full">
                    <p className="text-xs text-muted-foreground mb-2 text-center font-medium">
                      📷 {t.customer.drafting.yourPhoto}
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <img 
                        src={selectedPhoto} 
                        alt="Selected photo" 
                        className="w-24 h-24 object-cover rounded-lg border-2 border-primary/20 shadow-sm"
                        data-testid="img-selected-photo-preview"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDownloadPhoto}
                        className="flex items-center gap-2"
                        data-testid="button-download-photo"
                      >
                        <Download className="w-4 h-4" />
                        {t.customer.drafting.savePhotoBtn}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Preview of the prepared review with copy button */}
                {selectedReview && (
                  <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground font-medium">{t.customer.drafting.yourReview}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCopyReview}
                        className="h-7 text-xs"
                        data-testid="button-copy-review"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {t.common.copy}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3" data-testid="text-review-preview">
                      {getReviewWithHashtags()}
                    </p>
                  </div>
                )}
                
                <Button onClick={handleReviewAction} className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-review">
                  <Clipboard className="mr-2 h-4 w-4" />
                  Copy & Open Google Review
                </Button>
              </>
            )}

            {/* XHS Share - Xiaohongshu Optimized Flow */}
            {activePlatform?.id === 'xiaohongshu' && (
              <>
                <div className="w-full p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm font-medium text-red-700 mb-3 text-center">
                    📱 小红书分享流程
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-red-600 mb-4">
                    <span className="bg-red-100 px-2 py-1 rounded-full">复制内容</span>
                    <span>→</span>
                    <span className="bg-red-100 px-2 py-1 rounded-full">打开小红书</span>
                    <span>→</span>
                    <span className="bg-red-100 px-2 py-1 rounded-full">粘贴发布</span>
                  </div>
                  
                  {/* Preview formatted text */}
                  <div className="bg-white p-3 rounded-lg text-xs text-gray-700 whitespace-pre-line border max-h-32 overflow-y-auto">
                    {formatForXiaohongshu(selectedReview || '', selectedHashtags, config?.businessName || undefined)}
                  </div>
                </div>
                
                {selectedPhoto && (
                  <div className="w-full">
                    <p className="text-xs text-muted-foreground mb-2 text-center font-medium">
                      📷 下载照片后在小红书中选择
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <img 
                        src={selectedPhoto} 
                        alt="Selected photo" 
                        className="w-20 h-20 object-cover rounded-lg border-2 border-red-200 shadow-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDownloadPhoto}
                        className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Download className="w-4 h-4" />
                        保存照片
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleXiaohongshuAction} 
                  className="h-12 w-full bg-red-600 hover:bg-red-700 text-white" 
                  data-testid="button-share-xhs"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  打开小红书发布
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  最快发布到小红书，只需粘贴一次
                </p>
              </>
            )}

            {/* Facebook Share */}
            {activePlatform?.id === 'facebook' && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Your review will be copied. Paste it on Facebook!
                </p>
                <Button onClick={handleShareAction} className="h-12 w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white" data-testid="button-share-fb">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy & Open Facebook
                </Button>
              </>
            )}

            {/* Instagram Share */}
            {activePlatform?.id === 'instagram' && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Share your experience on Instagram!
                </p>
                <Button onClick={handleShareAction} className="h-12 w-full bg-pink-600 hover:bg-pink-700 text-white" data-testid="button-share-ig">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share on Instagram
                </Button>
              </>
            )}

            {/* TikTok Share */}
            {activePlatform?.id === 'tiktok' && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Share your transformation on TikTok!
                </p>
                <Button onClick={handleShareAction} className="h-12 w-full bg-slate-800 hover:bg-slate-900 text-white" data-testid="button-share-tiktok">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share on TikTok
                </Button>
              </>
            )}

            {/* WhatsApp Contact */}
            {activePlatform?.id === 'whatsapp' && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Chat with us on WhatsApp!
                </p>
                <Button onClick={handleContactAction} className="h-12 w-full bg-green-600 hover:bg-green-700 text-white" data-testid="button-contact-whatsapp">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Open WhatsApp
                </Button>
              </>
            )}
            
            {/* Back button */}
            <Button 
              variant="ghost" 
              onClick={handleBackToPlatforms}
              className="text-muted-foreground"
              data-testid="button-back-platforms"
            >
              {t.common.back || "Back"}
            </Button>
            </>
            )}
            
          </div>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
