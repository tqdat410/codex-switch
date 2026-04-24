import { DoubleSide } from 'three';

import type { LabAccountItem, QuotaTone } from '../../lib/quota-lab-view-model';

interface QuotaLabTubeProps {
  item: LabAccountItem;
}

const CYLINDER_HEIGHT = 1.35;
const CYLINDER_RADIUS = 0.24;
const CYLINDER_BOTTOM = -0.74;
const WEEKLY_RADIUS = 0.42;
const WEEKLY_Y = 0.62;

const TONE_COLORS: Record<QuotaTone, string> = {
  empty: '#94a3b8',
  healthy: '#22d3ee',
  warn: '#facc15',
  danger: '#fb7185',
  reauth: '#fb923c',
};

export function QuotaLabTube({ item }: QuotaLabTubeProps) {
  const weeklyFill = percentToFill(item.weekly.percent);
  const fiveHourFill = percentToFill(item.fiveHour.percent);
  const weeklyColor = TONE_COLORS[item.weekly.tone];
  const fiveHourColor = TONE_COLORS[item.fiveHour.tone];
  const shellColor = item.requiresReauth ? TONE_COLORS.reauth : '#cbd5e1';

  return (
    <group position={[item.layout.x, item.layout.y, 0]}>
      <mesh position={[0, WEEKLY_Y, 0]}>
        <sphereGeometry args={[WEEKLY_RADIUS, 32, 16]} />
        <meshPhysicalMaterial
          color={shellColor}
          opacity={0.22}
          roughness={0.08}
          metalness={0}
          transparent
          transmission={0.65}
        />
      </mesh>

      {weeklyFill > 0 ? (
        <mesh
          position={[0, WEEKLY_Y - WEEKLY_RADIUS * (1 - weeklyFill), 0]}
          scale={[1, Math.max(0.06, weeklyFill), 1]}
        >
          <sphereGeometry args={[WEEKLY_RADIUS * 0.72, 32, 16]} />
          <meshStandardMaterial
            color={weeklyColor}
            emissive={weeklyColor}
            emissiveIntensity={0.22}
            opacity={0.78}
            roughness={0.35}
            transparent
          />
        </mesh>
      ) : null}

      <mesh position={[0, CYLINDER_BOTTOM + CYLINDER_HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[CYLINDER_RADIUS, CYLINDER_RADIUS, CYLINDER_HEIGHT, 32, 1, true]}
        />
        <meshPhysicalMaterial
          color={shellColor}
          opacity={0.2}
          roughness={0.08}
          side={DoubleSide}
          transparent
          transmission={0.55}
        />
      </mesh>

      {fiveHourFill > 0 ? (
        <mesh
          position={[
            0,
            CYLINDER_BOTTOM + (CYLINDER_HEIGHT * fiveHourFill) / 2,
            0,
          ]}
        >
          <cylinderGeometry
            args={[
              CYLINDER_RADIUS * 0.7,
              CYLINDER_RADIUS * 0.7,
              CYLINDER_HEIGHT * fiveHourFill,
              32,
            ]}
          />
          <meshStandardMaterial
            color={fiveHourColor}
            emissive={fiveHourColor}
            emissiveIntensity={0.18}
            opacity={0.82}
            roughness={0.42}
            transparent
          />
        </mesh>
      ) : null}

      <mesh position={[0, CYLINDER_BOTTOM - 0.08, 0]}>
        <cylinderGeometry args={[0.38, 0.44, 0.14, 32]} />
        <meshStandardMaterial color="#475569" metalness={0.25} roughness={0.5} />
      </mesh>

      {item.isActive ? (
        <mesh position={[0, CYLINDER_BOTTOM - 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.48, 0.025, 12, 48]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={0.35}
          />
        </mesh>
      ) : null}

      {item.requiresReauth ? (
        <mesh position={[0.52, 0.72, 0.08]}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial
            color={TONE_COLORS.reauth}
            emissive={TONE_COLORS.reauth}
            emissiveIntensity={0.28}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function percentToFill(percent: number | null) {
  if (percent === null) {
    return 0;
  }

  return Math.min(1, Math.max(0, percent / 100));
}
