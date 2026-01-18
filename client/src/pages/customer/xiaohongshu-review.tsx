import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Check, MapPin, Copy, RefreshCw, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { saveTestimonial, getUsedReviewTexts, isReviewUsed } from "@/lib/api";
import justShareNowLogo from "@assets/JustSharenow_logo_1766216638301.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  
  // Preflight state for XHS clipboard - preload image when selected
  const [preloadedImageBlob, setPreloadedImageBlob] = useState<Blob | null>(null);
  const [imagePreloadStatus, setImagePreloadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [imageValidation, setImageValidation] = useState<{ isJpeg: boolean; sizeOk: boolean; headerValid: boolean }>({ 
    isJpeg: false, sizeOk: false, headerValid: false 
  });

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
  
  // Fetch used reviews to filter out duplicates
  const placeId = config?.googlePlaceId;
  const { data: usedReviewTexts = [] } = useQuery<string[]>({
    queryKey: ['usedReviews', placeId],
    queryFn: () => placeId ? getUsedReviewTexts(placeId) : Promise.resolve([]),
    enabled: !!placeId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  const photos = useMemo(() => {
    const allPhotos = config?.shopPhotos || [];
    return allPhotos.slice(0, 2);
  }, [config?.shopPhotos]);

  const defaultReviews = useMemo(() => {
    return generateXiaohongshuReviews(config?.reviewHashtags || [], businessName);
  }, [config?.reviewHashtags, businessName]);

  // Filter out already-used reviews to prevent duplicates
  const filteredDefaultReviews = useMemo(() => {
    if (usedReviewTexts.length === 0) return defaultReviews;
    return defaultReviews.filter(review => !isReviewUsed(review, usedReviewTexts));
  }, [defaultReviews, usedReviewTexts]);
  
  const filteredAiCaptions = useMemo(() => {
    if (!aiCaptions || usedReviewTexts.length === 0) return aiCaptions;
    return aiCaptions.filter(review => !isReviewUsed(review, usedReviewTexts));
  }, [aiCaptions, usedReviewTexts]);
  
  // Use filtered reviews (fallback to original if all are filtered)
  const reviews = (filteredAiCaptions && filteredAiCaptions.length > 0) 
    ? filteredAiCaptions 
    : (filteredDefaultReviews.length > 0 ? filteredDefaultReviews : defaultReviews);

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

  // Validate JPEG header (FF D8 FF)
  const validateJpegHeader = useCallback(async (blob: Blob): Promise<boolean> => {
    try {
      const buffer = await blob.slice(0, 3).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    } catch {
      return false;
    }
  }, []);

  // Preload and validate image when photo is selected
  useEffect(() => {
    if (selectedPhotoIndex === null || !photos[selectedPhotoIndex]) {
      setPreloadedImageBlob(null);
      setImagePreloadStatus('idle');
      setImageValidation({ isJpeg: false, sizeOk: false, headerValid: false });
      return;
    }

    const photoUrl = photos[selectedPhotoIndex];
    const proxyUrl = `/api/public/image-proxy?url=${encodeURIComponent(photoUrl)}`;

    setImagePreloadStatus('loading');
    setPreloadedImageBlob(null);
    setImageValidation({ isJpeg: false, sizeOk: false, headerValid: false });

    const controller = new AbortController();

    fetch(proxyUrl, { 
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal
    })
      .then(r => {
        if (!r.ok) throw new Error('Image fetch failed');
        return r.blob();
      })
      .then(async (blob) => {
        const isJpeg = blob.type === 'image/jpeg';
        const sizeOk = blob.size <= 600 * 1024; // ≤600KB
        const headerValid = await validateJpegHeader(blob);

        console.log('XHS Preflight - Image preloaded:', {
          type: blob.type,
          size: `${(blob.size / 1024).toFixed(1)}KB`,
          isJpeg,
          sizeOk,
          headerValid
        });

        setPreloadedImageBlob(blob);
        setImageValidation({ isJpeg, sizeOk, headerValid });
        setImagePreloadStatus(isJpeg && sizeOk && headerValid ? 'ready' : 'error');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('XHS Preflight - Image preload failed:', err);
          setImagePreloadStatus('error');
        }
      });

    return () => controller.abort();
  }, [selectedPhotoIndex, photos, validateJpegHeader]);

  // Platform detection helpers for kill-switch
  const platformInfo = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isIOSSafari: false, isDesktop: true, isInWebView: false, canUseWebShare: false };
    }
    
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|edgios/.test(ua);
    const isIOSSafari = isIOS && isSafari;
    const isDesktop = !isIOS && !/android/.test(ua);
    
    // Detect in-app browsers / WebViews
    const isInWebView = /fbav|fban|instagram|line|wechat|weibo|qq|twitter/.test(ua) ||
      (isIOS && !isSafari && /safari/.test(ua) === false);
    
    // Check Web Share API with files support
    let canUseWebShare = false;
    try {
      canUseWebShare = !!navigator.share && !!navigator.canShare;
    } catch {
      canUseWebShare = false;
    }
    
    return { isIOSSafari, isDesktop, isInWebView, canUseWebShare };
  }, []);

  // Clipboard support check (fallback)
  const isClipboardSupported = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const hasClipboardItem = typeof window !== 'undefined' && 'ClipboardItem' in window;
      return !!(navigator.clipboard?.write && hasClipboardItem);
    } catch {
      return false;
    }
  }, []);

  // Can share to XHS - prioritize Web Share API, fallback to clipboard
  const canShareToXhs = useMemo(() => {
    const hasReview = selectedReviewIndex !== null;
    const hasPhoto = selectedPhotoIndex !== null;
    const imageReady = imagePreloadStatus === 'ready' && preloadedImageBlob !== null;
    const imageValid = imageValidation.isJpeg && imageValidation.sizeOk && imageValidation.headerValid;
    const imageFailed = imagePreloadStatus === 'error' || (hasPhoto && !imageValid && imagePreloadStatus !== 'loading');
    
    const { isIOSSafari, isDesktop, isInWebView, canUseWebShare } = platformInfo;
    
    // Level 1 Hard Block: Desktop or WebView can't use Web Share effectively
    if (isDesktop || isInWebView) {
      // Allow text-only fallback on unsupported platforms
      return hasReview;
    }

    // If no photo selected, we can share text-only
    if (hasReview && !hasPhoto) return true;
    
    // Primary: Web Share API with files (iOS Safari)
    if (hasReview && hasPhoto && imageReady && imageValid && canUseWebShare && isIOSSafari) {
      return true;
    }
    
    // Fallback: Clipboard approach (if Web Share unavailable)
    if (hasReview && hasPhoto && imageReady && imageValid && isClipboardSupported) return true;
    
    // If photo selected but image failed validation, allow text-only fallback
    if (hasReview && hasPhoto && imageFailed) return true;
    
    return false;
  }, [selectedReviewIndex, selectedPhotoIndex, imagePreloadStatus, preloadedImageBlob, imageValidation, isClipboardSupported, platformInfo]);

  // Get share button state message
  const getShareButtonState = useCallback(() => {
    if (selectedReviewIndex === null) {
      return { disabled: true, message: '请选择一条笔记' };
    }
    if (selectedPhotoIndex !== null) {
      if (imagePreloadStatus === 'loading') {
        return { disabled: true, message: '图片加载中…' };
      }
      // If image validation failed but we have a review, offer text-only sharing
      if (imagePreloadStatus === 'error' || !imageValidation.isJpeg || !imageValidation.sizeOk) {
        return { disabled: false, message: null, imageError: true };
      }
      if (!isClipboardSupported) {
        return { disabled: true, message: '当前浏览器不支持分享' };
      }
    }
    return { disabled: false, message: null };
  }, [selectedReviewIndex, selectedPhotoIndex, imagePreloadStatus, imageValidation, isClipboardSupported]);

  // Allow text-only fallback when image fails validation
  const canShareTextOnly = selectedReviewIndex !== null && 
    selectedPhotoIndex !== null && 
    (imagePreloadStatus === 'error' || !imageValidation.isJpeg || !imageValidation.sizeOk);

  // State for fallback modal (Level 2 and Level 3)
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<'share_failed' | 'recovery' | null>(null);

  // Web Share API - PRIMARY method for iOS Safari
  // CRITICAL: iOS requires files-only in share data (no title/text with files)
  const shareWithWebShareAPI = async (blob: Blob, text: string): Promise<boolean> => {
    try {
      // Step 1: Copy text to clipboard FIRST (XHS will auto-paste when user clicks "Allow Paste")
      await copyTextToClipboard(text);
      console.log('XHS Share - Text copied to clipboard');

      // Step 2: Create File object from blob
      const file = new File([blob], 'xiaohongshu-share.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      // Step 3: Create share data with files ONLY (iOS ignores text when files present)
      const shareData = { files: [file] };

      // Step 4: Check if sharing files is supported
      if (!navigator.canShare?.(shareData)) {
        console.warn('XHS Share - Web Share API does not support this file');
        return false;
      }

      console.log('XHS Share - Launching native share sheet...');
      
      // Step 5: Trigger native share sheet - user picks XiaoHongShu
      await navigator.share(shareData);
      
      console.log('XHS Share - Share completed successfully');
      return true;
      
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('XHS Share - User cancelled share sheet');
        return true; // Not a failure, user just cancelled
      }
      console.error('XHS Share - Web Share API failed:', err);
      return false;
    }
  };

  // Save image to device (fallback action)
  const saveImageToDevice = () => {
    if (!preloadedImageBlob) {
      toast({
        title: "图片未加载",
        description: "请稍候重试",
        variant: "destructive",
      });
      return;
    }

    const a = document.createElement('a');
    a.href = URL.createObjectURL(preloadedImageBlob);
    a.download = 'xiaohongshu-share.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "图片已保存",
      description: "可在小红书中手动选择此图片",
    });
    
    // Revoke URL after a delay
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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

  // Clipboard write using preloaded blob wrapped in Promise for iOS Safari compatibility
  const copyPreloadedImageAndTextToClipboard = (blob: Blob, text: string): void => {
    if (!navigator.clipboard?.write || !('ClipboardItem' in window)) {
      console.warn('ClipboardItem API not supported');
      toast({
        title: "复制失败",
        description: "当前浏览器不支持分享",
        variant: "destructive",
      });
      return;
    }

    const textBlob = new Blob([text], { type: 'text/plain' });

    // CRITICAL FIX: Safari iOS requires Promise-wrapped blobs in ClipboardItem
    // Even though blob is already resolved, Safari internally expects async materialization
    // Raw Blob → ❌ intermittent "复制失败"
    // Promise.resolve(Blob) → ✅ consistent success
    const clipboardItem = new ClipboardItem({
      'image/jpeg': Promise.resolve(blob),
      'text/plain': textBlob,
    });

    console.log('XHS Share - Starting SYNC clipboard write...', {
      imageType: blob.type,
      imageSize: `${(blob.size / 1024).toFixed(1)}KB`,
      textLength: text.length
    });

    // Write is synchronous relative to user gesture since blob is preloaded
    navigator.clipboard.write([clipboardItem])
      .then(() => {
        console.log('XHS Share - Clipboard write SUCCESS');
        
        // 60ms delay after clipboard write - allows Safari to fully commit
        setTimeout(() => {
          const userAgent = navigator.userAgent.toLowerCase();
          const isIOS = /iphone|ipad|ipod/.test(userAgent);
          const isAndroid = /android/.test(userAgent);

          console.log('XHS Share - Opening deep link...', { isIOS, isAndroid });

          if (isIOS) {
            window.location.href = 'xhsdiscover://post_note?ignore_draft=true';
          } else if (isAndroid) {
            window.location.href = 'intent://post_note#Intent;scheme=xhsdiscovery;package=com.xingin.xhs;end';
          } else {
            window.open('https://www.xiaohongshu.com/', '_blank');
          }
        }, 60);
      })
      .catch((err) => {
        console.error('XHS Share - Clipboard write FAILED:', err);
        toast({
          title: "复制失败",
          description: "请重试",
          variant: "destructive",
        });
      });
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

  /**
   * ⚠️ XHS sharing is fragile by platform design.
   * This feature relies on:
   * - iOS Safari Web Share API with files
   * - XHS reading from share sheet
   * - Text pre-copied to clipboard for "Allow Paste"
   *
   * DO NOT refactor without re-testing on real devices.
   * When in doubt, trigger fallback UX.
   */
  const handleShareToXiaohongshu = async () => {
    // Hard gate: never proceed if preflight fails
    if (!canShareToXhs) {
      const state = getShareButtonState();
      if (state.message) {
        toast({
          title: state.message,
          variant: "destructive",
        });
      }
      return;
    }

    const postContent = buildPostContent();
    const { isIOSSafari, isDesktop, isInWebView, canUseWebShare } = platformInfo;
    
    // Level 1 Hard Block: Desktop/WebView - offer fallback immediately
    if (isDesktop || isInWebView) {
      setCopiedText(postContent);
      setFallbackReason('share_failed');
      setShowFallbackModal(true);
      trackClick('xiaohongshu');
      return;
    }
    
    // PRIMARY PATH: Web Share API with files (iOS Safari)
    if (selectedPhotoIndex !== null && preloadedImageBlob && imagePreloadStatus === 'ready' && canUseWebShare && isIOSSafari) {
      console.log('XHS Share - Using Web Share API (PRIMARY)');
      
      const success = await shareWithWebShareAPI(preloadedImageBlob, postContent);
      
      if (success) {
        setCopiedText(postContent);
        setStep('ready');
        trackClick('xiaohongshu');
        
        // Save testimonial
        if (config?.googlePlaceId && selectedReviewIndex !== null) {
          saveTestimonial({
            placeId: config.googlePlaceId,
            platform: 'xiaohongshu',
            rating: 5,
            reviewText: reviews[selectedReviewIndex],
            photoUrl: photos[selectedPhotoIndex],
            language: language,
          }).catch(err => console.warn("Failed to save testimonial:", err));
        }
      } else {
        // Level 2: Web Share failed - show fallback modal
        console.log('XHS Share - Web Share failed, showing fallback');
        setCopiedText(postContent);
        setFallbackReason('share_failed');
        setShowFallbackModal(true);
      }
      return;
    }
    
    // FALLBACK: Clipboard approach (non-iOS or Web Share unavailable)
    if (selectedPhotoIndex !== null && preloadedImageBlob && imagePreloadStatus === 'ready') {
      toast({
        title: "正在打开小红书...",
        description: '请点击"允许粘贴"',
      });
      copyPreloadedImageAndTextToClipboard(preloadedImageBlob, postContent);
    } else if (canShareTextOnly) {
      // Image failed validation - fall back to text-only
      toast({
        title: "图片无法分享",
        description: "仅复制文字内容",
      });
      await copyTextToClipboard(postContent);
      openXiaohongshuApp();
    } else {
      // Text-only share (no photo selected)
      await copyTextToClipboard(postContent);
      toast({
        title: "正在打开小红书...",
        description: '文字已复制，请点击"允许粘贴"',
      });
      openXiaohongshuApp();
    }

    setCopiedText(postContent);
    trackClick('xiaohongshu');
    
    if (config?.googlePlaceId && selectedReviewIndex !== null) {
      const imageWasShared = selectedPhotoIndex !== null && imagePreloadStatus === 'ready' && preloadedImageBlob !== null;
      saveTestimonial({
        placeId: config.googlePlaceId,
        platform: 'xiaohongshu',
        rating: 5,
        reviewText: reviews[selectedReviewIndex],
        photoUrl: imageWasShared ? photos[selectedPhotoIndex] : null,
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
                disabled={!canShareToXhs || isSubmitting || isGenerating}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-70"
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
                ) : imagePreloadStatus === 'loading' && selectedPhotoIndex !== null ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    图片加载中…
                  </div>
                ) : getShareButtonState().message ? (
                  <div className="flex items-center gap-2">
                    {getShareButtonState().message}
                  </div>
                ) : canShareTextOnly ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold">小红书</span>
                    分享文字
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

        {/* Level 2 & 3 Fallback Modal */}
        <Dialog open={showFallbackModal} onOpenChange={setShowFallbackModal}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-lg">
                {fallbackReason === 'recovery' ? '需要手动操作' : '分享失败'}
              </DialogTitle>
              <DialogDescription className="text-center text-sm">
                {fallbackReason === 'recovery' 
                  ? '如果小红书没有自动带上图片，请使用以下方式：'
                  : '当前浏览器暂不支持自动带图分享到小红书，我们已为你准备替代方式'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 mt-4">
              {/* Save Image Button */}
              {preloadedImageBlob && (
                <Button
                  onClick={() => {
                    saveImageToDevice();
                    setShowFallbackModal(false);
                  }}
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white"
                  data-testid="button-save-image"
                >
                  <Download className="w-4 h-4 mr-2" />
                  保存图片到相册
                </Button>
              )}
              
              {/* Copy Text Button */}
              <Button
                variant="outline"
                onClick={async () => {
                  const success = await copyTextToClipboard(copiedText);
                  if (success) {
                    toast({ title: "文字已复制！" });
                  }
                  setShowFallbackModal(false);
                }}
                className="w-full h-12"
                data-testid="button-copy-text-fallback"
              >
                <Copy className="w-4 h-4 mr-2" />
                复制文字内容
              </Button>
              
              {/* Instructions */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">发布步骤：</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>点击「保存图片」将图片存到相册</li>
                  <li>打开小红书，点击发布</li>
                  <li>从相册选择刚才保存的图片</li>
                  <li>点击「允许粘贴」，文字自动填入</li>
                </ol>
              </div>
              
              {/* Cancel Button */}
              <Button
                variant="ghost"
                onClick={() => setShowFallbackModal(false)}
                className="w-full"
                data-testid="button-cancel-fallback"
              >
                取消
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
