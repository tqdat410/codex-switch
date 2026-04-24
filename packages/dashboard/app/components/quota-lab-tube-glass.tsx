import { DoubleSide } from 'three';
import {
  GLASS_CAPS,
  SHELL_HEIGHT,
  SHELL_RADIUS,
} from './quota-lab-tube-constants';

export function GlassCapsule({ shellColor }: Readonly<{ shellColor: string }>) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[SHELL_RADIUS, SHELL_RADIUS, SHELL_HEIGHT, 64, 1, true]} />
        <meshPhysicalMaterial
          color={shellColor}
          ior={1.45}
          opacity={0.18}
          roughness={0.04}
          side={DoubleSide}
          thickness={0.45}
          transparent
          transmission={0.72}
        />
      </mesh>
      {GLASS_CAPS.map(([y, rotation]) => (
        <mesh key={y} position={[0, y, 0]} rotation={[rotation, 0, 0]}>
          <sphereGeometry args={[SHELL_RADIUS, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color={shellColor}
            ior={1.45}
            opacity={0.2}
            roughness={0.04}
            thickness={0.3}
            transparent
            transmission={0.68}
          />
        </mesh>
      ))}
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, 0, 0.42]}>
          <boxGeometry args={[0.025, 2.48, 0.018]} />
          <meshStandardMaterial color="#eff6ff" emissive="#bae6fd" emissiveIntensity={0.12} />
        </mesh>
      ))}
    </group>
  );
}
