import { useLocation } from "wouter";
import { Building2, QrCode, Store, LogOut } from "lucide-react";
import justShareNowLogo from "@assets/JustSharenow_logo_1766216638301.png";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageSelector } from "@/components/language-selector";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useQuery } from "@tanstack/react-query";
import { getStoreConfig } from "@/lib/api";
import { logout } from "@/lib/authUtils";

export function Layout({ 
  children, 
  isAdmin = false, 
  hideCarousel = false,
  activeAdminTab = "dashboard",
  onAdminTabChange
}: { 
  children: React.ReactNode, 
  isAdmin?: boolean, 
  hideCarousel?: boolean,
  activeAdminTab?: string,
  onAdminTabChange?: (tab: string) => void
}) {
  const [location] = useLocation();
  
  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
    enabled: isAdmin, // Only fetch config when user is authenticated (admin view)
  });
  
  const sliderPhotos = config?.sliderPhotos || [];

  // Only show carousel on non-admin pages if there are slider photos and not hidden
  // Note: Carousel is disabled for Layout since we only fetch config in admin mode
  const showCarousel = false; // Carousel handled by individual pages with their own config

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src={justShareNowLogo} alt="JustShareNow" className="h-10 w-auto object-contain" />
          </div>

          <div className="hidden md:flex items-center gap-6">
            {isAdmin && onAdminTabChange && (
              <Tabs value={activeAdminTab} onValueChange={onAdminTabChange}>
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="dashboard" className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="quick-view" className="flex items-center gap-2 text-sm">
                    <QrCode className="w-4 h-4" />
                    Quick View
                  </TabsTrigger>
                  <TabsTrigger value="shop-view" className="flex items-center gap-2 text-sm">
                    <Store className="w-4 h-4" />
                    Shop View
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            
            <div className="flex items-center gap-2">
              <LanguageSelector />
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  className="flex items-center gap-2"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {isAdmin && onAdminTabChange && (
              <div className="flex items-center gap-1">
                <Button 
                  variant={activeAdminTab === "dashboard" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onAdminTabChange("dashboard")}
                  className="flex items-center gap-1 px-2"
                  data-testid="button-dashboard-mobile"
                >
                  <Building2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant={activeAdminTab === "quick-view" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onAdminTabChange("quick-view")}
                  className="flex items-center gap-1 px-2"
                  data-testid="button-quick-view-mobile"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
                <Button 
                  variant={activeAdminTab === "shop-view" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onAdminTabChange("shop-view")}
                  className="flex items-center gap-1 px-2"
                  data-testid="button-shop-view-mobile"
                >
                  <Store className="w-4 h-4" />
                </Button>
              </div>
            )}
            <LanguageSelector />
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={logout}
                className="flex items-center gap-1"
                data-testid="button-logout-mobile"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Shop Photos Carousel */}
      {showCarousel && (
        <div className="w-full bg-muted/10">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
            className="w-full max-w-screen-2xl mx-auto"
          >
            <CarouselContent>
              {sliderPhotos.map((photo: string, index: number) => (
                <CarouselItem key={index} className="basis-full md:basis-1/2 lg:basis-1/3 pl-0">
                  <div className="relative aspect-video md:aspect-[21/9] overflow-hidden">
                    <img 
                      src={photo} 
                      alt={`Slider photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>


      <footer className="border-t py-6 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 JustShareNow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
