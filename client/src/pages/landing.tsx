import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import qrCodeImage from "@assets/generated_images/generic_qr_code_for_sharelor_app.png";
import { Facebook, Instagram, MapPin, ScanLine } from "lucide-react";

const platforms = [
  {
    id: 'google',
    name: 'Google Reviews',
    icon: <MapPin className="w-6 h-6 text-blue-600" />,
    color: 'bg-blue-50 border-blue-100 text-blue-700',
    description: 'Scan to review on Google Maps'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="w-6 h-6 text-indigo-600" />,
    color: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    description: 'Scan to share on Facebook'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="w-6 h-6 text-pink-600" />,
    color: 'bg-pink-50 border-pink-100 text-pink-700',
    description: 'Scan to post on Instagram'
  },
  {
    id: 'xiaohongshu',
    name: 'XiaoHongShu',
    icon: <span className="text-lg font-bold text-red-600">小</span>,
    color: 'bg-red-50 border-red-100 text-red-700',
    description: 'Scan to share on Red'
  }
];

export default function Landing() {
  const { language } = useStore();
  const [_, setLocation] = useLocation();
  const t = translations[language];

  const handleScan = () => {
    // Simulate scanning a QR code which redirects to the drafting page
    setLocation('/drafting');
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-12 pb-24">
        <div className="text-center mb-12 animate-in-slide-up">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Scan to Share Your Experience
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Shop View: This screen represents the physical QR codes placed at your location.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50"
                onClick={handleScan}
              >
                <CardContent className="p-6 flex flex-col items-center text-center h-full">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${platform.color} bg-opacity-50`}>
                    {platform.icon}
                  </div>
                  
                  <h3 className="font-heading font-bold text-lg mb-2">{platform.name}</h3>
                  
                  <div className="relative w-40 h-40 my-4 bg-white p-2 rounded-xl border shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <img 
                      src={qrCodeImage} 
                      alt={`QR code for ${platform.name}`} 
                      className="w-full h-full object-contain" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/5 rounded-xl backdrop-blur-[1px]">
                      <div className="bg-white text-foreground px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                        <ScanLine className="w-3 h-3" />
                        Simulate Scan
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-auto">
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
