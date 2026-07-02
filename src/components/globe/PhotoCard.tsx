"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { PhotoCardData } from "@/lib/types";
import type { TimelineSlot } from "@/lib/timeline";
import { outwardOrientation, easeInOutCubic } from "@/lib/geo";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PhotoCardProps {
  card: PhotoCardData;
  visible: boolean;
  timelineSlot: TimelineSlot;
  layoutBlendRef: React.RefObject<number>;
  globeMatrixRef: React.RefObject<THREE.Matrix4>;
  timelinePanRef: React.RefObject<number>;
  suppressClickRef: React.MutableRefObject<boolean>;
  totalCards: number;
  onSelect: (card: PhotoCardData) => void;
}

const _globePos = new THREE.Vector3();
const _timelinePos = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _globeQuat = new THREE.Quaternion();
const _timelineQuat = new THREE.Quaternion();
const _targetQuat = new THREE.Quaternion();
const _globeRotQuat = new THREE.Quaternion();
const _globeScale = new THREE.Vector3();
const _globeOrigin = new THREE.Vector3();

export function PhotoCard({
  card,
  visible,
  timelineSlot,
  layoutBlendRef,
  globeMatrixRef,
  timelinePanRef,
  suppressClickRef,
  totalCards,
  onSelect,
}: PhotoCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const imageMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const opacityRef = useRef(0);
  const reducedMotion = useReducedMotion();

  const globeLocal = useMemo(
    () =>
      outwardOrientation(
        card.lat,
        card.lon,
        card.offsetX,
        card.offsetZ,
        card.offsetY
      ),
    [card.lat, card.lon, card.offsetX, card.offsetZ, card.offsetY]
  );

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      card.imageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (imageMatRef.current) {
          imageMatRef.current.map = tex;
          imageMatRef.current.needsUpdate = true;
        }
      },
      undefined,
      () => {
        if (imageMatRef.current) {
          imageMatRef.current.color.set("#D5D0C8");
        }
      }
    );
  }, [card.imageUrl]);

  useFrame(() => {
    if (!groupRef.current) return;

    const globalBlend = layoutBlendRef.current;
    const inTransition = globalBlend > 0.001 && globalBlend < 0.999;
    const stagger = inTransition
      ? 0
      : totalCards > 1
        ? (timelineSlot.sortIndex / (totalCards - 1)) * 0.04
        : 0;
    const cardBlend = reducedMotion
      ? globalBlend
      : inTransition
        ? globalBlend
        : easeInOutCubic(
            Math.min(
              1,
              Math.max(0, (globalBlend - stagger) / (1 - stagger || 1))
            )
          );

    globeMatrixRef.current.decompose(_globeOrigin, _globeRotQuat, _globeScale);
    _globePos
      .copy(globeLocal.position)
      .multiplyScalar(_globeScale.x)
      .applyQuaternion(_globeRotQuat);
    _globeQuat.copy(globeLocal.quaternion).premultiply(_globeRotQuat);

    _timelinePos.set(
      timelineSlot.position.x + timelinePanRef.current,
      timelineSlot.position.y,
      timelineSlot.position.z
    );
    _timelineQuat.copy(timelineSlot.quaternion);

    _targetPos.lerpVectors(_globePos, _timelinePos, cardBlend);
    _targetQuat.slerpQuaternions(_globeQuat, _timelineQuat, cardBlend);

    groupRef.current.position.copy(_targetPos);
    groupRef.current.quaternion.copy(_targetQuat);

    const cardScale = THREE.MathUtils.lerp(
      1,
      timelineSlot.cardScale,
      cardBlend
    );
    groupRef.current.scale.set(cardScale, cardScale, 1);

    if (meshRef.current) {
      meshRef.current.renderOrder =
        globalBlend > 0.001 ? 10 + timelineSlot.sortIndex : 0;
    }

    const targetOpacity = visible ? 1 : 0;
    const step = reducedMotion ? 1 : 0.06;
    opacityRef.current += (targetOpacity - opacityRef.current) * step;

    if (imageMatRef.current) {
      imageMatRef.current.opacity = opacityRef.current;
      imageMatRef.current.depthWrite = opacityRef.current > 0.95;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (suppressClickRef.current) return;
    if (visible && opacityRef.current > 0.5) onSelect(card);
  };

  return (
    <group ref={groupRef} onClick={handleClick}>
      <mesh
        ref={meshRef}
        onPointerOver={() => {
          if (visible) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <planeGeometry args={[card.width, card.height]} />
        <meshBasicMaterial
          ref={imageMatRef}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}
