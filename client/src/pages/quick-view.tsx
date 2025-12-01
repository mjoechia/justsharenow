import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import sharelorAiLogo from "@assets/generated_images/sharelor_ai_logo_with_qr_code.png";
import { Facebook, Instagram, MapPin, MessageCircle, Download, Link as LinkIcon, RefreshCw } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function QuickView() {
  const { language } = useStore();
  const [_, setLocation] = useLocation();
  const t = translations[language];
  const { toast } = useToast();
  const qrRef = useRef<SVGSVGElement>(null);

  // State to toggle between external production URL and internal demo URL
  const [useDemoUrl, setUseDemoUrl] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  // The URL provided by the user
  const productionUrl = "https://sharelah.asia/app/#/user-share?store_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJtZW1iZXIiLCJpZCI6MTEsInFyY29kZSI6Im0xbGxhIn0.HlcaO2Av0-IihziMEODLJks786cf4VrNg0jlrE_SKnkdyI7dRNriqsB4mT9WXXba";

  useEffect(() => {
    if (useDemoUrl) {
      // Use the current window location origin + /drafting
      // Note: This works best when the app is deployed/published
      setCurrentUrl(`${window.location.origin}/drafting`);
    } else {
      setCurrentUrl(productionUrl);
    }
  }, [useDemoUrl]);

  const handleScan = () => {
    // Simulate scanning the QR code -> goes to drafting page
    setLocation('/drafting');
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
        // Fill white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `ShareLor-QR-${useDemoUrl ? 'Demo' : 'Production'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        
        toast({
            title: "QR Code Downloaded",
            description: "Image saved to your device.",
        });
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const socialIcons = [
    { icon: <MapPin className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" }, // Google
    { icon: <span className="font-bold text-sm">小</span>, color: "text-red-600 bg-red-50" }, // XHS
    { icon: <Instagram className="w-5 h-5" />, color: "text-pink-600 bg-pink-50" }, // Instagram
    { icon: <Facebook className="w-5 h-5" />, color: "text-indigo-600 bg-indigo-50" }, // Facebook
    { icon: <span className="font-bold text-sm">Tk</span>, color: "text-black bg-gray-100" }, // TikTok
    { icon: <MessageCircle className="w-5 h-5" />, color: "text-green-600 bg-green-50" }, // WhatsApp
  ];

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          <Card className="border-0 shadow-xl bg-gradient-to-b from-indigo-50/50 to-white overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center text-center">
              
              {/* Header */}
              <div className="mb-6 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                   <div className="w-full h-full bg-white rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={sharelorAiLogo} alt="ShareLor AI" className="w-full h-full object-cover" />
                   </div>
                </div>
                <h1 className="text-2xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  ShareLor AI
                </h1>
              </div>

              {/* QR Code */}
              <div 
                className="bg-white p-4 rounded-2xl shadow-lg border border-indigo-100 mb-8 transition-transform duration-300 relative group"
              >
                <QRCodeSVG 
                  value={currentUrl || productionUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#4F46E5"
                  ref={qrRef}
                />
                {/* Hover Overlay for Quick Action */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center cursor-pointer" onClick={handleScan}>
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">Simulate Scan</span>
                </div>
              </div>

              {/* Controls */}
              <div className="w-full flex items-center justify-between bg-muted/30 p-3 rounded-lg mb-6">
                <div className="flex items-center space-x-2">
                  <Switch id="demo-mode" checked={useDemoUrl} onCheckedChange={setUseDemoUrl} />
                  <Label htmlFor="demo-mode" className="text-xs cursor-pointer">
                    {useDemoUrl ? 'Linking to: Demo App' : 'Linking to: Production'}
                  </Label>
                </div>
                <Button variant="ghost" size="icon" onClick={handleDownload} title="Download QR Code">
                   <Download className="w-4 h-4" />
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
                <h2 className="text-xl font-bold text-foreground">Share and Unlock Rewards</h2>
                <p className="text-sm text-muted-foreground">Scan to share your experience and get instant perks.</p>
              </div>
              
              <Button 
                className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-200"
                onClick={handleScan}
              >
                Simulate Scan
              </Button>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
