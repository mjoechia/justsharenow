import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Facebook, Instagram, MapPin, ThumbsUp, UserPlus, QrCode, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getStoreConfig } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    setQuickViewUrl(`${window.location.origin}/quick-view`);
  }, []);

  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });

  const sliderPhotos = config?.sliderPhotos || [];

  const handlePlatformClick = (platformId: string) => {
    setSelectedPlatform(platformId);
    setLocation('/drafting');
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
                <p className="text-lg font-medium mb-2">Welcome to JustShareNow</p>
                <p className="text-sm">Upload photos in Admin Dashboard to display here</p>
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
              Share Your Experience
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tap a platform to get started
            </p>
          </div>

          {/* 2 Column Grid for Platform Buttons */}
          <div className="grid grid-cols-2 gap-3 lg:gap-4 flex-1 content-start">
            {platforms.map((platform, index) => (
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
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return <Layout hideCarousel>{content}</Layout>;
}
