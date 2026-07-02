"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { GLOBE_RADIUS } from "@/lib/geo";

const GRID_COLOR = "#D5D0C8";
const GRID_OPACITY = 0.6;

function createLatLine(lat: number, radius: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  for (let lon = -180; lon <= 180; lon += 2) {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lon + 180) * Math.PI) / 180;
    points.push(
      new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      )
    );
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function createLonLine(lon: number, radius: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  for (let lat = -90; lat <= 90; lat += 2) {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lon + 180) * Math.PI) / 180;
    points.push(
      new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      )
    );
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

export function WireframeGlobe() {
  const lines = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (let lat = -60; lat <= 60; lat += 15) {
      geos.push(createLatLine(lat, GLOBE_RADIUS));
    }
    for (let lon = -180; lon < 180; lon += 15) {
      geos.push(createLonLine(lon, GLOBE_RADIUS));
    }

    return geos.map((geo) => {
      const material = new THREE.LineBasicMaterial({
        color: GRID_COLOR,
        transparent: true,
        opacity: GRID_OPACITY,
        depthWrite: false,
      });
      material.userData.baseOpacity = GRID_OPACITY;
      const line = new THREE.Line(geo, material);
      line.renderOrder = -10;
      return line;
    });
  }, []);

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}
