"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { WireframeGlobe } from "./WireframeGlobe";
import { ContinentOutlines } from "./ContinentOutlines";
import { PhotoCard } from "./PhotoCard";
import { TimelinePanControls } from "./TimelinePanControls";
import type { City, PhotoCardData, ViewMode } from "@/lib/types";
import { buildAllPhotoCards } from "@/lib/data";
import {
  computeGlobeYRotationToFaceCamera,
  easeInOutCubic,
  shortestAngleDelta,
} from "@/lib/geo";
import {
  computeTimelineLayout,
  getTimelinePanRange,
  TIMELINE_CAMERA_Z,
} from "@/lib/timeline";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const GLOBE_ROT_ORDER = "YXZ" as const;
const TRANSITION_MS = 1400;
const GLOBE_CAMERA_Z = 5.5;

interface GlobeSceneProps {
  cities: City[];
  focusCard: PhotoCardData | null;
  viewMode: ViewMode;
  onTransitionChange: (active: boolean) => void;
  onPhotoSelect: (card: PhotoCardData) => void;
}

type GlobeSpin = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
  duration: number;
};

type LayoutTransition = {
  from: number;
  to: number;
  startTime: number;
  duration: number;
  globeFromX: number;
  globeFromY: number;
  cameraFromX: number;
  cameraFromY: number;
  cameraFromZ: number;
  cameraToZ: number;
  panFrom: number;
};

const ORIGIN = new THREE.Vector3(0, 0, 0);

function syncOrbitControls(
  controls: React.ComponentRef<typeof OrbitControls> | null,
  camera: THREE.Camera
) {
  if (!controls) return;
  controls.target.copy(ORIGIN);
  controls.object.position.copy(camera.position);
  controls.update();
}

function aimCameraAtOrigin(camera: THREE.Camera) {
  camera.up.set(0, 1, 0);
  camera.lookAt(ORIGIN);
}

function centerCameraOnAxis(camera: THREE.Camera) {
  const z = camera.position.z;
  camera.position.set(0, 0, z);
  aimCameraAtOrigin(camera);
}

function applyGlobeRotation(group: THREE.Group, x: number, y: number) {
  group.rotation.set(x, y, 0, GLOBE_ROT_ORDER);
}

function readGlobeRotation(group: THREE.Group): { x: number; y: number } {
  const euler = new THREE.Euler().setFromQuaternion(
    group.quaternion,
    GLOBE_ROT_ORDER
  );
  return { x: euler.x, y: euler.y };
}

const TIMELINE_CAMERA = new THREE.Vector3(0, 0, TIMELINE_CAMERA_Z);
const GLOBE_CAMERA = new THREE.Vector3(0, 0, GLOBE_CAMERA_Z);

function resetCameraForTimeline(camera: THREE.Camera) {
  camera.position.set(0, 0, TIMELINE_CAMERA_Z);
  centerCameraOnAxis(camera);
}

