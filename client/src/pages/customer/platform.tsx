import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

// Platform Colors & Icons (Mocking logos with text/colors for now or could use lucide if suitable)
const platforms = [
  { 
    id: 'google', 
    name: 'Google Maps', 
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200', 
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600' 
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200', 
    textColor: 'text-indigo-700',
    iconColor: 'text-indigo-600' 
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    color: 'bg-pink-50 hover:bg-pink-100 border-pink-200', 
    textColor: 'text-pink-700',
    iconColor: 'text-pink-600' 
  },
  { 
    id: 'xiaohongshu', 
    name: 'XiaoHongShu', 
    color: 'bg-red-50 hover:bg-red-100 border-red-200', 
    textColor: 'text-red-700',
    iconColor: 'text-red-600' 
  },
];

export default function CustomerPlatform() {
  const { language, selectedReview, selectedPhoto, incrementStat } = useStore();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const t = translations[language];

  const handlePlatformClick = (platformId: string) => {
    // 1. Copy text
    if (selectedReview) {
      navigator.clipboard.writeText(selectedReview);
      toast({
        title: t.common.copied,
        description: "Review text copied to clipboard.",
        duration: 3000,
      });
    }
    
    // 2. Track stat
    incrementStat(platformId);
    
    // 3. Simulate opening app (In a real app, this would be a deep link)
    // For demo, we just show a success state or toast
    setTimeout(() => {
        // Could redirect to a "Thank You" page, but let's keep it simple
    }, 1000);
  };

  if (!selectedReview || !selectedPhoto) {
    // Redirect back if state is missing (e.g. refresh)
    setLocation('/');
    return null;
  }

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:bg-transparent text-muted-foreground" 
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          {t.common.back}
        </Button>

        <div className="mb-8 animate-in-slide-up">
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">{t.customer.platform.title}</h1>
            <p className="text-muted-foreground">{t.customer.platform.instruction}</p>
        </div>

        {/* Preview Card */}
        <Card className="mb-8 overflow-hidden border-dashed border-2 bg-muted/30 animate-in-fade">
            <div className="flex p-4 gap-4 items-start">
                <img src={selectedPhoto} alt="Selected" className="w-20 h-20 rounded-lg object-cover shadow-sm" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground line-clamp-3 italic">"{selectedReview}"</p>
                    <div className="mt-2 flex items-center text-xs text-primary font-medium">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ready to post
                    </div>
                </div>
            </div>
        </Card>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 gap-4 animate-in-slide-up" style={{ animationDelay: '100ms' }}>
            {platforms.map((platform) => (
                <button
                    key={platform.id}
                    onClick={() => handlePlatformClick(platform.id)}
                    className={`
                        w-full p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group
                        ${platform.color}
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${platform.iconColor}`}>
                            <ExternalLink className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className={`block font-bold ${platform.textColor}`}>{platform.name}</span>
                            <span className="text-xs text-muted-foreground/80">Click to copy & open</span>
                        </div>
                    </div>
                    <Copy className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${platform.textColor}`} />
                </button>
            ))}
        </div>
      </div>
    </Layout>
  );
}
