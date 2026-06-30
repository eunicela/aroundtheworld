"use client";

import { Suspense, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { GlobeScene } from "@/components/globe/GlobeScene";
import { Lightbox } from "@/components/ui/Lightbox";
import { SiteHeader } from "@/components/ui/SiteHeader";
import type { ActivePhoto, City, PhotoCardData, SonderData, ViewMode } from "@/lib/types";
import { findImageInData, getPhotographerFromData } from "@/lib/data";
import { getLightboxUrl } from "@/lib/images";

interface SonderExperienceProps {
  cities: City[];
  data: SonderData;
}

export function SonderExperience({ cities, data }: SonderExperienceProps) {
  const [activePhoto, setActivePhoto] = useState<ActivePhoto | null>(null);
  const [focusCard, setFocusCard] = useState<PhotoCardData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("globe");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handlePhotoSelect = useCallback(
    (card: PhotoCardData) => {
      setFocusCard(card);
      const image = findImageInData(data, card.cityId, card.id);
      const photographer = getPhotographerFromData(data, card.photographerId);
      setActivePhoto({
        id: card.id,
        imageUrl: image
          ? getLightboxUrl(image.cloudinaryId, image.format)
          : card.imageUrl,
        photographerId: card.photographerId,
        photographerName: card.photographerName,
        cityId: card.cityId,
        cityName: card.cityName,
        year: card.year,
        url: card.url,
        instagram: photographer?.instagram,
        lon: card.lon,
      });
    },
    [data]
  );

  const handleViewModeToggle = () => {
    if (isTransitioning) return;
    setActivePhoto(null);
    setFocusCard(null);
    setViewMode((mode) => (mode === "globe" ? "timeline" : "globe"));
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-paper">
      <SiteHeader className="pointer-events-none absolute inset-x-0 top-0 z-40 [&_a]:pointer-events-auto">
        <p className="font-display text-lg tracking-wide text-charcoal/45 sm:text-xl">
          Photos Around the World
        </p>
      </SiteHeader>

      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="touch-none"
      >
        <Suspense fallback={null}>
          <GlobeScene
            cities={cities}
            focusCard={focusCard}
            viewMode={viewMode}
            onTransitionChange={setIsTransitioning}
            onPhotoSelect={handlePhotoSelect}
          />
        </Suspense>
      </Canvas>

      <AnimatePresence mode="wait">
        {activePhoto && (
          <Lightbox
            key={activePhoto.id}
            photo={activePhoto}
            onClose={() => setActivePhoto(null)}
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleViewModeToggle}
        disabled={isTransitioning}
        className="absolute bottom-8 left-1/2 z-40 -translate-x-1/2 font-body text-xs tracking-widest text-charcoal/50 uppercase transition-colors hover:text-charcoal disabled:pointer-events-none disabled:opacity-30"
      >
        {viewMode === "globe" ? "Timeline" : "Globe"}
      </button>
    </div>
  );
}
