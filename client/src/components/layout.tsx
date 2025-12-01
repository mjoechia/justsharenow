import { useStore } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import sharelotLogo from "@assets/generated_images/modern_abstract_logo_for_sharelot.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children, isAdmin = false }: { children: React.ReactNode, isAdmin?: boolean }) {
  const { language, setLanguage } = useStore();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={sharelotLogo} alt="Sharelot" className="h-8 w-8 rounded-lg" />
            <span className="font-heading font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Sharelot
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

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-6 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Sharelot for Regrow Group. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
