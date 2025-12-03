import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, ChevronRight, RefreshCw, Share2, ExternalLink, Copy, X, ThumbsUp, UserPlus, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [reviewSetIndex, setReviewSetIndex] = useState(0);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  
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
  
  const availableHashtags = config?.reviewHashtags || [];
  
  const toggleHashtag = (hashtag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(hashtag) 
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    );
  };
  
  const getReviewWithHashtags = () => {
    if (!selectedReview) return "";
    if (selectedHashtags.length === 0) return selectedReview;
    return `${selectedReview}\n\n${selectedHashtags.join(' ')}`;
  };
  
  const t = translations[language];
  const activePlatform = platforms.find(p => p.id === selectedPlatform);
  const currentReviews = t.customer.drafting.reviewSets[reviewSetIndex];
  
  const handleNext = () => {
    if (selectedPhoto && selectedReview) {
      setIsModalOpen(true);
    }
  };

  const handleSwitch = () => {
    setSelectedPhoto("");
    setSelectedReview("");
    // Rotate to next review set
    const totalSets = t.customer.drafting.reviewSets.length;
    setReviewSetIndex((prev) => (prev + 1) % totalSets);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsModalOpen(false);
  };

  const handleReviewAction = async () => {
    if (activePlatform?.id === 'google') {
        const url = socialLinks.google || "https://www.google.com/maps";
        window.open(url, '_blank');
    }
    if (activePlatform?.id) {
      await trackPlatformClick(activePlatform.id);
    }
    setIsModalOpen(false);
  };

  const handleShareAction = async () => {
    const textToCopy = getReviewWithHashtags();
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast({
        title: t.common.copied,
        description: selectedHashtags.length > 0 
          ? "Review text with hashtags copied. Ready to paste!"
          : "Review text copied. Ready to paste!",
      });
    }
    if (activePlatform?.id) {
      await trackPlatformClick(activePlatform.id);
    }
    setIsModalOpen(false);
  };

  const handleFollowAction = async () => {
    let url = "";
    if (activePlatform?.id === 'follow-facebook') {
      url = socialLinks.facebook || "https://facebook.com";
    } else if (activePlatform?.id === 'follow-instagram') {
      url = socialLinks.instagram || "https://instagram.com";
    }
    if (url) window.open(url, '_blank');
    if (activePlatform?.id) {
      await trackPlatformClick(activePlatform.id);
    }
    setIsModalOpen(false);
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
            {currentReviews.map((review, idx) => (
              <Card 
                key={`${reviewSetIndex}-${idx}`}
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

        {/* Hashtags Section */}
        {availableHashtags.length > 0 && (
          <section className="mb-8 animate-in-slide-up" style={{ animationDelay: '300ms' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 ml-1 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Add Hashtags (Optional)
            </h2>
            <div className="flex flex-wrap gap-2">
              {availableHashtags.map((hashtag, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleHashtag(hashtag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedHashtags.includes(hashtag)
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                  }`}
                  data-testid={`button-hashtag-${idx}`}
                >
                  {hashtag}
                </button>
              ))}
            </div>
            {selectedHashtags.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedHashtags.length} hashtag{selectedHashtags.length > 1 ? 's' : ''} will be added to your review
              </p>
            )}
          </section>
        )}
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

      {/* Simplified Modal with single X close button */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          {/* Close button at top right */}
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            data-testid="button-close-modal"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          <div className="flex flex-col items-center gap-4 py-6 pt-8">
            <DialogTitle className="text-xl font-bold text-center">{activePlatform?.name}</DialogTitle>
            
            {/* Google Review */}
            {activePlatform?.id === 'google' && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  We'd love to hear your feedback on Google!
                </p>
                <Button onClick={handleReviewAction} className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Leave a Review
                </Button>
              </>
            )}

            {/* XHS Share */}
            {activePlatform?.id === 'xiaohongshu' && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Copy your text and share your photo on XiaoHongShu!
                </p>
                <Button onClick={handleShareAction} className="h-12 w-full bg-red-600 hover:bg-red-700 text-white">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy & Share
                </Button>
              </>
            )}

            {/* Facebook Share */}
            {activePlatform?.id === 'facebook' && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Share your experience on Facebook!
                </p>
                <Button onClick={handleShareAction} className="h-12 w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share on Facebook
                </Button>
              </>
            )}

            {/* Instagram Share */}
            {activePlatform?.id === 'instagram' && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Share your experience on Instagram!
                </p>
                <Button onClick={handleShareAction} className="h-12 w-full bg-pink-600 hover:bg-pink-700 text-white">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share on Instagram
                </Button>
              </>
            )}

            {/* Follow Facebook */}
            {activePlatform?.id === 'follow-facebook' && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Stay updated with our latest news!
                </p>
                <Button onClick={handleFollowAction} className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Follow on Facebook
                </Button>
              </>
            )}

            {/* Follow Instagram */}
            {activePlatform?.id === 'follow-instagram' && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Stay updated with our latest news!
                </p>
                <Button onClick={handleFollowAction} className="h-12 w-full bg-pink-600 hover:bg-pink-700 text-white">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Follow on Instagram
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
