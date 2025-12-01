import { useStore } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import sharelotLogo from "@assets/generated_images/modern_abstract_logo_for_sharelot.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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

export function Layout({ children, isAdmin = false }: { children: React.ReactNode, isAdmin?: boolean }) {
  const { language, setLanguage } = useStore();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });
  
  const shopPhotos = config?.shopPhotos || [];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  // Only show carousel on non-admin pages if there are photos
  const showCarousel = !isAdmin && shopPhotos.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={sharelotLogo} alt="ShareLor" className="h-8 w-8 rounded-lg" />
            <span className="font-heading font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              ShareLor
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {isAdmin && (
              <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <Link href="/admin" className={location === '/admin' ? "text-primary" : "hover:text-foreground transition-colors"}>
                  Dashboard
                </Link>
                <Link href="/admin/qr" className={location === '/admin/qr' ? "text-primary" : "hover:text-foreground transition-colors"}>
                  QR Codes
                </Link>
                <Link href="/admin/analytics" className={location === '/admin/analytics' ? "text-primary" : "hover:text-foreground transition-colors"}>
                  Analytics
                </Link>
              </nav>
            )}
            
            <div className="flex items-center gap-2">
              {!isAdmin && (
                 <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                    <Link href="/admin">Admin View</Link>
                 </Button>
              )}
              {isAdmin && (
                 <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                    <Link href="/">Customer View</Link>
                 </Button>
              )}
              <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-full">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Toggle Language</span>
              </Button>
              <span className="text-xs font-medium w-6">{language.toUpperCase()}</span>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage}>
               <span className="text-xs font-bold">{language.toUpperCase()}</span>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-medium">Customer Demo</Link>
                  <Link href="/admin" className="text-lg font-medium">Admin Dashboard</Link>
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
              {shopPhotos.map((photo, index) => (
                <CarouselItem key={index} className="basis-full md:basis-1/2 lg:basis-1/3 pl-0">
                  <div className="relative aspect-video md:aspect-[21/9] overflow-hidden">
                    <img 
                      src={photo} 
                      alt={`Shop photo ${index + 1}`} 
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
          <p>© 2025 ShareLor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
