import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import justShareNowLogo from "@assets/JustSharenow_logo_1766216638301.png";
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

export default function QuickView({ embedded = false, contextUserId }: { embedded?: boolean; contextUserId?: number }) {
  const { language } = useStore();
  const [_, setLocation] = useLocation();
  const t = translations[language];
  const { toast } = useToast();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>("");

  const { data: config } = useQuery({
    queryKey: ['storeConfig', contextUserId],
    queryFn: () => getStoreConfig(contextUserId),
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
              

              {/* Header with Logos */}
              <div className="mb-4 flex items-center justify-center gap-4">
                {(config as any)?.companyLogo && (
                  <img 
                    src={(config as any).companyLogo} 
                    alt="Company Logo" 
                    className="w-24 h-auto object-contain max-h-16"
                    data-testid="img-company-logo"
                  />
                )}
                <img src={justShareNowLogo} alt="JustShareNow" className="w-24 h-auto object-contain max-h-16" />
              </div>
              {config?.businessName && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-base font-semibold text-primary" data-testid="text-qr-business-name">
                    {config.businessName}
                  </span>
                </div>
              )}

              {/* QR Code */}
              <div 
                className="bg-white p-3 rounded-2xl shadow-lg border border-[#2D7FF9]/20 mb-4 transition-transform duration-300 relative group cursor-pointer"
                onClick={handleScan}
                data-qr-container="true"
              >
                <QRCodeCanvas 
                  value={shareUrl}
                  size={160}
                  level="H"
                  includeMargin={true}
                  fgColor="#2D7FF9"
                  ref={qrCanvasRef}
                  imageSettings={{
                    src: justShareNowLogo,
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
              </div>

              {/* Social Icons Strip */}
              <div className="flex gap-2 justify-center mb-4">
                {socialIcons.map((item, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center ${item.color}`}>
                        {item.icon}
                    </div>
                ))}
              </div>

              {/* CTA */}
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-bold text-foreground">{t.quickView.shareUnlock}</h2>
                <p className="text-xs text-muted-foreground">{t.quickView.scanToShare}</p>
              </div>
              
              <Button 
                className="mt-4 w-full bg-gradient-to-r from-[#2D7FF9] to-[#23C7C3] hover:from-[#2D7FF9]/90 hover:to-[#23C7C3]/90 text-white border-0 shadow-lg shadow-[#2D7FF9]/20"
                onClick={handleScan}
              >
                {t.quickView.startReview}
              </Button>

              {/* Controls */}
              <div className="w-full flex items-center justify-center gap-2 mt-3">
                <Button variant="ghost" size="sm" onClick={handleDownload} className="text-xs text-muted-foreground hover:text-primary">
                   <Download className="w-3 h-3 mr-1" />
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
                   <Camera className="w-3 h-3 mr-1" />
                   {isSavingImage ? "..." : t.quickView.saveAsImage}
                </Button>
              </div>

              {userSlug && (
                <p className="mt-2 text-xs text-muted-foreground text-center" data-testid="text-slug-url">
                  /{userSlug}
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
