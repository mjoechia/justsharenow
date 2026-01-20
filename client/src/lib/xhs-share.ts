declare global {
  interface Window {
    xhs?: {
      share: (config: XHSShareConfig) => void;
    };
  }
}

interface XHSShareInfo {
  type: 'normal' | 'video';
  title?: string;
  content: string;
  images: string[];
  video?: string;
  cover?: string;
}

interface XHSVerifyConfig {
  appKey: string;
  nonce: string;
  timestamp: string;
  signature: string;
}

interface XHSShareConfig {
  shareInfo: XHSShareInfo;
  verifyConfig: XHSVerifyConfig;
  fail?: (error: any) => void;
}

interface XHSSDKCredentials {
  appKey: string;
  nonce: string;
  timestamp: string;
  signature: string;
}

export type XHSShareResult = 'success' | 'cancelled' | 'fallback_required' | 'error';

const XHS_SDK_URL = 'https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js';

// ========== GOLD STANDARD IMPLEMENTATION ==========
// ShareLah-equivalent native sharing for WhatsApp/XHS
// DO NOT MODIFY without re-testing on iOS Safari + Android Chrome

/**
 * Preload and normalize image to File (NON-NEGOTIABLE)
 * Must be done BEFORE user taps Share
 */
export async function preloadImageToFile(imageUrl: string): Promise<File> {
  const res = await fetch(imageUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error('Image fetch failed');

  const blob = await res.blob();

  // HARD GUARDS
  if (blob.type !== 'image/jpeg') {
    throw new Error('Image must be JPEG');
  }
  if (blob.size > 600 * 1024) {
    throw new Error('Image too large');
  }

  return new File(
    [blob],
    'share.jpg',
    { type: 'image/jpeg', lastModified: Date.now() }
  );
}

/**
 * Share Button Gate (Fail Fast)
 * Returns true only if all conditions for native share are met
 */
export function canNativeShare(file: File | null, text: string): boolean {
  return !!(
    file instanceof File &&
    file.type === 'image/jpeg' &&
    file.size <= 600 * 1024 &&
    typeof text === 'string' &&
    text.length > 0 &&
    navigator.share &&
    navigator.clipboard &&
    window.top === window.self &&
    !document.hidden
  );
}

/**
 * Gold Share Handler (DO NOT MODIFY)
 * - Clipboard FIRST (synchronous, fire-and-forget for gesture)
 * - iOS: files only, no text
 * - Android: files + text allowed
 * - Promise rejection handling via .catch (not await)
 */
export function handleGoldNativeShare(
  file: File,
  text: string,
  onSuccess: () => void,
  onFallback: () => void
): void {
  if (!canNativeShare(file, text)) {
    console.warn('[SHARE] canNativeShare failed, triggering fallback');
    onFallback();
    return;
  }

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  // 🔒 DIAGNOSTIC LOG (DO NOT REMOVE)
  console.log('[SHARE]', {
    isIOS,
    isFile: file instanceof File,
    type: file.type,
    size: file.size,
    name: file.name
  });

  try {
    // 1️⃣ Clipboard FIRST (synchronous call, gesture-critical)
    // Attach .catch to silence errors but not block
    console.log('[CLIPBOARD] writeText fired'); // Gold checklist diagnostic
    navigator.clipboard.writeText(text).catch((err) => {
      console.warn('[SHARE] Clipboard write failed:', err);
    });

    // 2️⃣ Native share — iOS MUST be files only
    // The promise is returned synchronously but resolves asynchronously
    const sharePayload = isIOS 
      ? { files: [file] } 
      : { files: [file], text };

    navigator.share(sharePayload)
      .then(() => {
        console.log('[SHARE] Native share completed successfully');
        onSuccess();
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') {
          console.log('[SHARE] User cancelled share sheet');
          // User cancelled - don't trigger fallback, just stay on current screen
          // This is intentional: cancellation is not a failure
        } else {
          console.error('[SHARE] Native share failed:', err);
          onFallback();
        }
      });

  } catch (err) {
    console.error('[SHARE] Native share sync error:', err);
    onFallback();
  }
}

let sdkLoaded = false;
let sdkLoadPromise: Promise<boolean> | null = null;

export function isXHSSDKSupported(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  return isIOS || isAndroid;
}

