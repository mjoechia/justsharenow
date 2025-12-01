import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, ChevronRight, RefreshCw, Share2, ExternalLink, Copy, X, ThumbsUp, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getStoreConfig, trackPlatformClick } from "@/lib/api";

import hairImage from "@assets/generated_images/before_and_after_hair_treatment_comparison.png";
import skinImage from "@assets/generated_images/before_and_after_skin_treatment_comparison.png";
import regrowLogo from "@assets/generated_images/regrow_group_corporate_logo.png";

const photos = [
  { id: 'hair', src: hairImage, label: 'Hair Treatment' },
  { id: 'skin', src: skinImage, label: 'Skin Treatment' },
];

const platforms = [
  { 
    id: 'google', 
    name: 'Google Reviews', 
    actionType: 'review'
  },
  { 
    id: 'xiaohongshu', 
    name: 'XiaoHongShu', 
    actionType: 'share'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    actionType: 'share'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    actionType: 'share'
  },
  {
    id: 'follow-facebook',
    name: 'Follow Us on Facebook',
    actionType: 'follow'
  },
  {
    id: 'follow-instagram',
    name: 'Follow Us on Instagram',
    actionType: 'follow'
  }
];


export default function CustomerDrafting() {
  const { language, setSelectedReview, setSelectedPhoto, selectedPhoto, selectedReview, selectedPlatform } = useStore();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });
  
  const socialLinks = {
    google: config?.googleUrl || "",
    facebook: config?.facebookUrl || "",
    instagram: config?.instagramUrl || "",
    xiaohongshu: config?.xiaohongshuUrl || "",
  };
  
  const t = translations[language];
  const activePlatform = platforms.find(p => p.id === selectedPlatform);
  
  const handleNext = () => {
    if (selectedPhoto && selectedReview) {
      setIsModalOpen(true);
    }
  };

  const handleSwitch = () => {
    // Clear selection to allow user to "switch" or re-select
    setSelectedPhoto("");
    setSelectedReview("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsModalOpen(false);
  };

  const handleReviewAction = async () => {
    if (activePlatform?.id === 'google') {
        const url = socialLinks.google || "https://www.google.com/maps"; // Fallback if not set
        window.open(url, '_blank');
    }
    // Track analytics
    if (activePlatform?.id) {
      await trackPlatformClick(activePlatform.id);
    }
  };

  const handleShareAction = async () => {
    // Copy text
    if (selectedReview) {
      navigator.clipboard.writeText(selectedReview);
      toast({
        title: t.common.copied,
        description: "Review text copied. Ready to paste!",
      });
    }
    // Track analytics
    if (activePlatform?.id) {
      await trackPlatformClick(activePlatform.id);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-8 pb-32">
        <div className="text-center mb-8 animate-in-slide-up">
          <img src={regrowLogo} alt="Regrow" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">{t.customer.drafting.title}</h1>
          <p className="text-muted-foreground text-sm">{t.customer.drafting.subtitle}</p>
        </div>

        {/* Photo Selection */}
        <section className="mb-8 animate-in-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 ml-1">
            {t.customer.drafting.selectPhoto}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div 
                key={photo.id}
                onClick={() => setSelectedPhoto(photo.src)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
                  selectedPhoto === photo.src 
                    ? 'border-primary ring-2 ring-primary/20 scale-95' 
                    : 'border-transparent hover:border-border'
                }`}
              >
                <img src={photo.src} alt={photo.label} className="w-full h-full object-cover" />
                {selectedPhoto === photo.src && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-xs">
                    <div className="bg-white text-primary rounded-full p-1 shadow-lg">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Review Selection */}
        <section className="mb-8 animate-in-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 ml-1">
            {t.customer.drafting.selectReview}
          </h2>
          <div className="space-y-3">
            {t.customer.drafting.reviews.map((review, idx) => (
              <Card 
                key={idx}
                onClick={() => setSelectedReview(review)}
                className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedReview === review 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm leading-relaxed text-foreground">{review}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Floating Action Button Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t z-10">
        <div className="container max-w-md mx-auto flex gap-3">
          <Button 
            variant="outline"
            className="flex-1 h-12 text-base font-medium"
            onClick={handleSwitch}
          >
            <RefreshCw className="mr-2 w-4 h-4" />
            Switch
          </Button>
          
          <Button 
            className="flex-1 h-12 text-base font-medium shadow-lg shadow-primary/20" 
            onClick={handleNext}
            disabled={!selectedPhoto || !selectedReview}
          >
            Share
            <Share2 className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Interaction Modal - Directly in Drafting Page now */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>{activePlatform?.name}</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsModalOpen(false)}>
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

    </Layout>
  );
}
