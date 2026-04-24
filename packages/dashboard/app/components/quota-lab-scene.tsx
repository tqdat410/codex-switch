'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { OrthographicCamera } from 'three';

import type { LabAccountItem } from '../../lib/quota-lab-view-model';
import { QuotaLabTube } from './quota-lab-tube';

interface QuotaLabSceneProps {
  items: LabAccountItem[];
}

const SCENE_HEIGHT = 430;
const CAMERA_ZOOM = 82;

export function QuotaLabScene({ items }: Readonly<QuotaLabSceneProps>) {
  const activeItem = items.find((item) => item.isActive) ?? items[0] ?? null;

  return (
    <div
      aria-label="Quota lab usage scene"
      style={{
        height: SCENE_HEIGHT,
        minHeight: 320,
        width: '100%',
      }}
    >
      <Canvas
        camera={{ far: 100, near: 0.1, position: [0, 0, 8], zoom: CAMERA_ZOOM }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        orthographic
        style={{ display: 'block' }}
      >
        <color args={['#020617']} attach="background" />
        <ambientLight intensity={0.72} />
        <directionalLight intensity={1.45} position={[3.2, 4.2, 5.5]} />
        <directionalLight intensity={0.35} position={[-4, 1, 3]} />
        <pointLight color="#38bdf8" intensity={0.75} position={[0, -1.35, 2.4]} />
        <ResponsiveCamera />
        <LabBackdrop />
        <BioreactorCradle hasTube={Boolean(activeItem)} />
        {activeItem ? <QuotaLabTube item={activeItem} /> : null}
      </Canvas>
    </div>
  );
}

function ResponsiveCamera() {
  const { camera, invalidate, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) {
      return;
    }

    camera.zoom = Math.max(58, Math.min(size.width / 4.6, size.height / 4.4, 96));
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, size.height, size.width]);

  return null;
}

function LabBackdrop() {
  return (
    <group position={[0, 0, -0.65]}>
      <mesh position={[0, 0.15, -0.08]}>
        <boxGeometry args={[5.2, 3.8, 0.08]} />
        <meshStandardMaterial color="#07111f" roughness={0.82} />
      </mesh>
      {[-1.7, -0.85, 0, 0.85, 1.7].map((x) => (
        <mesh key={`panel-x-${x}`} position={[x, 0.15, -0.02]}>
          <boxGeometry args={[0.014, 3.45, 0.018]} />
          <meshStandardMaterial color="#102033" metalness={0.2} roughness={0.62} />
        </mesh>
      ))}
      {[-1.2, -0.45, 0.3, 1.05].map((y) => (
        <mesh key={`panel-y-${y}`} position={[0, y, -0.01]}>
          <boxGeometry args={[4.75, 0.012, 0.018]} />
          <meshStandardMaterial color="#13283c" metalness={0.15} roughness={0.65} />
        </mesh>
      ))}
      <mesh position={[0, -1.75, 0.04]}>
        <boxGeometry args={[4.8, 0.26, 0.28]} />
        <meshStandardMaterial color="#0f172a" metalness={0.35} roughness={0.42} />
      </mesh>
      <mesh position={[0, -1.56, 0.12]}>
        <boxGeometry args={[2.2, 0.08, 0.18]} />
        <meshStandardMaterial color="#1e293b" metalness={0.45} roughness={0.32} />
      </mesh>
    </group>
  );
}

function BioreactorCradle({ hasTube }: Readonly<{ hasTube: boolean }>) {
  const glowColor = hasTube ? '#38bdf8' : '#64748b';

  return (
    <group position={[0, -1.38, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.86, 1.02, 0.18, 56]} />
        <meshStandardMaterial color="#334155" metalness={0.62} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.03, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.88, 0.025, 12, 72]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.3} />
      </mesh>
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.32, -0.02]}>
          <boxGeometry args={[0.22, 0.72, 0.2]} />
          <meshStandardMaterial color="#475569" metalness={0.58} roughness={0.36} />
        </mesh>
      ))}
    </group>
  );
}
