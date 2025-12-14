import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import justShareNowLogo from "@assets/justsharenow_square-removebg_1765269040896.png";
import { Facebook, Instagram, MapPin, MessageCircle, Download, Link as LinkIcon, RefreshCw, Building2, Camera } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getStoreConfig } from "@/lib/api";
import html2canvas from "html2canvas";

export default function QuickView({ embedded = false }: { embedded?: boolean }) {
  const { language } = useStore();
  const [_, setLocation] = useLocation();
  const t = translations[language];
  const { toast } = useToast();
  const qrRef = useRef<SVGSVGElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });

  // QR code links to the Shop View (landing page)
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(`${window.location.origin}/`);
  }, []);

  const handleScan = () => {
    // Navigate to Shop View when QR code is clicked
    setLocation('/');
  };

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `JustShareNow-QR.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        
        toast({
            title: t.quickView.qrDownloaded,
            description: t.quickView.imageSaved,
        });
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleSaveAsImage = async () => {
    if (!cardRef.current) return;
    
    setIsSavingImage(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
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
              >
                <QRCodeSVG 
                  value={shareUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#2D7FF9"
                  ref={qrRef}
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
