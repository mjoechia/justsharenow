import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Copy, RefreshCw, Share2, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStoreConfig, trackClick } from "@/lib/api";

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
    color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200', 
    textColor: 'text-indigo-700',
    iconColor: 'text-indigo-600',
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
      const url = config[platform.configKey];
      return url && url.trim() !== '';
    });
  }, [config]);

  const [activePlatform, setActivePlatform] = useState<typeof allPlatforms[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlatformClick = (platform: typeof allPlatforms[0]) => {
    setActivePlatform(platform);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setActivePlatform(null);
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
      const url = getPlatformUrl('google-reviews');
      if (url) {
        window.open(url, '_blank');
      }
    }
    incrementStat(activePlatform?.id || 'unknown');
    try {
      await trackClick(activePlatform?.id || 'unknown');
    } catch (e) {
      console.error("Failed to track click:", e);
    }
  };

  const handleShareAction = async () => {
    if (selectedReview) {
      navigator.clipboard.writeText(selectedReview);
      toast({
        title: t.common.copied,
        description: "Review text copied. Ready to paste!",
      });
    }
    
    const url = getPlatformUrl(activePlatform?.id || '');
    if (url) {
      window.open(url, '_blank');
    }
    
    incrementStat(activePlatform?.id || 'unknown');
    try {
      await trackClick(activePlatform?.id || 'unknown');
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
      await trackClick(activePlatform?.id || 'unknown');
    } catch (e) {
      console.error("Failed to track click:", e);
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
            <p>No sharing platforms are configured yet.</p>
            <p className="text-sm mt-2">Please ask the store owner to set up social media links.</p>
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
                                  {platform.actionType === 'review' ? 'Leave a Review' : 
                                   platform.actionType === 'contact' ? 'Contact Us' : 'Share Your Experience'}
                              </span>
                          </div>
                      </div>
                  </button>
              ))}
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                                We'd love to hear your feedback on Google!
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={handleSwitch} className="h-12" data-testid="button-switch">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Switch
                                </Button>
                                <Button onClick={handleReviewAction} className="h-12 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-review">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Review
                                </Button>
                            </div>
                        </div>
                    )}

                    {activePlatform?.id === 'xiaohongshu' && (
                         <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                Copy your text and share your photo on XiaoHongShu!
                            </p>
                            <Button onClick={handleShareAction} className="h-12 bg-red-600 hover:bg-red-700 text-white w-full" data-testid="button-share-xhs">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy & Open XHS
                            </Button>
                        </div>
                    )}

                    {(activePlatform?.id === 'facebook' || activePlatform?.id === 'instagram') && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                Share your experience with your friends!
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={handleSwitch} className="h-12" data-testid="button-switch">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Switch
                                </Button>
                                <Button onClick={handleShareAction} className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="button-share">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                            </div>
                        </div>
                    )}

                    {activePlatform?.id === 'tiktok' && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                Share your transformation on TikTok!
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={handleSwitch} className="h-12" data-testid="button-switch">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Switch
                                </Button>
                                <Button onClick={handleShareAction} className="h-12 bg-slate-800 hover:bg-slate-900 text-white" data-testid="button-share-tiktok">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                            </div>
                        </div>
                    )}

                    {activePlatform?.id === 'whatsapp' && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                Chat with us on WhatsApp!
                            </p>
                            <Button onClick={handleContactAction} className="h-12 bg-green-600 hover:bg-green-700 text-white w-full" data-testid="button-contact-whatsapp">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Open WhatsApp
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
