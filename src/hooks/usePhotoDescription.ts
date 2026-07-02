"use client";

import { useEffect, useRef, useState } from "react";

const CACHE_PREFIX = "sonder-describe:";

function cacheKey(cityId: string, imageId: string): string {
  return `${CACHE_PREFIX}${cityId}/${imageId}`;
}

function readCache(cityId: string, imageId: string): string | null {
  try {
    return localStorage.getItem(cacheKey(cityId, imageId));
  } catch {
    return null;
  }
}

function writeCache(cityId: string, imageId: string, text: string): void {
  try {
    localStorage.setItem(cacheKey(cityId, imageId), text);
  } catch {
    // Ignore quota errors.
  }
}

interface UsePhotoDescriptionOptions {
  cityId: string;
  imageId: string;
  editorialCaption?: string;
  fallbackText?: string;
}

export function usePhotoDescription({
  cityId,
  imageId,
  editorialCaption,
  fallbackText,
}: UsePhotoDescriptionOptions) {
  const [text, setText] = useState<string | null>(editorialCaption ?? null);
  const [loading, setLoading] = useState(!editorialCaption);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (editorialCaption) {
      setText(editorialCaption);
      setLoading(false);
      setError(false);
      return;
    }

    const cached = readCache(cityId, imageId);
    if (cached) {
      setText(cached);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setText(null);
    setLoading(true);
    setError(false);

    fetch("/api/describe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId, imageId }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Request failed");
        const data = (await res.json()) as { text?: string };
        if (!data.text) throw new Error("Empty response");
        writeCache(cityId, imageId, data.text);
        setText(data.text);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setText(fallbackText ?? null);
        setLoading(false);
        setError(!fallbackText);
      });

    return () => controller.abort();
  }, [cityId, imageId, editorialCaption, fallbackText]);

  return { text, loading, error };
}
