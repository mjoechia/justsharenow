import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import sharelorAiLogo from "@assets/generated_images/sharelor_ai_logo_with_qr_code.png";

export default function QuickView() {
  const { language } = useStore();
  const [_, setLocation] = useLocation();
  const t = translations[language];

  // The URL provided by the user
  const shareUrl = "https://sharelah.asia/app/#/user-share?store_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJtZW1iZXIiLCJpZCI6MTEsInFyY29kZSI6Im0xbGxhIn0.HlcaO2Av0-IihziMEODLJks786cf4VrNg0jlrE_SKnkdyI7dRNriqsB4mT9WXXba";

  const handleScan = () => {
    // Simulate scanning the QR code -> goes to drafting page
    setLocation('/drafting');
  };

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
              <div className="mb-8 flex flex-col items-center gap-3">
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
                className="bg-white p-4 rounded-2xl shadow-lg border border-indigo-100 mb-8 cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={handleScan}
              >
                <QRCodeSVG 
                  value={shareUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#4F46E5"
                />
              </div>

              {/* URL Display (Truncated) */}
              <div className="bg-muted/30 p-2 rounded-lg w-full mb-6 flex items-center justify-center">
                 <code className="text-[10px] text-muted-foreground break-all line-clamp-2 font-mono px-2">
                   {shareUrl}
                 </code>
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
