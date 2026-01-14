import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/landing";
import CustomerDrafting from "@/pages/customer/drafting";
import FacebookReview from "@/pages/customer/facebook-review";
import InstagramReview from "@/pages/customer/instagram-review";
import AdminDashboard from "@/pages/admin/dashboard";
import QuickView from "@/pages/quick-view";
import HelpPage from "@/pages/help";
import LoginPage from "@/pages/login";
import LoginQRPage from "@/pages/login-qr";
import MasterAdminDashboard from "@/pages/master-admin";
import AdminDashboardPage from "@/pages/admin-dashboard";
import UserLanding from "@/pages/user-landing";

function Router() {
  return (
    <Switch>
      {/* Authentication */}
      <Route path="/login" component={LoginPage} />
      <Route path="/login-qr" component={LoginQRPage} />
      <Route path="/master-admin" component={MasterAdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboardPage} />
      
      {/* Landing / Shop View (QR Code Preview) */}
      <Route path="/">{() => <Landing />}</Route>
      
      {/* Quick View (User Scan) */}
      <Route path="/quick-view">{() => <QuickView />}</Route>

      {/* Customer Flow */}
      <Route path="/drafting" component={CustomerDrafting} />
      
      {/* Admin Flow */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Help Page */}
      <Route path="/help" component={HelpPage} />
      
      {/* User-specific landing page by slug (e.g., /carin141319) */}
      <Route path="/:slug" component={UserLanding} />
      <Route path="/:slug/drafting" component={CustomerDrafting} />
      <Route path="/:slug/facebook" component={FacebookReview} />
      <Route path="/:slug/instagram" component={InstagramReview} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
