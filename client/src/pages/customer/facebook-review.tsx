import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Check, MapPin, Facebook, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { trackPlatformClick, saveTestimonial } from "@/lib/api";
import justShareNowLogo from "@assets/JustSharenow_logo_1766216638301.png";

interface PublicConfig {
  placeId?: string;
  businessName?: string | null;
  googleReviewsUrl?: string | null;
  googlePlaceId?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  xiaohongshuUrl?: string | null;
  tiktokUrl?: string | null;
  whatsappUrl?: string | null;
  shopPhotos?: string[];
  sliderPhotos?: string[];
  reviewHashtags?: string[];
  companyLogo?: string | null;
  hideJustShareNowLogo?: boolean;
}

interface PublicConfigResponse {
  user: {
    displayName: string;
    slug: string;
  };
  config: PublicConfig | null;
}

const generateFacebookReviews = (hashtags: string[], businessName?: string): string[] => {
  const cleanTags = hashtags.map(h => h.replace('#', '').trim());
  const primaryTag = cleanTags[0] || 'experience';
  const secondaryTag = cleanTags[1] || primaryTag;
  
  return [
    `Just had an amazing ${primaryTag} at ${businessName || 'this place'}! The team was so professional and welcoming. Highly recommend to everyone! ⭐⭐⭐⭐⭐`,
    `Best decision ever coming here for ${primaryTag}! Great ${secondaryTag} and wonderful atmosphere. Will definitely be back! 💯`,
  ];
};

