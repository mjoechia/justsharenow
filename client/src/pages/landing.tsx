import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Facebook, Instagram, MapPin, ThumbsUp, UserPlus, QrCode, Building2, ExternalLink, Copy, Check, LogIn } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getStoreConfig, trackPlatformClick } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, useMemo } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const platforms = [
  {
    id: 'google-reviews',
    name: 'Google Reviews',
    icon: <MapPin className="w-8 h-8 text-blue-600" />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
  },
  {
    id: 'xiaohongshu',
    name: 'XiaoHongShu',
    icon: <span className="text-2xl font-bold text-red-600">小红书</span>,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverBg: 'hover:bg-red-100',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="w-8 h-8 text-pink-600" />,
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:bg-pink-100',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="w-8 h-8 text-[#2D7FF9]" />,
    bgColor: 'bg-[#2D7FF9]/5',
    borderColor: 'border-[#2D7FF9]/20',
    hoverBg: 'hover:bg-[#2D7FF9]/10',
  },
  {
    id: 'follow-facebook',
    name: 'Follow Facebook',
    icon: <ThumbsUp className="w-8 h-8 text-blue-700" />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
  },
  {
    id: 'follow-instagram',
    name: 'Follow Instagram',
    icon: <UserPlus className="w-8 h-8 text-pink-700" />,
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:bg-pink-100',
  }
];