export function isIOSSafari(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|edgios/.test(ua);
  const isInWebView = /wv|webview/.test(ua) || 
    (isIOS && !isSafari && !/safari/.test(ua) === false);
  return isIOS && isSafari && !isInWebView;
}

export function loadXHSSDK(): Promise<boolean> {
  if (sdkLoaded && window.xhs) {
    return Promise.resolve(true);
  }
  
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }
  
  sdkLoadPromise = new Promise((resolve) => {
    if (window.xhs) {
      sdkLoaded = true;
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = XHS_SDK_URL;
    script.async = true;
    
    script.onload = () => {
      sdkLoaded = true;
      resolve(!!window.xhs);
    };
    
    script.onerror = () => {
      console.warn('XHS SDK load failed');
      resolve(false);
    };
    
    document.head.appendChild(script);
  });
  
  return sdkLoadPromise;
}

export async function getXHSCredentials(imageUrl: string): Promise<XHSSDKCredentials | null> {
  try {
    const response = await fetch('/api/xhs/signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.warn('XHS credentials fetch failed:', error);
      return null;
    }
    
    return response.json();
  } catch (err) {
    console.warn('XHS credentials fetch error:', err);
    return null;
  }
}

export async function shareToXHSWithSDK(
  imageUrl: string,
  text: string,
  title?: string
): Promise<XHSShareResult> {
  if (!isXHSSDKSupported()) {
    console.log('XHS SDK: Platform not supported');
    return 'fallback_required';
  }
  
  const sdkAvailable = await loadXHSSDK();
  if (!sdkAvailable || !window.xhs) {
    console.log('XHS SDK: Failed to load SDK');
    return 'fallback_required';
  }
  
  const credentials = await getXHSCredentials(imageUrl);
  if (!credentials) {
    console.log('XHS SDK: No credentials available, falling back');
    return 'fallback_required';
  }
  
  // Event-driven controller pattern:
  // 1. Emit provisional_success on pagehide (for immediate UI feedback)
  // 2. Emit final_success or needs_fallback on pageshow based on time away
  // 3. resultPromise resolves after confirmation window
  // 4. Caller subscribes to events for UI updates and Tier 2/3 activation
  
  type XHSSDKStatus = 'provisional_success' | 'final_success' | 'needs_fallback';
  type StatusListener = (status: XHSSDKStatus) => void;
  
  const listeners: StatusListener[] = [];
  const emit = (status: XHSSDKStatus) => {
    console.log(`XHS SDK: Emitting ${status}`);
    listeners.forEach(l => l(status));
  };
  
  type State = 'awaiting' | 'provisional' | 'final';
  let state: State = 'awaiting';
  let hiddenAt: number | null = null;
  let foregroundWatchdogId: ReturnType<typeof setTimeout> | null = null;
  let promiseResolve: ((result: XHSShareResult) => void) | null = null;
  
  const QUICK_RETURN_MS = 750;
  const FOREGROUND_WATCHDOG_MS = 2000;
  
  const cleanup = () => {
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('pageshow', handlePageShow);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (foregroundWatchdogId) clearTimeout(foregroundWatchdogId);
  };
  
  const finalize = (result: XHSShareResult) => {
    if (state !== 'final') {
      state = 'final';
      cleanup();
      emit(result === 'success' ? 'final_success' : 'needs_fallback');
      if (promiseResolve) promiseResolve(result);
    }
  };
  
  // pagehide: user navigated to XHS
  const handlePageHide = () => {
    if (state === 'awaiting') {
      hiddenAt = Date.now();
      state = 'provisional';
      emit('provisional_success');
      
      if (foregroundWatchdogId) {
        clearTimeout(foregroundWatchdogId);
        foregroundWatchdogId = null;
      }
      // Don't resolve yet - wait for pageshow to confirm/cancel
    }
  };
  
  // pageshow: user returned - determine final outcome
  const handlePageShow = () => {
    if (state === 'provisional' && hiddenAt !== null) {
      const timeAway = Date.now() - hiddenAt;
      console.log(`XHS SDK: User returned after ${timeAway}ms`);
      
      if (timeAway >= QUICK_RETURN_MS) {
        finalize('success');
      } else {
        finalize('fallback_required');
      }
    }
  };
  
  // visibilitychange as fallback
  const handleVisibilityChange = () => {
    if (state === 'final') return;
    
    if (document.hidden && state === 'awaiting') {
      hiddenAt = Date.now();
      state = 'provisional';
      emit('provisional_success');
      
      if (foregroundWatchdogId) {
        clearTimeout(foregroundWatchdogId);
        foregroundWatchdogId = null;
      }
      
    } else if (!document.hidden && state === 'provisional' && hiddenAt !== null) {
      const timeAway = Date.now() - hiddenAt;
      console.log(`XHS SDK: Visibility returned after ${timeAway}ms`);
      
      if (timeAway >= QUICK_RETURN_MS) {
        finalize('success');
      } else {
        finalize('fallback_required');
      }
    }
  };
  
  // Set up listeners
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('pageshow', handlePageShow);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Foreground watchdog: if no navigation in 2s, SDK failed silently
  foregroundWatchdogId = setTimeout(() => {
    if (state === 'awaiting') {
      finalize('fallback_required');
    }
  }, FOREGROUND_WATCHDOG_MS);
  
  // Call SDK
  try {
    window.xhs!.share({
      shareInfo: {
        type: 'normal',
        title: title || '',
        content: text,
        images: [imageUrl],
      },
      verifyConfig: {
        appKey: credentials.appKey,
        nonce: credentials.nonce,
        timestamp: credentials.timestamp,
        signature: credentials.signature,
      },
      fail: (error) => {
        console.warn('XHS SDK share failed:', error);
        finalize('fallback_required');
      },
    });
    
  } catch (err) {
    console.warn('XHS SDK share error:', err);
    finalize('fallback_required');
  }
  
  // Return promise that resolves after confirmation window
  // Note: if user never returns, promise stays pending but provisional_success was emitted
  const resultPromise = new Promise<XHSShareResult>((resolve) => {
    promiseResolve = resolve;
  });
  
  // For backward compatibility, return the promise
  // Callers that need status events can access them via a separate mechanism
  // For now, we return the promise and accept that "user never returns" = pending
  return resultPromise;
}

