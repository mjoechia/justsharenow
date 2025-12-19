import { useStore, translations } from "@/lib/store";
import { motion } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Facebook, Instagram, MessageCircle, ExternalLink } from "lucide-react";
import justShareNowLogo from "@assets/justsharenow_square-removebg_1765269040896.png";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface UserConfigData {
  user: {
    displayName: string;
    slug: string;
  };
  config: {
    placeId: string;
    businessName: string;
    googleReviewsUrl: string;
    googlePlaceId: string;
    facebookUrl: string;
    instagramUrl: string;
    xiaohongshuUrl: string;
    tiktokUrl: string;
    whatsappUrl: string;
    shopPhotos: string[];
    sliderPhotos: string[];
    reviewHashtags: string[];
  } | null;
}

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const XiaohongshuIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-13h4v2h-4v-2zm0 4h4v6h-4v-6z"/>
  </svg>
);

export default function UserLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { language } = useStore();
  const t = translations[language];

  const { data, isLoading, error } = useQuery<UserConfigData>({
    queryKey: ['user-config', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/by-slug/${slug}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !data || !data.config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Not Found</h1>
            <p className="text-gray-600">This page doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = data.config;
  const displayPhotos = config.sliderPhotos?.length > 0 
    ? config.sliderPhotos 
    : config.shopPhotos?.length > 0 
      ? config.shopPhotos 
      : [justShareNowLogo];

  const platforms = [
    { key: 'google-reviews', url: config.googleReviewsUrl, label: 'Google Reviews', icon: <MapPin className="w-5 h-5" />, color: 'bg-blue-500 hover:bg-blue-600' },
    { key: 'facebook', url: config.facebookUrl, label: 'Facebook', icon: <Facebook className="w-5 h-5" />, color: 'bg-blue-700 hover:bg-blue-800' },
    { key: 'instagram', url: config.instagramUrl, label: 'Instagram', icon: <Instagram className="w-5 h-5" />, color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' },
    { key: 'xiaohongshu', url: config.xiaohongshuUrl, label: 'XiaoHongShu', icon: <XiaohongshuIcon />, color: 'bg-red-500 hover:bg-red-600' },
    { key: 'tiktok', url: config.tiktokUrl, label: 'TikTok', icon: <TikTokIcon />, color: 'bg-gray-900 hover:bg-gray-800' },
    { key: 'whatsapp', url: config.whatsappUrl, label: 'WhatsApp', icon: <MessageCircle className="w-5 h-5" />, color: 'bg-green-500 hover:bg-green-600' },
  ].filter(p => p.url);

  const handlePlatformClick = async (platform: string, url: string) => {
    if (config.placeId) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, placeId: config.placeId }),
      }).catch(console.error);
    }
    window.open(url, '_blank');
  };

  const handleWriteReview = () => {
    setLocation(`/${slug}/drafting`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <img src={justShareNowLogo} alt="JustShareNow" className="w-24 h-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">{config.businessName || data.user.displayName}</h1>
        </motion.div>

        {displayPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Carousel 
              className="w-full"
              plugins={[Autoplay({ delay: 4000 })]}
            >
              <CarouselContent>
                {displayPhotos.map((photo, index) => (
                  <CarouselItem key={index}>
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <img 
                          src={photo} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-48 object-cover"
                        />
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {displayPhotos.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-6"
        >
          <Button 
            onClick={handleWriteReview}
            className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            data-testid="button-write-review"
          >
            {language === 'en' ? 'Write a Review' : '写评论'}
          </Button>
        </motion.div>

        {platforms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">{language === 'en' ? 'Share on Social' : '分享到社交平台'}</h3>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <Button
                  key={platform.key}
                  onClick={() => handlePlatformClick(platform.key, platform.url!)}
                  className={`${platform.color} text-white flex items-center justify-center gap-2 py-3`}
                  data-testid={`button-platform-${platform.key}`}
                >
                  {platform.icon}
                  {platform.label}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
