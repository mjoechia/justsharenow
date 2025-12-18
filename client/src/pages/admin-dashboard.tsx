import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, LogOut, Mail, QrCode, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssignedUser {
  id: number;
  email?: string;
  displayName?: string;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAdmin, isApproved, isPending } = useAuth();
  const { toast } = useToast();

  const { data: myUsers = [], isLoading: usersLoading } = useQuery<AssignedUser[]>({
    queryKey: ["/api/my-users"],
    enabled: isAdmin && isApproved,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    setLocation('/login');
    return null;
  }

  if (!isAdmin) {
    setLocation('/');
    return null;
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Logged in as {user.displayName || user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              My Assigned Users ({myUsers.length})
            </CardTitle>
            <CardDescription>
              Manage QR codes for your assigned users. You can email QR codes directly to users.
            </CardDescription>
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
                      <p className="text-sm text-gray-500">{assignedUser.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={assignedUser.isActive ? "default" : "secondary"}>
                        {assignedUser.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/admin?userId=${assignedUser.id}`)}
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
