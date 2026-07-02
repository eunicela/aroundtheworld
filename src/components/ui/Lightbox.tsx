"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ActivePhoto } from "@/lib/types";
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
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden
      />

      <motion.aside
        className={`fixed z-50 ${
          side === "left"
            ? "top-20 left-4 md:left-6"
            : "top-20 right-4 md:right-6"
        }`}
        initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
        transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.imageUrl}
            alt={photo.title ?? `Photograph by ${photo.photographerName}`}
            width={photo.width}
            height={photo.height}
            className="block h-auto max-h-48 w-auto"
            style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
          />

          <div className="relative">
            <a
              href={photo.instagram ?? photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-xs leading-tight text-charcoal transition-colors hover:text-accent"
            >
              {photo.photographerName}
            </a>
            <p className="mt-0.5 font-body text-[10px] tracking-widest text-accent uppercase">
              {photo.cityName}
              {photo.year && ` · ${photo.year}`}
            </p>

            <Link
              href={`/gallery/${photo.cityId}/${photo.id}`}
              className="absolute top-0 left-full ml-1.5 flex items-center justify-center text-charcoal/40 transition-colors hover:text-charcoal"
              aria-label="View in gallery"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M4.5 11.5L11.5 4.5M11.5 4.5H6.5M11.5 4.5V9.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
