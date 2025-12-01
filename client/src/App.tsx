import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/landing";
import CustomerDrafting from "@/pages/customer/drafting";
import CustomerPlatform from "@/pages/customer/platform";
import AdminDashboard from "@/pages/admin/dashboard";

function Router() {
  return (
    <Switch>
      {/* Landing / QR Code Preview */}
      <Route path="/" component={Landing} />

      {/* Customer Flow */}
      <Route path="/drafting" component={CustomerDrafting} />
      <Route path="/platform" component={CustomerPlatform} />
      
      {/* Admin Flow */}
      <Route path="/admin" component={AdminDashboard} />
      
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
