import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Copy, CheckCircle2, RefreshCw, Share2, ThumbsUp, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useState } from "react";

const platforms = [
  { 
    id: 'google', 
    name: 'Google Reviews', 
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200', 
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600',
    actionType: 'review'
  },
  { 
    id: 'xiaohongshu', 
    name: 'XiaoHongShu', 
    color: 'bg-red-50 hover:bg-red-100 border-red-200', 
    textColor: 'text-red-700',
    iconColor: 'text-red-600',
    actionType: 'share'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200', 
    textColor: 'text-indigo-700',
    iconColor: 'text-indigo-600',
    actionType: 'share'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    color: 'bg-pink-50 hover:bg-pink-100 border-pink-200', 
    textColor: 'text-pink-700',
    iconColor: 'text-pink-600',
    actionType: 'share'
  },
  {
    id: 'follow-facebook',
    name: 'Follow Us on Facebook',
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600',
    actionType: 'follow',
    icon: <ThumbsUp className="w-5 h-5" />
  },
  {
    id: 'follow-instagram',
    name: 'Follow Us on Instagram',
    color: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
    textColor: 'text-pink-700',
    iconColor: 'text-pink-600',
    actionType: 'follow',
    icon: <UserPlus className="w-5 h-5" />
  }
];

export default function CustomerPlatform() {
  const { language, selectedReview, selectedPhoto, incrementStat, socialLinks, setSelectedPhoto, setSelectedReview } = useStore();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const t = translations[language];

  const [activePlatform, setActivePlatform] = useState<typeof platforms[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlatformClick = (platform: typeof platforms[0]) => {
    setActivePlatform(platform);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setActivePlatform(null);
  };

  const handleSwitch = () => {
    setIsModalOpen(false);
    setSelectedPhoto("");
    setSelectedReview("");
    setLocation('/drafting');
  };

  const handleReviewAction = () => {
    if (activePlatform?.id === 'google') {
        const url = socialLinks.google || "https://www.google.com/maps"; // Fallback if not set
        window.open(url, '_blank');
    }
    incrementStat(activePlatform?.id || 'unknown');
  };

  const handleShareAction = () => {
    // Copy text
    if (selectedReview) {
      navigator.clipboard.writeText(selectedReview);
      toast({
        title: t.common.copied,
        description: "Review text copied. Ready to paste!",
      });
    }
    
    // Open app logic would go here (deep links)
    // For MVP, just showing the copy success is good
    
    incrementStat(activePlatform?.id || 'unknown');
  };

  if (!selectedReview || !selectedPhoto) {
    // Redirect back if state is missing (e.g. refresh)
    setLocation('/drafting');
    return null;
  }

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:bg-transparent text-muted-foreground" 
          onClick={() => setLocation('/drafting')}
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          {t.common.back}
        </Button>

        <div className="mb-8 animate-in-slide-up">
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">{t.customer.platform.title}</h1>
            <p className="text-muted-foreground">{t.customer.platform.instruction}</p>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 gap-4 animate-in-slide-up" style={{ animationDelay: '100ms' }}>
            {platforms.map((platform) => (
                <button
                    key={platform.id}
                    onClick={() => handlePlatformClick(platform)}
                    className={`
                        w-full p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group
                        ${platform.color}
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${platform.iconColor}`}>
                            {platform.icon || <ExternalLink className="w-5 h-5" />}
                        </div>
                        <div className="text-left">
                            <span className={`block font-bold ${platform.textColor}`}>{platform.name}</span>
                            <span className="text-xs text-muted-foreground/80">
                                {platform.actionType === 'follow' ? 'Click to Follow' : 'Click to Share'}
                            </span>
                        </div>
                    </div>
                </button>
            ))}
        </div>

        {/* Interaction Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>{activePlatform?.name}</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    
                    {/* Google Specific Layout */}
                    {activePlatform?.id === 'google' && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                We'd love to hear your feedback on Google!
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={handleSwitch} className="h-12">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Switch
                                </Button>
                                <Button onClick={handleReviewAction} className="h-12 bg-blue-600 hover:bg-blue-700 text-white">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Review
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* XHS Specific Layout */}
                    {activePlatform?.id === 'xiaohongshu' && (
                         <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                Copy your text and share your photo on XiaoHongShu!
                            </p>
                            <Button onClick={handleShareAction} className="h-12 bg-red-600 hover:bg-red-700 text-white w-full">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy & Open XHS
                            </Button>
                        </div>
                    )}

                    {/* Facebook/Instagram Specific Layout */}
                    {(activePlatform?.id === 'facebook' || activePlatform?.id === 'instagram') && (
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={handleSwitch} className="h-12">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Switch
                                </Button>
                                <Button onClick={handleShareAction} className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Follow Actions */}
                    {activePlatform?.actionType === 'follow' && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                Stay updated with our latest news!
                            </p>
                            <Button className="h-12 w-full">
                                {activePlatform.id === 'follow-facebook' ? <ThumbsUp className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                Follow Now
                            </Button>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
