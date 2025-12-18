import { useStore } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { Menu, Building2, QrCode, Store } from "lucide-react";
import { useState } from "react";
import justShareNowLogo from "@assets/justsharenow_logo_1765236628260.jpg";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });
  
  const sliderPhotos = config?.sliderPhotos || [];

  // Only show carousel on non-admin pages if there are slider photos and not hidden
  const showCarousel = !isAdmin && !hideCarousel && sliderPhotos.length > 0;

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
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSelector />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-medium">Home</Link>
                </div>
              </SheetContent>
            </Sheet>
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
