import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Check, MapPin, Instagram, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { saveTestimonial } from "@/lib/api";
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

const generateInstagramCaptions = (hashtags: string[], businessName?: string): string[] => {
  const cleanTags = hashtags.map(h => h.replace('#', '').trim());
  const primaryTag = cleanTags[0] || 'experience';
  const secondaryTag = cleanTags[1] || primaryTag;
  
  return [
    `✨ Amazing ${primaryTag} at ${businessName || 'this place'}! The team was so professional and welcoming. Highly recommend! ⭐⭐⭐⭐⭐`,
    `Best ${primaryTag} ever! 🙌 Great ${secondaryTag} and wonderful vibes at ${businessName || 'here'}. Will definitely be back! 💯`,
  ];
};

export default function InstagramReview() {
  const { language } = useStore();
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug;
  const { toast } = useToast();
  const t = translations[language];
  
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedReviewIndex, setSelectedReviewIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'select' | 'ready'>('select');
  const [copiedText, setCopiedText] = useState('');
  const [aiCaptions, setAiCaptions] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const defaultCaptions = useMemo(() => {
    return generateInstagramCaptions(config?.reviewHashtags || [], businessName);
  }, [config?.reviewHashtags, businessName]);

  const captions = aiCaptions || defaultCaptions;

  const handleGenerateNewCaptions = async () => {
    if (!businessName) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          hashtags: config?.reviewHashtags || [],
          platform: 'instagram',
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate captions');
      }
      
      const data = await res.json();
      if (data.captions && data.captions.length >= 2) {
        setAiCaptions(data.captions);
        setSelectedReviewIndex(0);
        toast({
          title: "New captions generated!",
          description: "Pick the one you like best.",
        });
      }
    } catch (error) {
      console.error('Failed to generate captions:', error);
      toast({
        title: "Couldn't generate new captions",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const trackClick = (platform: string) => {
    if (config?.placeId) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, placeId: config.placeId }),
      }).catch(console.error);
    }
  };

  const buildPostContent = () => {
    const caption = selectedReviewIndex !== null ? captions[selectedReviewIndex] : '';
    const location = businessName ? `\n\n📍 ${businessName}` : '';
    const hashtags = config?.reviewHashtags?.slice(0, 10).join(' ') || '';
    
    return `${caption}${location}${hashtags ? `\n\n${hashtags}` : ''}`;
  };

  const handleCopyCaption = async () => {
    if (selectedReviewIndex === null) {
      toast({
        title: "Please select a caption",
        variant: "destructive",
      });
      return;
    }

    const postContent = buildPostContent();
    
    let clipboardSuccess = false;
    try {
      await navigator.clipboard.writeText(postContent);
      clipboardSuccess = true;
    } catch (clipboardErr) {
      console.warn("Clipboard API failed, trying fallback:", clipboardErr);
    }
    
    if (!clipboardSuccess) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = postContent;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        textArea.setSelectionRange(0, postContent.length);
        
        clipboardSuccess = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (e) {
        console.warn("Fallback copy also failed:", e);
      }
    }

    if (clipboardSuccess) {
      setCopiedText(postContent);
      setStep('ready');
      toast({
        title: "Caption Copied!",
        description: "Now open Instagram and paste your caption.",
      });
      
      setIsSubmitting(true);
      trackClick('instagram');
      if (config?.googlePlaceId) {
        saveTestimonial({
          placeId: config.googlePlaceId,
          platform: 'instagram',
          rating: 5,
          reviewText: captions[selectedReviewIndex],
          photoUrl: selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null,
          language: language,
        }).catch(err => console.warn("Failed to save testimonial:", err));
      }
      setIsSubmitting(false);
    } else {
      setCopiedText(postContent);
      setStep('ready');
      toast({
        title: "Tap and hold the text below to copy",
        description: "Then paste it in Instagram.",
      });
    }
  };

  const handleOpenInstagram = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      window.location.href = 'instagram://app';
      setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank');
      }, 2000);
    } else if (isAndroid) {
      window.location.href = 'intent://instagram.com/#Intent;scheme=https;package=com.instagram.android;end';
      setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank');
      }, 2000);
    } else {
      window.open('https://www.instagram.com/', '_blank');
    }
  };

  const handleCopyAgain = async () => {
    try {
      await navigator.clipboard.writeText(copiedText);
      toast({ title: "Copied again!" });
    } catch (e) {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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

  if (step === 'ready') {
    return (
      <Layout>
        <div className="container max-w-lg mx-auto px-4 py-6 pb-32">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Caption Copied!
            </h1>
            <p className="text-sm text-muted-foreground">
              Your caption is ready to paste in Instagram
            </p>
          </div>

          <div className="space-y-4">
            <Card className="p-4 bg-gray-50 dark:bg-gray-900">
              <p className="text-sm text-foreground whitespace-pre-wrap">{copiedText}</p>
            </Card>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
              <h3 className="text-sm font-semibold text-pink-800 dark:text-pink-200 mb-2">
                How to post on Instagram:
              </h3>
              <ol className="text-xs text-pink-700 dark:text-pink-300 space-y-1 list-decimal list-inside">
                <li>Open Instagram and tap + to create a new post</li>
                <li>Select or take a photo</li>
                <li>Tap "Write a caption" and long-press to Paste</li>
                <li>Add location by tapping "Add location"</li>
                <li>Share your post!</li>
              </ol>
            </div>

            <Button
              variant="outline"
              onClick={handleCopyAgain}
              className="w-full"
              data-testid="button-copy-again"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Again
            </Button>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4">
            <div className="container max-w-lg mx-auto space-y-2">
              <Button
                onClick={handleOpenInstagram}
                className="w-full h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-semibold"
                data-testid="button-open-instagram"
              >
                <Instagram className="w-5 h-5 mr-2" />
                Open Instagram
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep('select')}
                className="w-full text-muted-foreground"
              >
                ← Back to selection
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 rounded-xl flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">
            Share on Instagram
          </h1>
          <p className="text-sm text-muted-foreground">
            {businessName && <span className="flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> {businessName}</span>}
          </p>
        </div>

        <div className="space-y-6">
          {photos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
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
                        ? 'ring-2 ring-pink-500 ring-offset-2' 
                        : 'hover:ring-1 hover:ring-pink-300'
                    }`}>
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedPhotoIndex === index && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
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
              <span className="w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs font-bold">{photos.length > 0 ? '2' : '1'}</span>
              Choose Your Caption
            </h2>
            <div className="space-y-3">
              {captions.map((caption, index) => (
                <motion.div
                  key={index}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedReviewIndex(index)}
                  className="cursor-pointer"
                  data-testid={`caption-option-${index}`}
                >
                  <Card className={`p-4 transition-all ${
                    selectedReviewIndex === index 
                      ? 'ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-950' 
                      : 'hover:ring-1 hover:ring-pink-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedReviewIndex === index 
                          ? 'bg-pink-500 border-pink-500' 
                          : 'border-gray-300'
                      }`}>
                        {selectedReviewIndex === index && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{caption}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
            <h3 className="text-sm font-semibold text-pink-800 dark:text-pink-200 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Remember to Tag Location!
            </h3>
            <p className="text-xs text-pink-700 dark:text-pink-300">
              When you create your Instagram post, tap "Add location" to tag <strong>{businessName}</strong>. This helps others discover the business!
            </p>
          </div>

          {selectedPhotoIndex !== null && (
            <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Tip:</strong> Save the photo to your phone first, then select it when creating your Instagram post.
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
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateNewCaptions}
                disabled={isGenerating}
                variant="outline"
                className="h-12 px-6 border-pink-300 text-pink-600 hover:bg-pink-50"
                data-testid="button-switch-caption"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                Switch
              </Button>
              <Button
                onClick={handleCopyCaption}
                disabled={!canSubmit || isSubmitting || isGenerating}
                className="flex-1 h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-semibold"
                data-testid="button-copy-caption"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Copying...
                  </div>
                ) : isGenerating ? (
                  <div className="flex items-center gap-2">
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5" />
                    Copy & Paste to Insta
                  </div>
                )}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Tap Switch for new AI-generated captions
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
