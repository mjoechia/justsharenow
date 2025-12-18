import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/landing";
import CustomerDrafting from "@/pages/customer/drafting";
import AdminDashboard from "@/pages/admin/dashboard";
import QuickView from "@/pages/quick-view";
import HelpPage from "@/pages/help";
import LoginPage from "@/pages/login";
import MasterAdminDashboard from "@/pages/master-admin";
import AdminDashboardPage from "@/pages/admin-dashboard";

function Router() {
  return (
    <Switch>
      {/* Authentication */}
      <Route path="/login" component={LoginPage} />
      <Route path="/master-admin" component={MasterAdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboardPage} />
      
      {/* Landing / Shop View (QR Code Preview) */}
      <Route path="/" component={Landing} />
      
      {/* Quick View (User Scan) */}
      <Route path="/quick-view" component={QuickView} />

      {/* Customer Flow */}
      <Route path="/drafting" component={CustomerDrafting} />
      
      {/* Admin Flow */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Help Page */}
      <Route path="/help" component={HelpPage} />
      
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
