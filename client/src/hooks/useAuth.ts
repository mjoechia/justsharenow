import { useQuery } from "@tanstack/react-query";

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
  const { data: user, isLoading, error, refetch } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user,
    isLoading,
    error,
    refetch,
    isAuthenticated: !!user,
    isMasterAdmin: user?.role === 'master_admin',
    isAdmin: user?.role === 'master_admin' || user?.role === 'admin',
    isApproved: user?.approvalStatus === 'approved',
    isPending: user?.approvalStatus === 'pending',
  };
}
