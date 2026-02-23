import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";

interface AuthUser {
  id: number;
  username?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'master_admin' | 'admin' | 'user';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const wasAuthenticated = useRef(false);

  const { data: user, isLoading, error, refetch } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && wasAuthenticated.current) {
      wasAuthenticated.current = false;
      toast({
        title: "Session Expired",
        description: "You have been logged out. Please log in again.",
        variant: "destructive",
      });
      queryClient.clear();
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, toast, setLocation, queryClient]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    wasAuthenticated.current = false;
    queryClient.clear();
    setLocation('/login');
  }, [queryClient, setLocation]);

  return {
    user,
    isLoading,
    error,
    refetch,
    logout,
    isAuthenticated,
    isMasterAdmin: user?.role === 'master_admin',
    isAdmin: user?.role === 'master_admin' || user?.role === 'admin',
    isApproved: user?.approvalStatus === 'approved',
    isPending: user?.approvalStatus === 'pending',
  };
}
