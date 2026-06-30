"use client";

import { motion } from "framer-motion";
import type { ActivePhoto } from "@/lib/types";
import Link from "next/link";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface LightboxProps {
  photo: ActivePhoto;
  onClose: () => void;
}

function panelSide(lon: number): "left" | "right" {
  return lon >= 0 ? "left" : "right";
}

export function Lightbox({ photo, onClose }: LightboxProps) {
  const reducedMotion = useReducedMotion();
  const side = panelSide(photo.lon);

  return (
    <motion.aside
      className={`fixed z-50 aspect-[16/9] w-[min(42vw,14rem)] overflow-hidden rounded-sm border border-charcoal/10 bg-paper shadow-md ${
        side === "left"
          ? "top-24 left-4 md:left-6"
          : "top-24 right-4 md:right-6"
      }`}
      initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
      transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        onClick={onClose}
        className="absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center text-charcoal/50 transition-colors hover:text-charcoal"
        aria-label="Close"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <div className="flex h-full min-h-0">
        <div className="flex min-w-0 flex-[1.2] items-center justify-center p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.imageUrl}
            alt={`Photograph by ${photo.photographerName}`}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-2 pr-5">
          <div>
            <Link
              href={`/photographer/${photo.photographerId}`}
              className="font-display text-xs leading-tight text-charcoal transition-colors hover:text-accent"
            >
              {photo.photographerName}
            </Link>
            <p className="mt-0.5 font-body text-[10px] tracking-widest text-accent uppercase">
              {photo.cityName}
              {photo.year && ` · ${photo.year}`}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <Link
              href={`/gallery/${photo.cityId}/${photo.id}`}
              className="inline-flex w-fit rounded-full border border-charcoal/15 px-2.5 py-0.5 font-body text-[10px] tracking-wide text-charcoal/70 transition-colors hover:border-charcoal/30 hover:text-charcoal"
            >
              View
            </Link>
            {photo.instagram && (
              <a
                href={photo.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-[10px] text-charcoal/70 underline-offset-2 transition-colors hover:text-charcoal hover:underline"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
