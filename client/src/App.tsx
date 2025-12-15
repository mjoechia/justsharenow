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

function Router() {
  return (
    <Switch>
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
