import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useState, useMemo, useRef } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Check, MapPin, Copy, RefreshCw } from "lucide-react";
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

const generateXiaohongshuReviews = (hashtags: string[], businessName?: string): string[] => {
  const cleanTags = hashtags.map(h => h.replace('#', '').trim());
  const primaryTag = cleanTags[0] || '体验';
  const secondaryTag = cleanTags[1] || primaryTag;
  
  return [
    `📍${businessName || '这家店'}\n\n姐妹们！今天来分享一个超棒的${primaryTag}体验 ✨\n\n服务真的太专业了，环境也很舒适，整个过程超级放松～强烈推荐给大家！\n\n⭐⭐⭐⭐⭐ 五星好评！`,
    `🌟 宝藏店铺分享 | ${businessName || '探店'}\n\n终于找到一家满意的${primaryTag}啦！${secondaryTag}效果真的绝了～\n\n店员超级nice，会根据需求推荐，下次还会再来！💯`,
  ];
};

export default function XiaohongshuReview() {
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
  const selectedReviewTextRef = useRef<string>('');

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

  const defaultReviews = useMemo(() => {
    return generateXiaohongshuReviews(config?.reviewHashtags || [], businessName);
  }, [config?.reviewHashtags, businessName]);

  const reviews = aiCaptions || defaultReviews;

  const handleGenerateNewReviews = async () => {
    if (!businessName) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          hashtags: config?.reviewHashtags || [],
          platform: 'xiaohongshu',
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate reviews');
      }
      
      const data = await res.json();
      if (data.captions && data.captions.length >= 2) {
        setAiCaptions(data.captions);
        setSelectedReviewIndex(0);
        selectedReviewTextRef.current = data.captions[0];
        toast({
          title: "新笔记已生成！",
          description: "选择你喜欢的风格",
        });
      }
    } catch (error) {
      console.error('Failed to generate reviews:', error);
      toast({
        title: "生成失败",
        description: "请重试",
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
    const review = selectedReviewTextRef.current || '';
    const hashtags = config?.reviewHashtags?.slice(0, 8).join(' ') || '';
    
    return `${review}${hashtags ? `\n\n${hashtags}` : ''}`;
  };

  const handleSelectReview = (index: number) => {
    setSelectedReviewIndex(index);
    selectedReviewTextRef.current = reviews[index];
  };

  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (clipboardErr) {
      console.warn("Clipboard API failed, trying fallback:", clipboardErr);
    }
    
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
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
      textArea.setSelectionRange(0, text.length);
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (e) {
      console.warn("Fallback copy also failed:", e);
      return false;
    }
  };

  const fetchImageAsBlob = async (imageUrl: string): Promise<Blob | null> => {
    try {
      const proxyUrl = `/api/public/image-proxy?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Failed to fetch image via proxy');
      const blob = await response.blob();
      
      if (blob.type === 'image/png') {
        return blob;
      }
      
      return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((pngBlob) => {
              URL.revokeObjectURL(objectUrl);
              resolve(pngBlob);
            }, 'image/png');
          } else {
            URL.revokeObjectURL(objectUrl);
            resolve(null);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        img.src = objectUrl;
      });
    } catch (error) {
      console.error('Failed to fetch image:', error);
      return null;
    }
  };

  const copyImageAndTextToClipboardAndNavigate = (imageUrl: string, text: string): void => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      console.warn('ClipboardItem API not supported');
      return;
    }

    const proxyUrl = `/api/public/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    
    const imagePromise = fetch(proxyUrl, { cache: 'no-store' })
      .then(r => r.blob());

    const clipboardItem = new ClipboardItem({
      'image/png': imagePromise,
      'text/plain': new Blob([text], { type: 'text/plain' }),
    });

    navigator.clipboard.write([clipboardItem]);

    setTimeout(() => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);

      if (isIOS) {
        window.location.href = 'xhsdiscover://post_note?ignore_draft=true';
        setTimeout(() => {
          window.open('https://www.xiaohongshu.com/', '_blank');
        }, 2500);
      } else if (isAndroid) {
        window.location.href = 'intent://post_note#Intent;scheme=xhsdiscovery;package=com.xingin.xhs;end';
        setTimeout(() => {
          window.open('https://www.xiaohongshu.com/', '_blank');
        }, 2500);
      } else {
        window.open('https://www.xiaohongshu.com/', '_blank');
      }
    }, 0);
  };

  const openXiaohongshuApp = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      window.location.href = 'xhsdiscover://post_note?ignore_draft=true';
      setTimeout(() => {
        window.open('https://www.xiaohongshu.com/', '_blank');
      }, 2500);
    } else if (isAndroid) {
      window.location.href = 'intent://post_note#Intent;scheme=xhsdiscovery;package=com.xingin.xhs;end';
      setTimeout(() => {
        window.open('https://www.xiaohongshu.com/', '_blank');
      }, 2500);
    } else {
      window.open('https://www.xiaohongshu.com/', '_blank');
    }
  };

  const handleShareToXiaohongshu = () => {
    if (selectedReviewIndex === null) {
      toast({
        title: "请选择一条笔记",
        variant: "destructive",
      });
      return;
    }

    const postContent = buildPostContent();
    
    if (selectedPhotoIndex !== null && photos[selectedPhotoIndex]) {
      const photoUrl = photos[selectedPhotoIndex];
      
      toast({
        title: "正在打开小红书...",
        description: '请点击"允许粘贴"',
      });
      
      copyImageAndTextToClipboardAndNavigate(photoUrl, postContent);
    } else {
      copyTextToClipboard(postContent).then(() => {
        toast({
          title: "正在打开小红书...",
          description: '文字已复制，请点击"允许粘贴"',
        });
        openXiaohongshuApp();
      });
    }

    setCopiedText(postContent);
    trackClick('xiaohongshu');
    
    if (config?.googlePlaceId) {
      saveTestimonial({
        placeId: config.googlePlaceId,
        platform: 'xiaohongshu',
        rating: 5,
        reviewText: reviews[selectedReviewIndex],
        photoUrl: selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null,
        language: language,
      }).catch(err => console.warn("Failed to save testimonial:", err));
    }
  };

  const handleOpenXiaohongshu = () => {
    openXiaohongshuApp();
  };

  const handleCopyAgain = async () => {
    try {
      await navigator.clipboard.writeText(copiedText);
      toast({ title: "已复制！" });
    } catch (e) {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载中...</p>
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
            <p className="text-lg font-semibold text-foreground mb-2">页面未找到</p>
            <p className="text-muted-foreground text-sm">找不到该商家</p>
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
              笔记已复制！
            </h1>
            <p className="text-sm text-muted-foreground">
              打开小红书粘贴发布
            </p>
          </div>

          <div className="space-y-4">
            <Card className="p-4 bg-gray-50 dark:bg-gray-900">
              <p className="text-sm text-foreground whitespace-pre-wrap">{copiedText}</p>
            </Card>

            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                发布步骤：
              </h3>
              <ol className="text-xs text-red-700 dark:text-red-300 space-y-1 list-decimal list-inside">
                <li>点击下方 <strong>"分享到小红书"</strong> 按钮</li>
                <li>当提示 <strong>"允许粘贴"</strong> 时，点击允许</li>
                <li>选择照片，文字将自动填入</li>
                <li>确认内容后点击 <strong>"发布"</strong></li>
              </ol>
            </div>

            <Button
              variant="outline"
              onClick={handleCopyAgain}
              className="w-full"
              data-testid="button-copy-again"
            >
              <Copy className="w-4 h-4 mr-2" />
              再次复制
            </Button>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4">
            <div className="container max-w-lg mx-auto space-y-2">
              <Button
                onClick={handleOpenXiaohongshu}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold"
                data-testid="button-open-xiaohongshu"
              >
                <span className="text-lg font-bold mr-2">小红书</span>
                分享到小红书
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep('select')}
                className="w-full text-muted-foreground"
              >
                ← 返回选择
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
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">小红书</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">
            分享到小红书
          </h1>
          <p className="text-sm text-muted-foreground">
            {businessName && <span className="flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> {businessName}</span>}
          </p>
        </div>

        <div className="space-y-6">
          {photos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                选择照片（可选）
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
                        ? 'ring-2 ring-red-500 ring-offset-2' 
                        : 'hover:ring-1 hover:ring-red-300'
                    }`}>
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedPhotoIndex === index && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
              {photos.length < 2 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  仅有 {photos.length} 张照片
                </p>
              )}
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">{photos.length > 0 ? '2' : '1'}</span>
              选择笔记内容
            </h2>
            <div className="space-y-3">
              {reviews.map((review, index) => (
                <motion.div
                  key={index}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectReview(index)}
                  className="cursor-pointer"
                  data-testid={`review-option-${index}`}
                >
                  <Card className={`p-4 transition-all ${
                    selectedReviewIndex === index 
                      ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-950' 
                      : 'hover:ring-1 hover:ring-red-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedReviewIndex === index 
                          ? 'bg-red-500 border-red-500' 
                          : 'border-gray-300'
                      }`}>
                        {selectedReviewIndex === index && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{review}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              记得添加地点！
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300">
              发布时点击"添加地点"标记 <strong>{businessName}</strong>，让更多人发现这家店！
            </p>
          </div>

          {selectedPhotoIndex !== null && (
            <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>提示：</strong>先保存照片到手机相册，发布时再从相册选择
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
                  toast({ title: "开始下载照片" });
                }}
                data-testid="button-download-photo"
              >
                下载照片
              </Button>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              发布步骤：
            </h3>
            <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>点击下方 <strong>"分享到小红书"</strong> 按钮</li>
              <li>当提示 <strong>"允许粘贴"</strong> 时，点击允许</li>
              <li>选择照片，文字将自动填入</li>
              <li>确认内容后点击 <strong>"发布"</strong></li>
            </ol>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4">
          <div className="container max-w-lg mx-auto">
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateNewReviews}
                disabled={isGenerating}
                variant="outline"
                className="h-12 px-6 border-red-300 text-red-600 hover:bg-red-50"
                data-testid="button-switch-review"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                换一换
              </Button>
              <Button
                onClick={handleShareToXiaohongshu}
                disabled={!canSubmit || isSubmitting || isGenerating}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-semibold"
                data-testid="button-share-xiaohongshu"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    正在打开...
                  </div>
                ) : isGenerating ? (
                  <div className="flex items-center gap-2">
                    生成中...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold">小红书</span>
                    分享到小红书
                  </div>
                )}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              点击按钮直接打开小红书发布
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
