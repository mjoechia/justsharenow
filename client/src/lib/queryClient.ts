import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Handle session expiration globally - redirect to login
function handleSessionExpired() {
  // Clear any cached auth state
  window.location.href = '/login?expired=1';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle session expiration (401) by redirecting to login
    if (res.status === 401) {
      // Don't redirect if already on login page or public pages
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && !currentPath.match(/^\/[^/]+$/) && currentPath !== '/') {
        handleSessionExpired();
      }
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30 seconds - allows proper cache invalidation
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
