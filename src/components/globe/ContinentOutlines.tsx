"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLOBE_RADIUS } from "@/lib/geo";
import { loadCoastlineGeometries } from "@/lib/coastline";

const CONTINENT_COLOR = "#8A8278";
const CONTINENT_OPACITY = 0.85;
const coastlineRadius = GLOBE_RADIUS + 0.008;

export function ContinentOutlines() {
  const [geometries, setGeometries] = useState<THREE.BufferGeometry[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadCoastlineGeometries(coastlineRadius).then((geos) => {
      if (!cancelled) setGeometries(geos);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const lines = useMemo(() => {
    return geometries.map((geo) => {
      const material = new THREE.LineBasicMaterial({
        color: CONTINENT_COLOR,
        transparent: true,
        opacity: CONTINENT_OPACITY,
        depthWrite: false,
      });
      material.userData.baseOpacity = CONTINENT_OPACITY;
      const line = new THREE.Line(geo, material);
      line.renderOrder = -10;
      return line;
    });
  }, [geometries]);

  if (lines.length === 0) return null;

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}
