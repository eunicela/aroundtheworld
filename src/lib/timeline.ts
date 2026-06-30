import * as THREE from "three";
import type { PhotoCardData } from "./types";

export const TIMELINE_CAMERA_Z = 8;
export const TIMELINE_FOV = 45;

const CARD_GAP = 0.03;
const YEAR_GAP = 0.1;
const Y_JITTER = 0.025;
const STRIP_PADDING = 0.92;

function seededRandom(seed: string, salt = 0): number {
  let h = salt;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 10000) / 10000;
}

export function visibleWidthAtDepth(
  z: number,
  fovDeg = TIMELINE_FOV
): number {
  return 2 * z * Math.tan((fovDeg * Math.PI) / 360);
}

export function parseYear(year?: string): number {
  if (!year) return Infinity;
  const n = parseInt(year, 10);
  return Number.isFinite(n) ? n : Infinity;
}

export function sortCardsByYear(cards: PhotoCardData[]): PhotoCardData[] {
  return [...cards].sort((a, b) => {
    const ya = parseYear(a.year);
    const yb = parseYear(b.year);
    if (ya !== yb) return ya - yb;
    if (a.cityId !== b.cityId) return a.cityId.localeCompare(b.cityId);
    return a.id.localeCompare(b.id);
  });
}

export interface TimelineSlot {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  sortIndex: number;
  cardScale: number;
}

export interface TimelineLayout {
  slots: Map<string, TimelineSlot>;
  stripWidth: number;
}

const FACE_CAMERA = new THREE.Quaternion();

function buildNaturalPositions(
  sorted: PhotoCardData[]
): { key: string; x: number; card: PhotoCardData; sortIndex: number }[] {
  const entries: {
    key: string;
    x: number;
    card: PhotoCardData;
    sortIndex: number;
  }[] = [];

  let x = 0;
  let prevYear: number | undefined;

  sorted.forEach((card, sortIndex) => {
    const year = parseYear(card.year);
    if (
      prevYear !== undefined &&
      year !== prevYear &&
      year !== Infinity &&
      prevYear !== Infinity
    ) {
      x += YEAR_GAP;
    }
    prevYear = year;

    const key = `${card.cityId}-${card.id}`;
    entries.push({ key, x: x + card.width / 2, card, sortIndex });
    x += card.width + CARD_GAP;
  });

  return entries;
}

export function computeTimelineLayout(cards: PhotoCardData[]): TimelineLayout {
  const sorted = sortCardsByYear(cards);
  const map = new Map<string, TimelineSlot>();
  const targetWidth =
    visibleWidthAtDepth(TIMELINE_CAMERA_Z) * STRIP_PADDING;

  if (sorted.length === 0) {
    return { slots: map, stripWidth: 0 };
  }

  const entries = buildNaturalPositions(sorted);
  const naturalWidth = Math.max(
    entries[entries.length - 1].x + entries[entries.length - 1].card.width / 2,
    0.001
  );
  const positionScale = targetWidth / naturalWidth;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const key = entry.key;
    const slotWidth =
      i < entries.length - 1
        ? (entries[i + 1].x - entry.x) * positionScale
        : entry.card.width * positionScale;
    const cardScale = Math.min(1, (slotWidth / entry.card.width) * 0.9);
    const jitterY = (seededRandom(key, 7) - 0.5) * 2 * Y_JITTER;

    map.set(key, {
      position: new THREE.Vector3(
        (entry.x - naturalWidth / 2) * positionScale,
        jitterY,
        -entry.sortIndex * 0.002
      ),
      quaternion: FACE_CAMERA.clone(),
      sortIndex: entry.sortIndex,
      cardScale,
    });
  }

  return { slots: map, stripWidth: targetWidth };
}

export function getTimelineStripWidth(cards: PhotoCardData[]): number {
  return computeTimelineLayout(cards).stripWidth;
}

export function getTimelinePanRange(
  stripWidth: number,
  cameraZ: number
): { min: number; max: number } {
  const visibleWidth = visibleWidthAtDepth(cameraZ) * STRIP_PADDING;
  const overflow = Math.max(0, stripWidth - visibleWidth);
  return { min: -overflow / 2, max: overflow / 2 };
}
