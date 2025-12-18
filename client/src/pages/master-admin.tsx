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
import { AlertCircle, Check, X, Loader2, Shield, Users, UserPlus, LogOut, RefreshCw, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username?: string;
  email?: string;
  displayName?: string;
  role: 'master_admin' | 'admin' | 'user';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  createdAt: string;
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
  
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isMasterAdmin,
  });

  const { data: adminsWithUsers = [] } = useQuery<AdminWithUsers[]>({
    queryKey: ["/api/admin/admins-with-users"],
    enabled: isMasterAdmin,
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
    mutationFn: async ({ email, role }: { email: string; role: 'admin' | 'user' }) => {
      const displayName = email.split('@')[0];
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, role }),
      });
      if (!res.ok) throw new Error('Failed to create user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created successfully" });
      setNewAdminEmail("");
      setNewUserEmail("");
      setIsCreateAdminOpen(false);
      setIsCreateUserOpen(false);
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
      if (!res.ok) throw new Error('Failed to update user status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated" });
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
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
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
              <Shield className="w-4 h-4 mr-2" />
              Admins ({admins.length})
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users ({users.length})
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
                        Enter the email address for the new admin. They'll sign in with Google.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email Address</Label>
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
                        onClick={() => createUserMutation.mutate({ email: newAdminEmail, role: 'admin' })}
                        disabled={!newAdminEmail || createUserMutation.isPending}
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
                          <p className="font-medium">{admin.displayName || admin.email}</p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={admin.isActive ? "default" : "secondary"}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </Badge>
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
                        Create a new user account and assign them to an admin.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-email">Email Address</Label>
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
                        <Label htmlFor="assign-admin">Assign to Admin (optional)</Label>
                        <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                          <SelectTrigger data-testid="select-assign-admin">
                            <SelectValue placeholder="Select an admin" />
                          </SelectTrigger>
                          <SelectContent>
                            {admins.map(admin => (
                              <SelectItem key={admin.id} value={admin.id.toString()}>
                                {admin.displayName || admin.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={async () => {
                          await createUserMutation.mutateAsync({ email: newUserEmail, role: 'user' });
                          if (selectedAdmin) {
                            const newUser = allUsers.find(u => u.email === newUserEmail);
                            if (newUser) {
                              assignMutation.mutate({ userId: newUser.id, adminId: parseInt(selectedAdmin) });
                            }
                          }
                        }}
                        disabled={!newUserEmail || createUserMutation.isPending}
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
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{userItem.email}</span>
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
                                {admins.map(admin => (
                                  <SelectItem key={admin.id} value={admin.id.toString()}>
                                    {admin.displayName || admin.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
        </Tabs>
      </main>
    </div>
  );
}
