"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

interface TimelinePanControlsProps {
  active: boolean;
  panXRef: React.MutableRefObject<number>;
  panRangeRef: React.RefObject<{ min: number; max: number }>;
  suppressClickRef: React.MutableRefObject<boolean>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function TimelinePanControls({
  active,
  panXRef,
  panRangeRef,
  suppressClickRef,
}: TimelinePanControlsProps) {
  const { gl } = useThree();
  const dragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    if (!active) return;

    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      lastX.current = e.clientX;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      if (dx === 0) return;
      lastX.current = e.clientX;

      const range = panRangeRef.current ?? { min: 0, max: 0 };
      panXRef.current = clamp(
        panXRef.current + dx * 0.008,
        range.min,
        range.max
      );
      suppressClickRef.current = true;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (dragging.current && suppressClickRef.current) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
      dragging.current = false;
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("pointerleave", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("pointerleave", onPointerUp);
    };
  }, [active, gl.domElement, panXRef, panRangeRef, suppressClickRef]);

  return null;
}