function resetCameraForGlobe(camera: THREE.Camera) {
  camera.position.set(0, 0, GLOBE_CAMERA_Z);
  centerCameraOnAxis(camera);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyGlobeMaterialOpacity(group: THREE.Group, fade: number) {
  group.traverse((child) => {
    if (!(child instanceof THREE.Line)) return;
    const material = child.material;
    if (!(material instanceof THREE.LineBasicMaterial)) return;
    const baseOpacity =
      typeof material.userData.baseOpacity === "number"
        ? material.userData.baseOpacity
        : material.opacity;
    material.transparent = true;
    material.opacity = baseOpacity * fade;
  });
}

export function GlobeScene({
  cities,
  focusCard,
  viewMode,
  onTransitionChange,
  onPhotoSelect,
}: GlobeSceneProps) {
  const globeRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const spinRef = useRef<GlobeSpin | null>(null);
  const layoutTransitionRef = useRef<LayoutTransition | null>(null);
  const layoutBlendRef = useRef(viewMode === "timeline" ? 1 : 0);
  const globeMatrixRef = useRef(new THREE.Matrix4());
  const timelinePanRef = useRef(0);
  const panRangeRef = useRef({ min: 0, max: 0 });
  const suppressTimelineClickRef = useRef(false);
  const globeOpacityRef = useRef(viewMode === "timeline" ? 0 : 1);
  const prevViewModeRef = useRef<ViewMode | null>(null);
  const [isLayoutTransitioning, setIsLayoutTransitioning] = useState(false);
  const { gl, camera } = useThree();
  const reducedMotion = useReducedMotion();

  const photoCards = useMemo(() => buildAllPhotoCards(cities), [cities]);
  const { slots: timelineLayout, stripWidth } = useMemo(
    () => computeTimelineLayout(photoCards),
    [photoCards]
  );

  useEffect(() => {
    if (prevViewModeRef.current === null) {
      prevViewModeRef.current = viewMode;
      return;
    }
    if (prevViewModeRef.current === viewMode) return;

    const from = layoutBlendRef.current;
    const to = viewMode === "timeline" ? 1 : 0;
    const globeRot = globeRef.current
      ? readGlobeRotation(globeRef.current)
      : { x: 0, y: 0 };

    if (reducedMotion) {
      layoutBlendRef.current = to;
      globeOpacityRef.current = 1 - to;
      timelinePanRef.current = 0;
      spinRef.current = null;

      if (globeRef.current) {
        applyGlobeRotation(globeRef.current, 0, 0);
        globeRef.current.scale.setScalar(to === 1 ? 0.08 : 1);
      }

      if (to === 1) {
        resetCameraForTimeline(camera);
      } else {
        resetCameraForGlobe(camera);
      }

      if (controlsRef.current) {
        syncOrbitControls(controlsRef.current, camera);
        controlsRef.current.enabled = true;
      }

      prevViewModeRef.current = viewMode;
      onTransitionChange(false);
      return;
    }

    setIsLayoutTransitioning(true);

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    layoutTransitionRef.current = {
      from,
      to,
      startTime: performance.now(),
      duration: TRANSITION_MS,
      globeFromX: globeRot.x,
      globeFromY: globeRot.y,
      cameraFromX: camera.position.x,
      cameraFromY: camera.position.y,
      cameraFromZ: camera.position.z,
      cameraToZ: to === 1 ? TIMELINE_CAMERA_Z : GLOBE_CAMERA_Z,
      panFrom: timelinePanRef.current,
    };

    if (to === 1) {
      spinRef.current = null;
    }

    onTransitionChange(true);
    prevViewModeRef.current = viewMode;
  }, [viewMode, reducedMotion, camera, onTransitionChange]);

  useEffect(() => {
    if (viewMode !== "globe" || !focusCard || !globeRef.current) return;

    const { x: fromX, y: fromY } = readGlobeRotation(globeRef.current);
    const targetY = computeGlobeYRotationToFaceCamera(
      focusCard.lat,
      focusCard.lon,
      focusCard.offsetX,
      focusCard.offsetZ,
      camera.position
    );
    const toY = shortestAngleDelta(fromY, targetY);

    if (reducedMotion) {
      applyGlobeRotation(globeRef.current, fromX, toY);
      return;
    }

    if (controlsRef.current) controlsRef.current.enabled = false;

    spinRef.current = {
      fromX,
      fromY,
      toX: fromX,
      toY,
      startTime: performance.now(),
      duration: 900,
    };
  }, [focusCard, reducedMotion, viewMode, camera]);

  useFrame(() => {
    const layoutTransition = layoutTransitionRef.current;

    if (layoutTransition && globeRef.current) {
      const progress = Math.min(
        1,
        (performance.now() - layoutTransition.startTime) /
          layoutTransition.duration
      );
      const eased = easeInOutCubic(progress);
      layoutBlendRef.current =
        layoutTransition.from +
        (layoutTransition.to - layoutTransition.from) * eased;
      globeOpacityRef.current = 1 - layoutBlendRef.current;

      const globeScale = 1 - layoutBlendRef.current * 0.92;
      globeRef.current.scale.setScalar(Math.max(globeScale, 0.01));

      const globeX = layoutTransition.globeFromX * (1 - eased);
      const globeY = layoutTransition.globeFromY * (1 - eased);
      applyGlobeRotation(globeRef.current, globeX, globeY);

      timelinePanRef.current = layoutTransition.panFrom * (1 - eased);

      camera.position.set(
        THREE.MathUtils.lerp(layoutTransition.cameraFromX, 0, eased),
        THREE.MathUtils.lerp(layoutTransition.cameraFromY, 0, eased),
        THREE.MathUtils.lerp(
          layoutTransition.cameraFromZ,
          layoutTransition.cameraToZ,
          eased
        )
      );
      aimCameraAtOrigin(camera);

      if (progress >= 1) {
        layoutBlendRef.current = layoutTransition.to;
        globeOpacityRef.current = 1 - layoutTransition.to;
        timelinePanRef.current = 0;
        layoutTransitionRef.current = null;

        if (globeRef.current) {
          applyGlobeRotation(globeRef.current, 0, 0);
          globeRef.current.scale.setScalar(
            layoutTransition.to === 1 ? 0.08 : 1
          );
        }

        camera.position.set(0, 0, layoutTransition.cameraToZ);
        aimCameraAtOrigin(camera);
        syncOrbitControls(controlsRef.current, camera);

        onTransitionChange(false);
        requestAnimationFrame(() => {
          setIsLayoutTransitioning(false);
        });
      }
    }

    if (globeRef.current) {
      if (!layoutTransition) {
        const globeScale = 1 - layoutBlendRef.current * 0.92;
        globeRef.current.scale.setScalar(Math.max(globeScale, 0.01));
        globeOpacityRef.current = 1 - layoutBlendRef.current;
      }

      if (viewMode === "timeline" && layoutBlendRef.current > 0.95) {
        panRangeRef.current = getTimelinePanRange(
          stripWidth,
          camera.position.z
        );
        timelinePanRef.current = clamp(
          timelinePanRef.current,
          panRangeRef.current.min,
          panRangeRef.current.max
        );
      }

      globeRef.current.visible = globeOpacityRef.current > 0.001;
      applyGlobeMaterialOpacity(globeRef.current, globeOpacityRef.current);
      globeRef.current.updateMatrixWorld(true);
      globeMatrixRef.current.copy(globeRef.current.matrixWorld);
    }

    const spin = spinRef.current;
    if (spin && globeRef.current && viewMode === "globe" && !layoutTransition) {
      const progress = Math.min(
        1,
        (performance.now() - spin.startTime) / spin.duration
      );
      const eased = easeInOutCubic(progress);
      const x = spin.fromX + (spin.toX - spin.fromX) * eased;
      const y = spin.fromY + (spin.toY - spin.fromY) * eased;
      applyGlobeRotation(globeRef.current, x, y);

      if (progress >= 1) {
        applyGlobeRotation(globeRef.current, spin.toX, spin.toY);
        spinRef.current = null;
        if (controlsRef.current && layoutTransitionRef.current === null) {
          controlsRef.current.enabled = true;
        }
      }
    }
  });

  const isTimeline = viewMode === "timeline";

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 3, 5]} intensity={0.4} />

      <group ref={globeRef}>
        <WireframeGlobe />
        <ContinentOutlines />
      </group>

      {photoCards.map((card) => {
        const key = `${card.cityId}-${card.id}`;
        const slot = timelineLayout.get(key);
        if (!slot) return null;

        return (
          <PhotoCard
            key={key}
            card={card}
            visible
            timelineSlot={slot}
            layoutBlendRef={layoutBlendRef}
            globeMatrixRef={globeMatrixRef}
            timelinePanRef={timelinePanRef}
            suppressClickRef={suppressTimelineClickRef}
            totalCards={photoCards.length}
            onSelect={onPhotoSelect}
          />
        );
      })}

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enableRotate={!isTimeline}
        enablePan={false}
        enabled={!isLayoutTransitioning}
        minDistance={isTimeline ? 1.2 : 1.6}
        maxDistance={isTimeline ? 14 : 8}
        rotateSpeed={0.4}
        zoomSpeed={0.7}
      />

      <TimelinePanControls
        active={isTimeline && !isLayoutTransitioning}
        panXRef={timelinePanRef}
        panRangeRef={panRangeRef}
        suppressClickRef={suppressTimelineClickRef}
      />

      <mesh
        visible={false}
        onClick={() => {
          gl.domElement.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>
    </>
  );
}
