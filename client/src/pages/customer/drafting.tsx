import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import hairImage from "@assets/generated_images/before_and_after_hair_treatment_comparison.png";
import skinImage from "@assets/generated_images/before_and_after_skin_treatment_comparison.png";
import regrowLogo from "@assets/generated_images/regrow_group_corporate_logo.png";

const photos = [
  { id: 'hair', src: hairImage, label: 'Hair Treatment' },
  { id: 'skin', src: skinImage, label: 'Skin Treatment' },
];

export default function CustomerDrafting() {
  const { language, setSelectedReview, setSelectedPhoto, selectedPhoto, selectedReview } = useStore();
  const [_, setLocation] = useLocation();
  
  const t = translations[language];
  
  const handleNext = () => {
    if (selectedPhoto && selectedReview) {
      setLocation('/platform');
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-8 animate-in-slide-up">
          <img src={regrowLogo} alt="Regrow" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">{t.customer.drafting.title}</h1>
          <p className="text-muted-foreground text-sm">{t.customer.drafting.subtitle}</p>
        </div>

        {/* Photo Selection */}
        <section className="mb-8 animate-in-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 ml-1">
            {t.customer.drafting.selectPhoto}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div 
                key={photo.id}
                onClick={() => setSelectedPhoto(photo.src)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
                  selectedPhoto === photo.src 
                    ? 'border-primary ring-2 ring-primary/20 scale-95' 
                    : 'border-transparent hover:border-border'
                }`}
              >
                <img src={photo.src} alt={photo.label} className="w-full h-full object-cover" />
                {selectedPhoto === photo.src && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-xs">
                    <div className="bg-white text-primary rounded-full p-1 shadow-lg">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Review Selection */}
        <section className="mb-8 animate-in-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 ml-1">
            {t.customer.drafting.selectReview}
          </h2>
          <div className="space-y-3">
            {t.customer.drafting.reviews.map((review, idx) => (
              <Card 
                key={idx}
                onClick={() => setSelectedReview(review)}
                className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedReview === review 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm leading-relaxed text-foreground">{review}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-10">
        <div className="container max-w-md mx-auto">
          <Button 
            className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20" 
            onClick={handleNext}
            disabled={!selectedPhoto || !selectedReview}
          >
            {t.common.next}
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
