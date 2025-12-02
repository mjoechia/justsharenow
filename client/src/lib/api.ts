// API client for ShareLor backend

export interface StoreConfig {
  id?: number;
  websiteUrl?: string | null;
  googleUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  xiaohongshuUrl?: string | null;
  shopPhotos?: string[];
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
  google: string | null;
  facebook: string | null;
  instagram: string | null;
  xiaohongshu: string | null;
}

export interface DiscoverResponse {
  success: boolean;
  websiteUrl: string;
  discoveredLinks: DiscoveredLinks;
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
