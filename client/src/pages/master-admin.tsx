import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Check, X, Loader2, Users, UserPlus, LogOut, RefreshCw, Link2, Edit2, ExternalLink, Settings, Clock, Building2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import justShareNowLogo from "@assets/JustSharenow_logo_1766216638301.png";

interface User {
  id: number;
  username?: string;
  email?: string;
  displayName?: string;
  slug?: string;
  role: 'master_admin' | 'admin' | 'user';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  createdAt: string;
  businessName?: string | null;
}

interface AdminWithUsers {
  id: number;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  approvalStatus: string;
  isActive: boolean;
  assignedUsers: { id: number; email?: string; displayName?: string; isActive: boolean }[];
}

export default function MasterAdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isMasterAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create Admin form state
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminDisplayName, setNewAdminDisplayName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  
  // Create User form state
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  
  // Dialog state
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  
  // Reset password state
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  
  // Edit slug state
  const [editSlugUserId, setEditSlugUserId] = useState<number | null>(null);
  const [editSlugValue, setEditSlugValue] = useState("");
  
  // Session timeout state
  const [sessionTimeoutInput, setSessionTimeoutInput] = useState("");
  
  // Password visibility state
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isMasterAdmin,
  });

  const { data: adminsWithUsers = [] } = useQuery<AdminWithUsers[]>({
    queryKey: ["/api/admin/admins-with-users"],
    enabled: isMasterAdmin,
  });

  // Only active admins for assignment dropdown
  interface ActiveAdmin {
    id: number;
    username?: string;
    email?: string;
    displayName?: string;
  }
  
  const { data: activeAdmins = [] } = useQuery<ActiveAdmin[]>({
    queryKey: ["/api/admin/active-admins"],
    enabled: isMasterAdmin,
  });

  // Session timeout query
  const { data: sessionTimeoutData } = useQuery<{ sessionTimeoutMinutes: number }>({
    queryKey: ["/api/admin/session-timeout"],
    enabled: isMasterAdmin,
  });

  const sessionTimeoutMutation = useMutation({
    mutationFn: async (minutes: number) => {
      const res = await fetch('/api/admin/session-timeout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionTimeoutMinutes: minutes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update session timeout');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session-timeout"] });
      toast({ title: "Session timeout updated", description: data.message });
      setSessionTimeoutInput("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId }: { userId: number }) => {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to approve user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User approved" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId }: { userId: number }) => {
      const res = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to reject user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User rejected" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ username, password, displayName, email, role }: { 
      username: string; 
      password: string; 
      displayName: string;
      email?: string;
      role: 'admin' | 'user';
    }) => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName, email, role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/active-admins"] });
      toast({ title: "User created successfully" });
      // Reset admin form
      setNewAdminUsername("");
      setNewAdminPassword("");
      setNewAdminDisplayName("");
      setNewAdminEmail("");
      setShowAdminPassword(false);
      // Reset user form
      setNewUserUsername("");
      setNewUserPassword("");
      setNewUserDisplayName("");
      setNewUserEmail("");
      setSelectedAdmin("");
      setShowUserPassword(false);
      setIsCreateAdminOpen(false);
      setIsCreateUserOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reset password');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password reset successfully" });
      setResetPasswordUserId(null);
      setResetPasswordValue("");
      setShowResetPassword(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ userId, adminId }: { userId: number; adminId: number }) => {
      const res = await fetch('/api/admin/assign-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, adminId }),
      });
      if (!res.ok) throw new Error('Failed to assign user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins-with-users"] });
      toast({ title: "User assigned to admin" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId }: { userId: number }) => {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update user status');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins-with-users"] });
      toast({ title: "User status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSlugMutation = useMutation({
    mutationFn: async ({ userId, slug }: { userId: number; slug: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/slug`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update slug');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "URL slug updated successfully" });
      setEditSlugUserId(null);
      setEditSlugValue("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user || !isMasterAdmin) {
    setLocation('/login');
    return null;
  }

  const pendingUsers = allUsers.filter(u => u.approvalStatus === 'pending');
  const admins = allUsers.filter(u => u.role === 'admin' && u.approvalStatus === 'approved');
  const users = allUsers.filter(u => u.role === 'user');

  const getAssignedAdmin = (userId: number) => {
    for (const admin of adminsWithUsers) {
      if (admin.assignedUsers.some(u => u.id === userId)) {
        return admin;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={justShareNowLogo} alt="JustShareNow" className="w-12 h-auto object-contain" />
            <div>
              <h1 className="font-bold text-gray-900">Master Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Logged in as {user.displayName || user.username}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {pendingUsers.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="w-5 h-5" />
                Pending Approvals ({pendingUsers.length})
              </CardTitle>
              <CardDescription className="text-orange-700">
                These users are waiting for your approval to access the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingUsers.map(pendingUser => (
                  <div 
                    key={pendingUser.id} 
                    className="flex items-center justify-between bg-white p-4 rounded-lg border"
                    data-testid={`pending-user-${pendingUser.id}`}
                  >
                    <div>
                      <p className="font-medium">{pendingUser.displayName || pendingUser.email || pendingUser.username}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline">{pendingUser.role}</Badge>
                        <span>{pendingUser.email}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => approveMutation.mutate({ userId: pendingUser.id })}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-${pendingUser.id}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => rejectMutation.mutate({ userId: pendingUser.id })}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-${pendingUser.id}`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="admins" className="space-y-6">
          <TabsList>
            <TabsTrigger value="admins" data-testid="tab-admins">
              <UserPlus className="w-4 h-4 mr-2" />
              Admins ({admins.length})
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admins">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Admin Accounts</CardTitle>
                  <CardDescription>Manage admin accounts who can oversee users and send QR codes.</CardDescription>
                </div>
                <Dialog open={isCreateAdminOpen} onOpenChange={setIsCreateAdminOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-admin">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Admin</DialogTitle>
                      <DialogDescription>
                        Create a new admin account with username and password.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-username">Username *</Label>
                        <Input
                          id="admin-username"
                          type="text"
                          value={newAdminUsername}
                          onChange={(e) => setNewAdminUsername(e.target.value)}
                          placeholder="admin_username"
                          data-testid="input-admin-username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="admin-password"
                            type={showAdminPassword ? "text" : "password"}
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                            className="pr-10"
                            data-testid="input-admin-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            data-testid="toggle-admin-password"
                          >
                            {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-displayname">Display Name *</Label>
                        <Input
                          id="admin-displayname"
                          type="text"
                          value={newAdminDisplayName}
                          onChange={(e) => setNewAdminDisplayName(e.target.value)}
                          placeholder="John Doe"
                          data-testid="input-admin-displayname"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email (optional)</Label>
                        <Input
                          id="admin-email"
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="admin@example.com"
                          data-testid="input-admin-email"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={() => createUserMutation.mutate({ 
                          username: newAdminUsername,
                          password: newAdminPassword,
                          displayName: newAdminDisplayName,
                          email: newAdminEmail || undefined,
                          role: 'admin' 
                        })}
                        disabled={!newAdminUsername || !newAdminPassword || newAdminPassword.length < 8 || !newAdminDisplayName || createUserMutation.isPending}
                        data-testid="button-confirm-create-admin"
                      >
                        {createUserMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Create Admin
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  </div>
                ) : admins.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No admin accounts yet. Create one to get started.</p>
                ) : (
                  <div className="space-y-3">
                    {admins.map(admin => (
                      <div 
                        key={admin.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`admin-row-${admin.id}`}
                      >
                        <div>
                          <p className="font-medium">{admin.displayName || admin.username || admin.email}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">@{admin.username}</span>
                            {admin.email && <span>{admin.email}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={admin.isActive ? "default" : "secondary"}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetPasswordUserId(admin.id);
                              setResetPasswordValue("");
                            }}
                            data-testid={`button-reset-password-admin-${admin.id}`}
                          >
                            Reset Password
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActiveMutation.mutate({ userId: admin.id })}
                            data-testid={`button-toggle-admin-${admin.id}`}
                          >
                            {admin.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Accounts</CardTitle>
                  <CardDescription>Manage user accounts and assign them to admins.</CardDescription>
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
                        Create a new user account with username and password.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-username">Username *</Label>
                        <Input
                          id="user-username"
                          type="text"
                          value={newUserUsername}
                          onChange={(e) => setNewUserUsername(e.target.value)}
                          placeholder="user_username"
                          data-testid="input-user-username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="user-password"
                            type={showUserPassword ? "text" : "password"}
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                            className="pr-10"
                            data-testid="input-user-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowUserPassword(!showUserPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            data-testid="toggle-user-password"
                          >
                            {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-displayname">Display Name *</Label>
                        <Input
                          id="user-displayname"
                          type="text"
                          value={newUserDisplayName}
                          onChange={(e) => setNewUserDisplayName(e.target.value)}
                          placeholder="John Doe"
                          data-testid="input-user-displayname"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-email">Email (optional)</Label>
                        <Input
                          id="user-email"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="user@example.com"
                          data-testid="input-user-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assign-admin">Assign to Admin (optional, active admins only)</Label>
                        <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                          <SelectTrigger data-testid="select-assign-admin">
                            <SelectValue placeholder="Select an active admin" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeAdmins.map(admin => (
                              <SelectItem key={admin.id} value={admin.id.toString()}>
                                {admin.displayName || admin.username || admin.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={async () => {
                          const result = await createUserMutation.mutateAsync({ 
                            username: newUserUsername,
                            password: newUserPassword,
                            displayName: newUserDisplayName,
                            email: newUserEmail || undefined,
                            role: 'user' 
                          });
                          if (selectedAdmin && result.user) {
                            assignMutation.mutate({ userId: result.user.id, adminId: parseInt(selectedAdmin) });
                          }
                        }}
                        disabled={!newUserUsername || !newUserPassword || newUserPassword.length < 8 || !newUserDisplayName || createUserMutation.isPending}
                        data-testid="button-confirm-create-user"
                      >
                        {createUserMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Create User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No user accounts yet. Create one to get started.</p>
                ) : (
                  <div className="space-y-3">
                    {users.map(userItem => {
                      const assignedAdmin = getAssignedAdmin(userItem.id);
                      return (
                        <div 
                          key={userItem.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                          data-testid={`user-row-${userItem.id}`}
                        >
                          <div>
                            <p className="font-medium">{userItem.displayName || userItem.email}</p>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">@{userItem.username}</span>
                              {userItem.businessName && (
                                <span className="flex items-center gap-1 font-medium text-gray-700">
                                  <Building2 className="w-3 h-3" />
                                  {userItem.businessName}
                                </span>
                              )}
                              {userItem.email && <span>{userItem.email}</span>}
                              {userItem.slug && (
                                <span className="flex items-center gap-1 text-purple-600">
                                  <ExternalLink className="w-3 h-3" />
                                  /{userItem.slug}
                                </span>
                              )}
                              {assignedAdmin && (
                                <span className="flex items-center gap-1">
                                  <Link2 className="w-3 h-3" />
                                  {assignedAdmin.displayName || assignedAdmin.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={userItem.approvalStatus === 'approved' ? "default" : userItem.approvalStatus === 'pending' ? "secondary" : "destructive"}>
                              {userItem.approvalStatus}
                            </Badge>
                            <Select 
                              value={assignedAdmin?.id.toString() || ""} 
                              onValueChange={(value) => assignMutation.mutate({ userId: userItem.id, adminId: parseInt(value) })}
                            >
                              <SelectTrigger className="w-40" data-testid={`select-admin-for-${userItem.id}`}>
                                <SelectValue placeholder="Assign admin" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeAdmins.map(admin => (
                                  <SelectItem key={admin.id} value={admin.id.toString()}>
                                    {admin.displayName || admin.username || admin.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditSlugUserId(userItem.id);
                                setEditSlugValue(userItem.slug || "");
                              }}
                              data-testid={`button-edit-slug-${userItem.id}`}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit URL
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setResetPasswordUserId(userItem.id);
                                setResetPasswordValue("");
                              }}
                              data-testid={`button-reset-password-user-${userItem.id}`}
                            >
                              Reset Password
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActiveMutation.mutate({ userId: userItem.id })}
                              data-testid={`button-toggle-user-${userItem.id}`}
                            >
                              {userItem.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure global system settings for the platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Session Timeout */}
                <div className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Session Timeout</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure how long users can remain logged in before their session expires due to inactivity. 
                    Current timeout: <strong>{sessionTimeoutData?.sessionTimeoutMinutes || 3} minutes</strong>
                  </p>
                  <div className="flex gap-2 items-end">
                    <div className="space-y-2 flex-1 max-w-xs">
                      <Label htmlFor="session-timeout">New Timeout (minutes)</Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        min={1}
                        max={10080}
                        placeholder={String(sessionTimeoutData?.sessionTimeoutMinutes || 3)}
                        value={sessionTimeoutInput}
                        onChange={(e) => setSessionTimeoutInput(e.target.value)}
                        data-testid="input-session-timeout"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const minutes = parseInt(sessionTimeoutInput, 10);
                        if (!isNaN(minutes) && minutes >= 1 && minutes <= 10080) {
                          sessionTimeoutMutation.mutate(minutes);
                        }
                      }}
                      disabled={
                        !sessionTimeoutInput || 
                        isNaN(parseInt(sessionTimeoutInput, 10)) || 
                        parseInt(sessionTimeoutInput, 10) < 1 || 
                        parseInt(sessionTimeoutInput, 10) > 10080 ||
                        sessionTimeoutMutation.isPending
                      }
                      data-testid="button-save-session-timeout"
                    >
                      {sessionTimeoutMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Update Timeout
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Valid range: 1 minute to 10080 minutes (1 week). Changes apply to new sessions only.
                  </p>
                </div>

                {/* Login QR Code */}
                <div className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Login QR Code</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate and download a QR code with the JustShareNow logo that links to the login page.
                  </p>
                  <Button
                    onClick={() => window.open('/login-qr', '_blank')}
                    data-testid="button-open-login-qr"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Login QR Code Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordUserId !== null} onOpenChange={(open) => {
          if (!open) {
            setResetPasswordUserId(null);
            setResetPasswordValue("");
            setShowResetPassword(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter a new password for this account. Minimum 8 characters.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showResetPassword ? "text" : "password"}
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="pr-10"
                    data-testid="input-reset-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    data-testid="toggle-reset-password"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordUserId(null);
                  setResetPasswordValue("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (resetPasswordUserId) {
                    resetPasswordMutation.mutate({ 
                      userId: resetPasswordUserId, 
                      newPassword: resetPasswordValue 
                    });
                  }
                }}
                disabled={!resetPasswordValue || resetPasswordValue.length < 8 || resetPasswordMutation.isPending}
                data-testid="button-confirm-reset-password"
              >
                {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Slug Dialog */}
        <Dialog open={editSlugUserId !== null} onOpenChange={(open) => {
          if (!open) {
            setEditSlugUserId(null);
            setEditSlugValue("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit URL Slug</DialogTitle>
              <DialogDescription>
                This is the custom URL path for this user's shop (e.g., yourdomain.com/<strong>{editSlugValue || 'username'}</strong>).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">/</span>
                  <Input
                    id="new-slug"
                    type="text"
                    value={editSlugValue}
                    onChange={(e) => setEditSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="username"
                    data-testid="input-edit-slug"
                  />
                </div>
                <p className="text-xs text-gray-500">Only lowercase letters and numbers allowed.</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditSlugUserId(null);
                  setEditSlugValue("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (editSlugUserId && editSlugValue) {
                    updateSlugMutation.mutate({ 
                      userId: editSlugUserId, 
                      slug: editSlugValue 
                    });
                  }
                }}
                disabled={!editSlugValue || editSlugValue.length < 2 || updateSlugMutation.isPending}
                data-testid="button-confirm-edit-slug"
              >
                {updateSlugMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save URL
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
