// API client for ShareLor backend

export interface StoreConfig {
  id?: number;
  websiteUrl?: string | null;
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
  updatedAt?: string;
}

export interface Analytics {
  id: number;
  platform: string;
  clicks: number;
  lastUpdated: string;
}

// Fetch store configuration
export async function getStoreConfig(): Promise<StoreConfig> {
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error('Failed to fetch config');
  return response.json();
}

// Update store configuration
export async function updateStoreConfig(config: Partial<StoreConfig>): Promise<StoreConfig> {
  const response = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Failed to update config');
  return response.json();
}

// Fetch analytics data
export async function getAnalytics(): Promise<Analytics[]> {
  const response = await fetch('/api/analytics');
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

// Track platform click
export async function trackPlatformClick(platform: string): Promise<void> {
  const response = await fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform }),
  });
  if (!response.ok) throw new Error('Failed to track click');
}

// Discover social links from website
export interface DiscoveredLinks {
  googleReviews: string | null;
  googlePlaceId: string | null;
  facebook: string | null;
  instagram: string | null;
  xiaohongshu: string | null;
  tiktok: string | null;
  whatsapp: string | null;
}

export interface SuggestedPhoto {
  url: string;
  reason: string;
}

export interface DiscoverResponse {
  success: boolean;
  websiteUrl: string;
  discoveredLinks: DiscoveredLinks;
  suggestedPhotos: SuggestedPhoto[];
  suggestedSliderPhotos: SuggestedPhoto[];
  suggestedHashtags: string[];
}

export async function discoverSocialLinks(websiteUrl: string): Promise<DiscoverResponse> {
  const response = await fetch('/api/discover-social-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ websiteUrl }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to discover social links');
  }
  return response.json();
}

// Approve and add photo to shop photos
export interface ApprovePhotoResponse {
  success: boolean;
  shopPhotos: string[];
  photoCount: number;
}

export async function approvePhoto(imageUrl: string): Promise<ApprovePhotoResponse> {
  const response = await fetch('/api/photos/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve photo');
  }
  return response.json();
}

// Approve and add photo to slider photos
export interface ApproveSliderPhotoResponse {
  success: boolean;
  sliderPhotos: string[];
  photoCount: number;
}

export async function approveSliderPhoto(imageUrl: string): Promise<ApproveSliderPhotoResponse> {
  const response = await fetch('/api/slider-photos/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve slider photo');
  }
  return response.json();
}

// Save selected hashtags
export interface SaveHashtagsResponse {
  success: boolean;
  reviewHashtags: string[];
}

export async function saveHashtags(hashtags: string[]): Promise<SaveHashtagsResponse> {
  const response = await fetch('/api/hashtags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hashtags }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save hashtags');
  }
  return response.json();
}

// Google Reviews
export interface GoogleReview {
  id: number;
  authorName: string;
  authorPhotoUrl?: string | null;
  rating: number;
  text?: string | null;
  relativeTime?: string | null;
  publishTime?: string | null;
  createdAt: string;
}

export interface FetchGoogleReviewsResponse {
  success: boolean;
  reviews: GoogleReview[];
  businessName?: string | null;
  rating?: number | null;
  totalReviews?: number;
  message?: string;
  needsApiKey?: boolean;
}

export async function getGoogleReviews(): Promise<GoogleReview[]> {
  const response = await fetch('/api/google-reviews');
  if (!response.ok) throw new Error('Failed to fetch Google reviews');
  return response.json();
}

export async function fetchGoogleReviews(placeId: string): Promise<FetchGoogleReviewsResponse> {
  const response = await fetch('/api/google-reviews/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placeId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch Google reviews');
  }
  return response.json();
}
