import { CatmullRomCurve3, Vector3 } from 'three';
import {
  PORTS,
  SHELL_BOTTOM,
  TONE_COLORS,
} from './quota-lab-tube-constants';

export function Hardware({
  shellColor,
  requiresReauth,
}: Readonly<{ shellColor: string; requiresReauth: boolean }>) {
  return (
    <group>
      {[1.14, -1.1].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.48, 0.045, 14, 64]} />
          <meshStandardMaterial color="#64748b" metalness={0.72} roughness={0.28} />
        </mesh>
      ))}
      {PORTS.map(([x, y]) => (
        <group key={`${x}-${y}`} position={[x, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.095, 0.095, 0.28, 28]} />
            <meshStandardMaterial color="#475569" metalness={0.64} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.105, 24, 12]} />
            <meshStandardMaterial color={shellColor} emissive={shellColor} emissiveIntensity={0.12} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, SHELL_BOTTOM - 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.035, 12, 72]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.3} />
      </mesh>
      {requiresReauth ? (
        <mesh position={[0.62, 1.08, 0.08]}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial
            color={TONE_COLORS.reauth}
            emissive={TONE_COLORS.reauth}
            emissiveIntensity={0.34}
          />
        </mesh>
      ) : null}
    </group>
  );
}

export function ConnectorHoses({ toneColor }: Readonly<{ toneColor: string }>) {
  return (
    <group>
      <Hose points={[[-1.46, 0.55, -0.08], [-0.95, 0.72, 0.08], [-0.55, 0.28, 0]]} />
      <Hose points={[[1.46, 0.55, -0.08], [0.95, 0.72, 0.08], [0.55, 0.28, 0]]} />
      <Hose points={[[-1.28, -0.9, -0.05], [-0.82, -0.82, 0.07], [-0.55, -0.62, 0]]} />
      <Hose points={[[1.28, -0.9, -0.05], [0.82, -0.82, 0.07], [0.55, -0.62, 0]]} />
      {[-1.48, 1.48].map((x) => (
        <mesh key={x} position={[x, 0.55, -0.08]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.22, 28]} />
          <meshStandardMaterial color={toneColor} emissive={toneColor} emissiveIntensity={0.08} />
        </mesh>
      ))}
    </group>
  );
}

function Hose({ points }: Readonly<{ points: readonly (readonly [number, number, number])[] }>) {
  const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));

  return (
    <mesh>
      <tubeGeometry args={[curve, 24, 0.035, 10, false]} />
      <meshStandardMaterial color="#1e293b" metalness={0.15} roughness={0.48} />
    </mesh>
  );
}
