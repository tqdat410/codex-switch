'use client';

import { Canvas } from '@react-three/fiber';
import type { QuotaTone } from '../../lib/command-deck-view-model';

export function CommandDeckAmbientScene({
  accountCount,
  activeIndex,
  selectedTone,
}: Readonly<{
  accountCount: number;
  activeIndex: number;
  selectedTone: QuotaTone;
}>) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      orthographic
      camera={{ position: [0, 0, 12], zoom: 80 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 5]} intensity={1.5} />
      <DeckBackdrop selectedTone={selectedTone} />
      <MetricRails accountCount={accountCount} activeIndex={activeIndex} selectedTone={selectedTone} />
    </Canvas>
  );
}

function DeckBackdrop({ selectedTone }: Readonly<{ selectedTone: QuotaTone }>) {
  return (
    <group rotation={[0.2, -0.22, 0]}>
      <mesh position={[0, 0, -1.2]}>
        <boxGeometry args={[8.8, 5.2, 0.08]} />
        <meshStandardMaterial color="#132033" roughness={0.75} metalness={0.1} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.3, -0.2, -0.8]}>
        <boxGeometry args={[7.2, 3.7, 0.08]} />
        <meshStandardMaterial color={toneColor(selectedTone)} roughness={0.65} transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function MetricRails({
  accountCount,
  activeIndex,
  selectedTone,
}: Readonly<{ accountCount: number; activeIndex: number; selectedTone: QuotaTone }>) {
  const count = Math.min(Math.max(accountCount, 1), 12);
  const active = Math.max(0, Math.min(activeIndex, count - 1));

  return (
    <group rotation={[0.15, -0.25, 0]} position={[0, -2.15, 0]}>
      {Array.from({ length: count }, (_, index) => {
        const x = (index - (count - 1) / 2) * 0.56;
        const isActive = index === active;

        return (
          <mesh key={index} position={[x, isActive ? 0.22 : 0, isActive ? 0.3 : 0]}>
            <boxGeometry args={[0.34, isActive ? 0.9 : 0.5, 0.18]} />
            <meshStandardMaterial
              color={isActive ? toneColor(selectedTone) : '#30445f'}
              roughness={0.5}
              metalness={0.15}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function toneColor(tone: QuotaTone) {
  switch (tone) {
    case 'danger':
      return '#fb7185';
    case 'warn':
      return '#facc15';
    case 'reauth':
      return '#c4b5fd';
    case 'healthy':
      return '#6ee7b7';
    default:
      return '#93c5fd';
  }
}
