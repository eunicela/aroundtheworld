"use client";

import { usePhotoDescription } from "@/hooks/usePhotoDescription";
import { bodyCopyClass } from "@/lib/typography";

interface PhotoDescriptionProps {
  cityId: string;
  imageId: string;
  editorialCaption?: string;
  fallbackText?: string;
  className?: string;
  loadingClassName?: string;
}

export function PhotoDescription({
  cityId,
  imageId,
  editorialCaption,
  fallbackText,
  className = `${bodyCopyClass} text-charcoal/75`,
  loadingClassName = `${bodyCopyClass} text-charcoal/40 italic`,
}: PhotoDescriptionProps) {
  const { text, loading, error } = usePhotoDescription({
    cityId,
    imageId,
    editorialCaption,
    fallbackText,
  });

  if (loading) {
    return <p className={loadingClassName}>Description loading…</p>;
  }

  if (error || !text) {
    return (
      <p className={loadingClassName}>Could not load description.</p>
    );
  }

  return (
    <p className={className}>
      {text.split(/\n\n+/).filter(Boolean).map((paragraph, index) => (
        <span key={index}>
          {index > 0 && (
            <>
              <br />
              <br />
            </>
          )}
          {paragraph}
        </span>
      ))}
    </p>
  );
}
