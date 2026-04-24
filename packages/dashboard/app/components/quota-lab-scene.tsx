'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { OrthographicCamera } from 'three';

import type { LabAccountItem } from '../../lib/quota-lab-view-model';
import { QuotaLabTube } from './quota-lab-tube';

interface QuotaLabSceneProps {
  items: LabAccountItem[];
}

const CELL_WIDTH = 2.8;
const CELL_HEIGHT = 2.7;

export function QuotaLabScene({ items }: QuotaLabSceneProps) {
  const frame = getSceneFrame(items);

  return (
    <div
      aria-label="Quota lab usage scene"
      style={{
        height: frame.containerHeight,
        minHeight: 280,
        width: '100%',
      }}
    >
      <Canvas
        camera={{ far: 100, near: 0.1, position: [0, 0, 8], zoom: frame.zoom }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        orthographic
        style={{ display: 'block' }}
      >
        <color args={['#020617']} attach="background" />
        <ambientLight intensity={0.75} />
        <directionalLight intensity={1.25} position={[3, 4, 5]} />
        <directionalLight intensity={0.35} position={[-4, -2, 3]} />
        <ResponsiveCamera railWidth={frame.railWidth} rows={frame.rows} />

        <LabRails rows={frame.rows} width={frame.railWidth} />
        {items.map((item) => (
          <QuotaLabTube item={item} key={item.name} />
        ))}
      </Canvas>
    </div>
  );
}

function ResponsiveCamera({ railWidth, rows }: { railWidth: number; rows: number }) {
  const { camera, invalidate, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) {
      return;
    }

    const horizontalZoom = size.width / (railWidth + 1.2);
    const verticalZoom = size.height / (rows * CELL_HEIGHT + 1.2);
    camera.zoom = Math.max(22, Math.min(horizontalZoom, verticalZoom, 72));
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, railWidth, rows, size.height, size.width]);

  return null;
}

function LabRails({ rows, width }: { rows: number; width: number }) {
  return (
    <group position={[0, 0, -0.3]}>
      {Array.from({ length: rows }, (_, row) => {
        const y = ((rows - 1) / 2 - row) * CELL_HEIGHT;

        return (
          <group key={row}>
            <mesh position={[0, y - 1.1, 0]}>
              <boxGeometry args={[width, 0.12, 0.18]} />
              <meshStandardMaterial color="#1e293b" roughness={0.55} />
            </mesh>
            <mesh position={[0, y + 1.14, -0.08]}>
              <boxGeometry args={[width, 0.05, 0.06]} />
              <meshStandardMaterial color="#334155" metalness={0.15} roughness={0.42} />
            </mesh>
            <mesh position={[-width / 2, y, -0.04]}>
              <boxGeometry args={[0.08, 2.38, 0.08]} />
              <meshStandardMaterial color="#334155" metalness={0.15} roughness={0.42} />
            </mesh>
            <mesh position={[width / 2, y, -0.04]}>
              <boxGeometry args={[0.08, 2.38, 0.08]} />
              <meshStandardMaterial color="#334155" metalness={0.15} roughness={0.42} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function getSceneFrame(items: LabAccountItem[]) {
  const columns = Math.max(1, ...items.map((item) => item.layout.columns));
  const rows = Math.max(1, ...items.map((item) => item.layout.rows));
  const railWidth = Math.max(3.8, columns * CELL_WIDTH);
  const zoom = Math.max(38, 80 - rows * 7 - Math.max(0, columns - 3) * 4);

  return {
    containerHeight: Math.min(620, Math.max(280, rows * 172)),
    railWidth,
    rows,
    zoom,
  };
}
