import {
  LOWER_CHAMBER_BOTTOM,
  LOWER_CHAMBER_HEIGHT,
  PARTICLES,
  UPPER_CHAMBER_RADIUS,
  UPPER_CHAMBER_Y,
} from './quota-lab-tube-constants';

export function LowerLiquid({
  fill,
  color,
}: Readonly<{ fill: number; color: string }>) {
  if (fill <= 0) {
    return null;
  }

  const height = LOWER_CHAMBER_HEIGHT * fill;

  return (
    <group>
      <mesh position={[0, LOWER_CHAMBER_BOTTOM + height / 2, 0]}>
        <cylinderGeometry args={[0.31, 0.31, height, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          opacity={0.78}
          roughness={0.42}
          transparent
        />
      </mesh>
      <mesh position={[0, LOWER_CHAMBER_BOTTOM + height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.31, 0.31, 0.022, 48]} />
        <meshStandardMaterial color="#e0f2fe" opacity={0.34} transparent />
      </mesh>
    </group>
  );
}

export function UpperReservoir({
  fill,
  color,
}: Readonly<{ fill: number; color: string }>) {
  const visibleFill = Math.max(0.08, fill);

  return (
    <group position={[0, UPPER_CHAMBER_Y, 0]}>
      <mesh>
        <sphereGeometry args={[UPPER_CHAMBER_RADIUS, 48, 18]} />
        <meshPhysicalMaterial color="#dbeafe" opacity={0.16} roughness={0.05} transparent />
      </mesh>
      {fill > 0 ? (
        <mesh position={[0, -UPPER_CHAMBER_RADIUS * (1 - visibleFill), 0]} scale={[1, visibleFill, 1]}>
          <sphereGeometry args={[UPPER_CHAMBER_RADIUS * 0.76, 48, 18]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.24}
            opacity={0.78}
            roughness={0.36}
            transparent
          />
        </mesh>
      ) : null}
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.42, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
          opacity={0.32}
          transparent
        />
      </mesh>
    </group>
  );
}

export function SuspendedParticles({ color }: Readonly<{ color: string }>) {
  return (
    <group>
      {PARTICLES.map(([x, y, z]) => (
        <mesh key={`${x}-${y}-${z}`} position={[x, y, z]}>
          <sphereGeometry args={[0.026, 12, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

export function NoDataCore() {
  return (
    <mesh position={[0, -0.08, 0.04]}>
      <cylinderGeometry args={[0.12, 0.12, 1.55, 24]} />
      <meshStandardMaterial color="#94a3b8" opacity={0.22} roughness={0.6} transparent />
    </mesh>
  );
}
