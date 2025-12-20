import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import justShareNowLogo from "@assets/justsharenow_square-removebg_1765269040896.png";
import { Facebook, Instagram, MapPin, MessageCircle, Download, Link as LinkIcon, RefreshCw, Building2, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getStoreConfig } from "@/lib/api";
import html2canvas from "html2canvas";

// Helper to convert image to base64
const imageToBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
};

export default function QuickView({ embedded = false }: { embedded?: boolean }) {
  const { language } = useStore();
  const [_, setLocation] = useLocation();
  const t = translations[language];
  const { toast } = useToast();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>("");

  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });

  // Slider state for reduced slider photos
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderPhotos: string[] = (config as any)?.sliderPhotos || [];

  // Reset currentSlide when sliderPhotos changes to prevent out-of-bounds
  useEffect(() => {
    if (currentSlide >= sliderPhotos.length && sliderPhotos.length > 0) {
      setCurrentSlide(0);
    }
  }, [sliderPhotos.length, currentSlide]);

  const nextSlide = () => {
    if (sliderPhotos.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % sliderPhotos.length);
    }
  };

  const prevSlide = () => {
    if (sliderPhotos.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + sliderPhotos.length) % sliderPhotos.length);
    }
  };

  // QR code links to the Shop View (landing page) using user's slug
  const [shareUrl, setShareUrl] = useState("");
  const userSlug = (config as any)?.userSlug;

  useEffect(() => {
    // Use user's slug for QR code URL if available
    if (userSlug) {
      setShareUrl(`${window.location.origin}/${userSlug}`);
    } else {
      setShareUrl(`${window.location.origin}/`);
    }
  }, [userSlug]);

  // Pre-load logo as base64 for html2canvas compatibility
  useEffect(() => {
    imageToBase64(justShareNowLogo)
      .then(setLogoBase64)
      .catch(console.error);
  }, []);

  const handleScan = () => {
    // Navigate to Shop View when QR code is clicked - use slug if available
    if (userSlug) {
      setLocation(`/${userSlug}`);
    } else {
      setLocation('/');
    }
  };

  const handleDownload = () => {
    if (!qrCanvasRef.current) return;

    const pngFile = qrCanvasRef.current.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.download = `JustShareNow-QR.png`;
    downloadLink.href = pngFile;
    downloadLink.click();
    
    toast({
        title: t.quickView.qrDownloaded,
        description: t.quickView.imageSaved,
    });
  };

  const handleSaveAsImage = async () => {
    if (!cardRef.current) return;
    
    setIsSavingImage(true);
    try {
      // Simple html2canvas capture - canvas elements are supported natively
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `JustShareNow-Card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: t.quickView.cardSaved || "Card Saved!",
        description: t.quickView.cardImageSaved || "The card has been saved as an image.",
      });
    } catch (error) {
      console.error("Failed to save image:", error);
      toast({
        title: "Failed to save",
        description: "Could not save the card as an image.",
        variant: "destructive",
      });
    } finally {
      setIsSavingImage(false);
    }
  };

  const socialIcons = [
    { icon: <MapPin className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" }, // Google
    { icon: <span className="font-bold text-sm">小</span>, color: "text-red-600 bg-red-50" }, // XHS
    { icon: <Instagram className="w-5 h-5" />, color: "text-pink-600 bg-pink-50" }, // Instagram
    { icon: <Facebook className="w-5 h-5" />, color: "text-[#2D7FF9] bg-[#2D7FF9]/10" }, // Facebook
    { icon: <span className="font-bold text-sm">Tk</span>, color: "text-black bg-gray-100" }, // TikTok
    { icon: <MessageCircle className="w-5 h-5" />, color: "text-green-600 bg-green-50" }, // WhatsApp
  ];

  const content = (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[375px]"
        >
          <Card ref={cardRef} className="border-0 shadow-xl bg-gradient-to-b from-[#2D7FF9]/5 to-white overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center text-center">
              
              {/* Reduced Slider Photos */}
              {sliderPhotos.length > 0 && (
                <div className="w-full mb-4 relative rounded-xl overflow-hidden">
                  <div className="relative aspect-video">
                    <img 
                      src={sliderPhotos[currentSlide]} 
                      alt={`Slide ${currentSlide + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {sliderPhotos.length > 1 && (
                      <>
                        <button 
                          onClick={prevSlide}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
                          aria-label="Previous slide"
                          data-testid="button-slider-prev"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={nextSlide}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
                          aria-label="Next slide"
                          data-testid="button-slider-next"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {sliderPhotos.map((_: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentSlide(idx)}
                              aria-label={`Go to slide ${idx + 1}`}
                              data-testid={`button-slider-dot-${idx}`}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                idx === currentSlide ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="mb-6 flex flex-col items-center">
                <img src={justShareNowLogo} alt="JustShareNow" className="w-48 h-auto object-contain" />
                {config?.businessName && (
                  <div className="flex items-center gap-2 mt-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold text-primary" data-testid="text-qr-business-name">
                      {config.businessName}
                    </span>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div 
                className="bg-white p-4 rounded-2xl shadow-lg border border-[#2D7FF9]/20 mb-8 transition-transform duration-300 relative group cursor-pointer"
                onClick={handleScan}
                data-qr-container="true"
              >
                <QRCodeCanvas 
                  value={shareUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#2D7FF9"
                  ref={qrCanvasRef}
                  imageSettings={{
                    src: justShareNowLogo,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>

              {/* Controls */}
              <div className="w-full flex items-center justify-center gap-2 bg-muted/30 p-3 rounded-lg mb-6">
                <Button variant="ghost" size="sm" onClick={handleDownload} className="text-xs text-muted-foreground hover:text-primary">
                   <Download className="w-4 h-4 mr-2" />
                   {t.quickView.downloadQR}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSaveAsImage} 
                  disabled={isSavingImage}
                  className="text-xs text-muted-foreground hover:text-primary"
                  data-testid="button-save-card-image"
                >
                   <Camera className="w-4 h-4 mr-2" />
                   {isSavingImage ? "Saving..." : t.quickView.saveAsImage}
                </Button>
              </div>

              {/* Social Icons Strip */}
              <div className="flex gap-3 justify-center mb-8">
                {socialIcons.map((item, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
                        {item.icon}
                    </div>
                ))}
              </div>

              {/* CTA */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">{t.quickView.shareUnlock}</h2>
                <p className="text-sm text-muted-foreground">{t.quickView.scanToShare}</p>
              </div>
              
              <Button 
                className="mt-8 w-full bg-gradient-to-r from-[#2D7FF9] to-[#23C7C3] hover:from-[#2D7FF9]/90 hover:to-[#23C7C3]/90 text-white border-0 shadow-lg shadow-[#2D7FF9]/20"
                onClick={handleScan}
              >
                {t.quickView.startReview}
              </Button>

              {userSlug && (
                <p className="mt-4 text-xs text-muted-foreground text-center" data-testid="text-slug-url">
                  Customers can access your Shop View at: <span className="font-medium text-primary">{window.location.origin}/{userSlug}</span>
                </p>
              )}

            </CardContent>
          </Card>
        </motion.div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return <Layout>{content}</Layout>;
}