export default function Landing({ embedded = false }: { embedded?: boolean }) {
  const { language, setSelectedPlatform } = useStore();
  const [_, setLocation] = useLocation();
  const t = translations[language];
  const [quickViewUrl, setQuickViewUrl] = useState("");
  const [followFbModalOpen, setFollowFbModalOpen] = useState(false);
  const [followIgModalOpen, setFollowIgModalOpen] = useState(false);
  const [xhsModalOpen, setXhsModalOpen] = useState(false);
  const [xhsCopied, setXhsCopied] = useState(false);

  useEffect(() => {
    setQuickViewUrl(`${window.location.origin}/quick-view`);
  }, []);

  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });

  const sliderPhotos = config?.sliderPhotos || [];

  // Filter platforms based on configuration - hide follow buttons if URLs not configured
  const availablePlatforms = useMemo(() => {
    return platforms.filter(platform => {
      if (platform.id === 'follow-facebook') {
        return !!config?.facebookUrl;
      }
      if (platform.id === 'follow-instagram') {
        return !!config?.instagramUrl;
      }
      return true;
    });
  }, [config]);

  const handlePlatformClick = (platformId: string) => {
    if (platformId === 'follow-facebook') {
      setFollowFbModalOpen(true);
      return;
    }
    if (platformId === 'follow-instagram') {
      setFollowIgModalOpen(true);
      return;
    }
    if (platformId === 'xiaohongshu') {
      setXhsModalOpen(true);
      setXhsCopied(false);
      return;
    }
    setSelectedPlatform(platformId);
    setLocation('/drafting');
  };

  const openXiaohongshu = (profileUrl?: string) => {
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
      window.open(profileUrl || "https://www.xiaohongshu.com", "_blank");
    }
  };

  const getXhsContent = () => {
    const businessName = config?.businessName || "this place";
    const hashtags = config?.reviewHashtags?.slice(0, 5).map(tag => `#${tag}`).join(' ') || '';
    return `Just visited ${businessName}! Amazing experience! ${hashtags}`.trim();
  };

  const handleXhsCopyAndOpen = async () => {
    const content = getXhsContent();
    try {
      await navigator.clipboard.writeText(content);
      setXhsCopied(true);
      toast.success(t.customer.platform?.copied || "Copied to clipboard!");
      await trackPlatformClick('xiaohongshu');
      setTimeout(() => {
        openXiaohongshu(config?.xiaohongshuUrl || undefined);
        setXhsModalOpen(false);
      }, 500);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleFollowFacebook = async () => {
    const facebookUrl = config?.facebookUrl;
    if (facebookUrl) {
      await trackPlatformClick('follow-facebook');
      window.open(facebookUrl, '_blank');
      setFollowFbModalOpen(false);
    }
  };

  const openInstagramProfile = (profileUrl: string) => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    // Extract username from URL if possible (e.g., instagram.com/username)
    const usernameMatch = profileUrl.match(/instagram\.com\/([^/?]+)/);
    const username = usernameMatch ? usernameMatch[1] : null;
    
    if (isIOS && username) {
      // Try to open Instagram app directly
      window.location.href = `instagram://user?username=${username}`;
      setTimeout(() => {
        window.open(profileUrl, '_blank');
      }, 1500);
    } else if (isAndroid && username) {
      window.location.href = `intent://instagram.com/_u/${username}#Intent;package=com.instagram.android;scheme=https;end`;
      setTimeout(() => {
        window.open(profileUrl, '_blank');
      }, 1500);
    } else {
      window.open(profileUrl, '_blank');
    }
  };

  const handleFollowInstagram = async () => {
    const instagramUrl = config?.instagramUrl;
    if (instagramUrl) {
      await trackPlatformClick('follow-instagram');
      openInstagramProfile(instagramUrl);
      setFollowIgModalOpen(false);
    }
  };

  const content = (
      <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-8rem)]">
        
        {/* Mobile: Top Slider (1/3 height) */}
        {/* Desktop: Left Slider (2/3 width) */}
        <div className="h-[33vh] lg:h-auto lg:w-2/3 bg-muted/20 relative overflow-hidden">
          {sliderPhotos.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                }),
              ]}
              className="w-full h-full"
            >
              <CarouselContent className="h-full -ml-0">
                {sliderPhotos.map((photo, index) => (
                  <CarouselItem key={index} className="h-full pl-0 basis-full">
                    <div className="relative w-full h-full">
                      <img 
                        src={photo} 
                        alt={`Slider photo ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2D7FF9]/10 to-[#23C7C3]/10">
              <div className="text-center text-muted-foreground p-8">
                <p className="text-lg font-medium mb-2">{t.landing.welcome}</p>
                <p className="text-sm">{t.landing.uploadPhotos}</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile: Bottom Buttons (2/3 height) */}
        {/* Desktop: Right Buttons (1/3 width) */}
        <div className="flex-1 lg:w-1/3 p-4 lg:p-6 flex flex-col">
          <div className="text-center mb-4 lg:mb-6">
            {config?.businessName && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold text-primary" data-testid="text-shop-business-name">
                  {config.businessName}
                </span>
              </div>
            )}
            <h1 className="text-xl lg:text-2xl font-heading font-bold text-foreground">
              {t.landing.shareExperience}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t.landing.tapPlatform}
            </p>
          </div>

          {/* 2 Column Grid for Platform Buttons */}
          <div className="grid grid-cols-2 gap-3 lg:gap-4 flex-1 content-start">
            {availablePlatforms.map((platform, index) => (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`h-full cursor-pointer transition-all duration-200 border-2 ${platform.borderColor} ${platform.bgColor} ${platform.hoverBg} hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}
                  onClick={() => handlePlatformClick(platform.id)}
                  data-testid={`button-platform-${platform.id}`}
                >
                  <CardContent className="p-4 lg:p-5 flex flex-col items-center justify-center text-center h-full min-h-[100px] lg:min-h-[120px]">
                    <div className="mb-2 lg:mb-3">
                      {platform.icon}
                    </div>
                    <h3 className="font-medium text-sm lg:text-base text-foreground leading-tight">
                      {platform.name}
                    </h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* QR Code Section - Links to Quick View */}
          <motion.div 
            className="mt-4 lg:mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-[#2D7FF9]/5 to-[#23C7C3]/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm border">
                  {quickViewUrl && (
                    <QRCodeSVG 
                      value={quickViewUrl}
                      size={80}
                      level="M"
                      fgColor="#2D7FF9"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-sm text-foreground">Quick View</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scan this QR code to access the mobile sharing experience
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Admin Login Link - Only show when not embedded (Shop View) */}
          {!embedded && (
            <motion.div 
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="button-admin-login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin Login
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
  );

  if (embedded) {
    return (
      <>
        {content}
        <Dialog open={followFbModalOpen} onOpenChange={setFollowFbModalOpen}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogTitle className="sr-only">Follow on Facebook</DialogTitle>
            <div className="flex flex-col items-center text-center p-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#1877F2] flex items-center justify-center">
                <Facebook className="w-8 h-8 text-white" />
              </div>
              
              {config?.businessName && (
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">{config.businessName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t.customer.platform?.followFbSubtitle || "Stay connected with us on Facebook!"}
                  </p>
                </div>
              )}
              
              {!config?.businessName && (
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {t.customer.platform?.followFbTitle || "Follow Us"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.customer.platform?.followFbSubtitle || "Stay connected with us on Facebook!"}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleFollowFacebook}
                className="w-full h-12 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white text-base font-medium"
                data-testid="button-follow-facebook"
                disabled={!config?.facebookUrl}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {t.customer.platform?.followOnFacebook || "Follow on Facebook"}
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Please allow pop-ups if prompted
              </p>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Follow Instagram Modal */}
        <Dialog open={followIgModalOpen} onOpenChange={setFollowIgModalOpen}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogTitle className="sr-only">Follow on Instagram</DialogTitle>
            <div className="flex flex-col items-center text-center p-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] flex items-center justify-center">
                <Instagram className="w-8 h-8 text-white" />
              </div>
              
              {config?.businessName && (
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">{config.businessName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t.customer.platform?.followIgSubtitle || "Follow us on Instagram!"}
                  </p>
                </div>
              )}
              
              {!config?.businessName && (
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {t.customer.platform?.followIgTitle || "Follow Us"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.customer.platform?.followIgSubtitle || "Follow us on Instagram!"}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleFollowInstagram}
                className="w-full h-12 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-90 text-white text-base font-medium"
                data-testid="button-follow-instagram"
                disabled={!config?.instagramUrl}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {t.customer.platform?.followOnInstagram || "Follow on Instagram"}
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Please allow pop-ups if prompted
              </p>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* XiaoHongShu Modal */}
        <Dialog open={xhsModalOpen} onOpenChange={setXhsModalOpen}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogTitle className="sr-only">Share on XiaoHongShu</DialogTitle>
            <div className="flex flex-col items-center text-center p-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-xl font-bold text-white">小红书</span>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">
                  {t.customer.platform?.shareOnXhs || "Share on XiaoHongShu"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.customer.platform?.xhsSubtitle || "Share your experience on XiaoHongShu!"}
                </p>
              </div>
              
              <div className="w-full p-3 bg-muted/50 rounded-lg text-left">
                <p className="text-sm text-foreground whitespace-pre-wrap">{getXhsContent()}</p>
              </div>
              
              <Button 
                onClick={handleXhsCopyAndOpen}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white text-base font-medium"
                data-testid="button-xhs-copy-open"
              >
                {xhsCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t.customer.platform?.copied || "Copied!"}
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    {t.customer.platform?.copyAndOpen || "Copy & Open XiaoHongShu"}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Layout hideCarousel>
      {content}
      <Dialog open={followFbModalOpen} onOpenChange={setFollowFbModalOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogTitle className="sr-only">Follow on Facebook</DialogTitle>
          <div className="flex flex-col items-center text-center p-4 space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#1877F2] flex items-center justify-center">
              <Facebook className="w-8 h-8 text-white" />
            </div>
            
            {config?.businessName && (
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">{config.businessName}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.customer.platform?.followFbSubtitle || "Stay connected with us on Facebook!"}
                </p>
              </div>
            )}
            
            {!config?.businessName && (
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">
                  {t.customer.platform?.followFbTitle || "Follow Us"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.customer.platform?.followFbSubtitle || "Stay connected with us on Facebook!"}
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleFollowFacebook}
              className="w-full h-12 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white text-base font-medium"
              data-testid="button-follow-facebook"
              disabled={!config?.facebookUrl}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {t.customer.platform?.followOnFacebook || "Follow on Facebook"}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Please allow pop-ups if prompted
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Follow Instagram Modal */}
      <Dialog open={followIgModalOpen} onOpenChange={setFollowIgModalOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogTitle className="sr-only">Follow on Instagram</DialogTitle>
          <div className="flex flex-col items-center text-center p-4 space-y-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] flex items-center justify-center">
              <Instagram className="w-8 h-8 text-white" />
            </div>
            
            {config?.businessName && (
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">{config.businessName}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.customer.platform?.followIgSubtitle || "Follow us on Instagram!"}
                </p>
              </div>
            )}
            
            {!config?.businessName && (
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">
                  {t.customer.platform?.followIgTitle || "Follow Us"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.customer.platform?.followIgSubtitle || "Follow us on Instagram!"}
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleFollowInstagram}
              className="w-full h-12 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-90 text-white text-base font-medium"
              data-testid="button-follow-instagram"
              disabled={!config?.instagramUrl}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {t.customer.platform?.followOnInstagram || "Follow on Instagram"}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Please allow pop-ups if prompted
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* XiaoHongShu Modal */}
      <Dialog open={xhsModalOpen} onOpenChange={setXhsModalOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogTitle className="sr-only">Share on XiaoHongShu</DialogTitle>
          <div className="flex flex-col items-center text-center p-4 space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">小红书</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">
                {t.customer.platform?.shareOnXhs || "Share on XiaoHongShu"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.customer.platform?.xhsSubtitle || "Share your experience on XiaoHongShu!"}
              </p>
            </div>
            
            <div className="w-full p-3 bg-muted/50 rounded-lg text-left">
              <p className="text-sm text-foreground whitespace-pre-wrap">{getXhsContent()}</p>
            </div>
            
            <Button 
              onClick={handleXhsCopyAndOpen}
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white text-base font-medium"
              data-testid="button-xhs-copy-open"
            >
              {xhsCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t.customer.platform?.copied || "Copied!"}
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  {t.customer.platform?.copyAndOpen || "Copy & Open XiaoHongShu"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