export default function FacebookReview() {
  const { language } = useStore();
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug;
  const { toast } = useToast();
  const t = translations[language];
  
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedReviewIndex, setSelectedReviewIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: configBySlug, isLoading } = useQuery<PublicConfigResponse>({
    queryKey: ['user-config', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/by-slug/${slug}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!slug,
  });

  const config = configBySlug?.config;
  const businessName = config?.businessName || configBySlug?.user?.displayName || '';
  
  const photos = useMemo(() => {
    const allPhotos = config?.shopPhotos || [];
    return allPhotos.slice(0, 2);
  }, [config?.shopPhotos]);

  const reviews = useMemo(() => {
    return generateFacebookReviews(config?.reviewHashtags || [], businessName);
  }, [config?.reviewHashtags, businessName]);

  const buildPostContent = () => {
    const review = selectedReviewIndex !== null ? reviews[selectedReviewIndex] : '';
    const location = businessName ? `\n\n📍 ${businessName}` : '';
    const link = config?.facebookUrl ? `\n${config.facebookUrl}` : '';
    const hashtags = config?.reviewHashtags?.slice(0, 5).join(' ') || '';
    
    return `${review}${location}${link}${hashtags ? `\n\n${hashtags}` : ''}`;
  };

  const handleCopyAndShare = async () => {
    if (selectedReviewIndex === null) {
      toast({
        title: "Please select a review",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const postContent = buildPostContent();
      
      if (config?.googlePlaceId) {
        try {
          await saveTestimonial({
            placeId: config.googlePlaceId,
            platform: 'facebook',
            rating: 5,
            reviewText: reviews[selectedReviewIndex],
            photoUrl: selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null,
            language: language,
          });
        } catch (saveError) {
          console.warn("Failed to save testimonial:", saveError);
        }
      }

      await trackPlatformClick('facebook');

      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isMobile = isIOS || isAndroid;

      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: businessName,
            text: postContent,
            url: config?.facebookUrl || undefined,
          });
          setCopied(true);
          toast({
            title: "Shared!",
            description: "Don't forget to add location when posting!",
          });
          return;
        } catch (shareErr: any) {
          if (shareErr.name !== 'AbortError') {
            console.warn("Web Share failed, falling back to clipboard:", shareErr);
          } else {
            setIsSubmitting(false);
            return;
          }
        }
      }

      let clipboardSuccess = false;
      try {
        await navigator.clipboard.writeText(postContent);
        clipboardSuccess = true;
        setCopied(true);
      } catch (clipboardErr) {
        console.warn("Clipboard write failed:", clipboardErr);
        try {
          const textArea = document.createElement('textarea');
          textArea.value = postContent;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          clipboardSuccess = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (clipboardSuccess) setCopied(true);
        } catch (e) {
          console.warn("Fallback copy failed:", e);
        }
      }

      toast({
        title: clipboardSuccess ? "Copied to clipboard!" : "Ready to share",
        description: "Paste your review when Facebook opens. Add location to tag the business!",
      });

      setTimeout(() => {
        if (isIOS) {
          window.location.href = 'fb://';
          setTimeout(() => {
            window.open('https://www.facebook.com/', '_blank');
          }, 1500);
        } else if (isAndroid) {
          window.location.href = 'intent://facebook.com/#Intent;scheme=https;package=com.facebook.katana;end';
          setTimeout(() => {
            window.open('https://www.facebook.com/', '_blank');
          }, 1500);
        } else {
          window.open('https://www.facebook.com/', '_blank');
        }
      }, 500);

    } catch (e) {
      console.error("Facebook flow error:", e);
      toast({
        title: "Error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!config) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-2">Page Not Found</p>
            <p className="text-muted-foreground text-sm">The business you're looking for could not be found.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const canSubmit = selectedReviewIndex !== null;

  return (
    <Layout>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-32">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            {config.companyLogo && (
              <img 
                src={config.companyLogo} 
                alt="Company Logo" 
                className="w-10 h-10 object-contain"
              />
            )}
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Facebook className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">
            Share on Facebook
          </h1>
          <p className="text-sm text-muted-foreground">
            {businessName && <span className="flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> {businessName}</span>}
          </p>
        </div>

        <div className="space-y-6">
          {photos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Choose a Photo (optional)
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo, index) => (
                  <motion.div
                    key={index}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPhotoIndex(selectedPhotoIndex === index ? null : index)}
                    className="cursor-pointer"
                    data-testid={`photo-option-${index}`}
                  >
                    <Card className={`relative overflow-hidden aspect-square transition-all ${
                      selectedPhotoIndex === index 
                        ? 'ring-2 ring-blue-500 ring-offset-2' 
                        : 'hover:ring-1 hover:ring-blue-300'
                    }`}>
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedPhotoIndex === index && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
              {photos.length < 2 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Only {photos.length} photo available
                </p>
              )}
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">{photos.length > 0 ? '2' : '1'}</span>
              Choose Your Review
            </h2>
            <div className="space-y-3">
              {reviews.map((review, index) => (
                <motion.div
                  key={index}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedReviewIndex(index)}
                  className="cursor-pointer"
                  data-testid={`review-option-${index}`}
                >
                  <Card className={`p-4 transition-all ${
                    selectedReviewIndex === index 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'hover:ring-1 hover:ring-blue-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedReviewIndex === index 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {selectedReviewIndex === index && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{review}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Remember to Add Location!
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              When you create your Facebook post, tap "Check in" or "Add Location" to tag <strong>{businessName}</strong>. This helps others find the business!
            </p>
          </div>

          {selectedPhotoIndex !== null && (
            <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Tip:</strong> Save the photo to your phone first, then add it to your Facebook post.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = photos[selectedPhotoIndex];
                  link.download = `photo-${selectedPhotoIndex + 1}.jpg`;
                  link.target = '_blank';
                  link.click();
                  toast({ title: "Photo download started" });
                }}
                data-testid="button-download-photo"
              >
                Download Selected Photo
              </Button>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4">
          <div className="container max-w-lg mx-auto">
            <Button
              onClick={handleCopyAndShare}
              disabled={!canSubmit || isSubmitting}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              data-testid="button-post-facebook"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing...
                </div>
              ) : copied ? (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Copied! Opening Facebook...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  Copy Review & Open Facebook
                </div>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Your review will be copied. Paste it in your new Facebook post.
            </p>
          </div>
        </div>

        {!config.hideJustShareNowLogo && (
          <div className="fixed bottom-20 right-4 opacity-50">
            <img src={justShareNowLogo} alt="JustShareNow" className="h-6" />
          </div>
        )}
      </div>
    </Layout>
  );
}
