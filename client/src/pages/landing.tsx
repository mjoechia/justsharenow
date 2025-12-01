import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Facebook, Instagram, MapPin, ThumbsUp, UserPlus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

const platforms = [
  {
    id: 'google',
    name: 'Google Reviews',
    icon: <MapPin className="w-6 h-6 text-blue-600" />,
    color: 'bg-blue-50 border-blue-100 text-blue-700',
    description: 'Scan to review on Google Maps'
  },
  {
    id: 'xiaohongshu',
    name: 'XiaoHongShu',
    icon: <span className="text-lg font-bold text-red-600">小</span>,
    color: 'bg-red-50 border-red-100 text-red-700',
    description: 'Scan to share on Red'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="w-6 h-6 text-pink-600" />,
    color: 'bg-pink-50 border-pink-100 text-pink-700',
    description: 'Scan to post on Instagram'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="w-6 h-6 text-indigo-600" />,
    color: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    description: 'Scan to share on Facebook'
  },
  {
    id: 'follow-facebook',
    name: 'Follow Us',
    icon: <ThumbsUp className="w-6 h-6 text-blue-700" />,
    color: 'bg-blue-50 border-blue-100 text-blue-800',
    description: 'Follow us on Facebook'
  },
  {
    id: 'follow-instagram',
    name: 'Follow Us',
    icon: <UserPlus className="w-6 h-6 text-pink-700" />,
    color: 'bg-pink-50 border-pink-100 text-pink-800',
    description: 'Follow us on Instagram'
  }
];

export default function Landing() {
  const { language, setSelectedPlatform } = useStore();
  const [_, setLocation] = useLocation();
  const t = translations[language];
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(`${window.location.origin}/drafting`);
  }, []);

  const handleScan = (platformId: string) => {
    // Set the selected platform and go to drafting
    setSelectedPlatform(platformId);
    setLocation('/drafting');
  };

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-12 pb-24">
        <div className="text-center mb-12 animate-in-slide-up">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Scan to Share Your Experience
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Shop View: This screen represents the physical QR codes placed at your location.
          </p>
        </div>

        {/* Updated Grid: 2 cols on mobile (default), 3 cols on md/lg */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50"
                onClick={() => handleScan(platform.id)}
              >
                <CardContent className="p-4 md:p-6 flex flex-col items-center text-center h-full">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-3 md:mb-4 ${platform.color} bg-opacity-50`}>
                    {platform.icon}
                  </div>
                  
                  <h3 className="font-heading font-bold text-base md:text-lg mb-2 leading-tight">{platform.name}</h3>
                  
                  <div className="relative w-full aspect-square max-w-[160px] my-2 md:my-4 bg-white p-2 rounded-xl border shadow-sm group-hover:scale-105 transition-transform duration-300">
                    {shareUrl && (
                        <QRCodeSVG 
                            value={shareUrl}
                            width="100%"
                            height="100%"
                            level="M"
                            includeMargin={true}
                        />
                    )}
                  </div>
                  
                  <p className="text-xs md:text-sm text-muted-foreground mt-auto">
                    {platform.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
