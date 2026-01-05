import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, LogOut, Mail, QrCode, AlertCircle, Clock, ExternalLink, UserPlus, Key, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import justShareNowLogo from "@assets/JustSharenow_logo_1766216638301.png";
import { useState, useEffect } from "react";

interface AssignedUser {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  slug?: string;
  isActive: boolean;
}

interface RecentUser {
  id: number;
  email?: string;
  displayName?: string;
  slug?: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAdmin, isApproved, isPending } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCreateUserPassword, setShowCreateUserPassword] = useState(false);

  const { data: myUsers = [], isLoading: usersLoading } = useQuery<AssignedUser[]>({
    queryKey: ["/api/my-users"],
    enabled: isAdmin && isApproved,
  });

  const { data: recentUsers = [] } = useQuery<RecentUser[]>({
    queryKey: ["/api/my-recent-users"],
    enabled: isAdmin && isApproved,
  });

  const trackViewMutation = useMutation({
    mutationFn: async (userId: number) => {
      await fetch(`/api/track-view/${userId}`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-recent-users"] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; displayName: string; email?: string }) => {
      const res = await fetch('/api/admin/create-my-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-users"] });
      toast({ title: "User created successfully", description: `${data.user.displayName} has been created and assigned to you.` });
      setIsCreateUserOpen(false);
      setNewUserUsername("");
      setNewUserPassword("");
      setNewUserDisplayName("");
      setNewUserEmail("");
      setShowCreateUserPassword(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to change password');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setIsChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    } else if (!authLoading && user && !isAdmin) {
      setLocation('/');
    }
  }, [authLoading, user, isAdmin, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle>Pending Approval</CardTitle>
            <CardDescription>
              Your account is awaiting approval from the master admin. You'll be able to access the admin dashboard once approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEmailQR = async (userId: number, userEmail?: string) => {
    toast({ 
      title: "Email QR Code",
      description: `QR code email would be sent to ${userEmail || 'user'}. (Email integration coming soon)`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={justShareNowLogo} alt="JustShareNow" className="w-10 h-10 sm:w-12 sm:h-auto object-contain flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-sm sm:text-base">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Logged in as {user.displayName || user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Dialog open={isChangePasswordOpen} onOpenChange={(open) => {
              setIsChangePasswordOpen(open);
              if (!open) {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-change-password">
                  <Key className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Change Password</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pr-10"
                        data-testid="input-current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        data-testid="toggle-current-password"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="pr-10"
                        data-testid="input-new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        data-testid="toggle-new-password"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                        data-testid="input-confirm-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        data-testid="toggle-confirm-password"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-red-500">Passwords do not match</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => changePasswordMutation.mutate({ currentPassword, newPassword })}
                    disabled={
                      !currentPassword || 
                      !newPassword || 
                      newPassword.length < 8 || 
                      newPassword !== confirmPassword ||
                      changePasswordMutation.isPending
                    }
                    data-testid="button-confirm-change-password"
                  >
                    {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Change Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={logout} data-testid="button-logout">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Recent Users Quick Switch */}
        {recentUsers.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Clock className="w-5 h-5" />
                Recent Businesses
              </CardTitle>
              <CardDescription>Quick access to your recently viewed businesses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {recentUsers.map((recentUser) => (
                  <Button
                    key={recentUser.id}
                    variant="outline"
                    className="flex items-center gap-2 bg-white hover:bg-purple-50 border-purple-200"
                    onClick={() => {
                      trackViewMutation.mutate(recentUser.id);
                      setLocation(`/admin?userId=${recentUser.id}`);
                    }}
                    data-testid={`button-recent-${recentUser.id}`}
                  >
                    <span>{recentUser.displayName || recentUser.email}</span>
                    {recentUser.slug && (
                      <span className="text-xs text-purple-500">/{recentUser.slug}</span>
                    )}
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                My Assigned Users ({myUsers.length})
              </CardTitle>
              <CardDescription>
                Manage QR codes for your assigned users. You can create new users or email QR codes.
              </CardDescription>
            </div>
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-user">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account. The user will be automatically assigned to you.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-user-username">Username *</Label>
                    <Input
                      id="new-user-username"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      data-testid="input-new-user-username"
                    />
                    {newUserUsername && newUserUsername.length < 3 && (
                      <p className="text-xs text-red-500">Username must be at least 3 characters</p>
                    )}
                    {newUserUsername && newUserUsername.length > 20 && (
                      <p className="text-xs text-red-500">Username must be 20 characters or less</p>
                    )}
                    {!newUserUsername && (
                      <p className="text-xs text-gray-500">3-20 characters, letters, numbers, and underscores only</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="new-user-password"
                        type={showCreateUserPassword ? "text" : "password"}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Enter password"
                        className="pr-10"
                        data-testid="input-new-user-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreateUserPassword(!showCreateUserPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        data-testid="toggle-create-user-password"
                      >
                        {showCreateUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newUserPassword && newUserPassword.length < 8 && (
                      <p className="text-xs text-red-500">Password must be at least 8 characters (currently {newUserPassword.length})</p>
                    )}
                    {!newUserPassword && (
                      <p className="text-xs text-gray-500">Minimum 8 characters required</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-displayname">Display Name *</Label>
                    <Input
                      id="new-user-displayname"
                      value={newUserDisplayName}
                      onChange={(e) => setNewUserDisplayName(e.target.value)}
                      placeholder="Business Name"
                      data-testid="input-new-user-displayname"
                    />
                    {!newUserDisplayName && (
                      <p className="text-xs text-gray-500">This will be shown as the business name</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-email">Email (optional)</Label>
                    <Input
                      id="new-user-email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      data-testid="input-new-user-email"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createUserMutation.mutate({
                      username: newUserUsername,
                      password: newUserPassword,
                      displayName: newUserDisplayName,
                      email: newUserEmail || undefined,
                    })}
                    disabled={
                      !newUserUsername || 
                      newUserUsername.length < 3 || 
                      newUserUsername.length > 20 ||
                      !newUserPassword || 
                      newUserPassword.length < 8 || 
                      !newUserDisplayName || 
                      createUserMutation.isPending
                    }
                    data-testid="button-submit-create-user"
                  >
                    {createUserMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Create User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : myUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No users assigned to you yet.</p>
                <p className="text-sm text-gray-400">Contact the master admin to get users assigned.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myUsers.map(assignedUser => (
                  <div 
                    key={assignedUser.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`user-row-${assignedUser.id}`}
                  >
                    <div>
                      <p className="font-medium">{assignedUser.displayName || assignedUser.email}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">@{assignedUser.username}</span>
                        {assignedUser.email && <span>{assignedUser.email}</span>}
                        {assignedUser.slug && (
                          <span className="text-purple-600">/{assignedUser.slug}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={assignedUser.isActive ? "default" : "secondary"}>
                        {assignedUser.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          trackViewMutation.mutate(assignedUser.id);
                          setLocation(`/admin?userId=${assignedUser.id}`);
                        }}
                        data-testid={`button-view-config-${assignedUser.id}`}
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        View Config
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEmailQR(assignedUser.id, assignedUser.email)}
                        data-testid={`button-email-qr-${assignedUser.id}`}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Email QR
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