export async function shareViaWebShareAPI(
  imageBlob: Blob,
  text: string,
  filename: string = 'share-image.jpg'
): Promise<XHSShareResult> {
  if (!navigator.share || !navigator.canShare) {
    return 'fallback_required';
  }
  
  try {
    await navigator.clipboard.writeText(text);
    console.log('XHS WebShare: Text copied to clipboard');
  } catch (err) {
    console.warn('XHS WebShare: Clipboard copy failed:', err);
  }
  
  const file = new File([imageBlob], filename, { type: 'image/jpeg' });
  
  const shareData = { files: [file] };
  
  if (!navigator.canShare(shareData)) {
    console.log('XHS WebShare: canShare returned false');
    return 'fallback_required';
  }
  
  try {
    await navigator.share(shareData);
    return 'success';
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('XHS WebShare: User cancelled');
      return 'cancelled';
    }
    console.warn('XHS WebShare: Share failed:', err);
    return 'fallback_required';
  }
}

export function openXHSDeepLink(): void {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  
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
}

export interface ShareToXHSOptions {
  imageUrl: string;
  imageBlob?: File | Blob | null; // GOLD STANDARD: File preferred, Blob for backwards compatibility
  text: string;
  title?: string;
  onSuccess?: () => void;
  onFallback?: () => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
}

export async function shareToXHS(options: ShareToXHSOptions): Promise<XHSShareResult> {
  const { imageUrl, imageBlob, text, title, onSuccess, onFallback, onCancel, onError } = options;
  
  console.log('XHS Share: Starting share flow...');
  
  const sdkResult = await shareToXHSWithSDK(imageUrl, text, title);
  
  if (sdkResult === 'success') {
    console.log('XHS Share: SDK share successful');
    onSuccess?.();
    return 'success';
  }
  
  if (sdkResult !== 'fallback_required') {
    console.log('XHS Share: SDK returned non-fallback result:', sdkResult);
  }
  
  if (isIOSSafari() && imageBlob) {
    console.log('XHS Share: Trying Web Share API fallback...');
    const webShareResult = await shareViaWebShareAPI(imageBlob, text);
    
    if (webShareResult === 'success') {
      console.log('XHS Share: Web Share API successful');
      onSuccess?.();
      return 'success';
    }
    
    if (webShareResult === 'cancelled') {
      console.log('XHS Share: User cancelled Web Share');
      onCancel?.();
      return 'cancelled';
    }
  }
  
  console.log('XHS Share: Triggering fallback UX');
  onFallback?.();
  return 'fallback_required';
}
