import type { QuotaTone } from '../../lib/quota-lab-view-model';

export const SHELL_HEIGHT = 2.78;
export const SHELL_RADIUS = 0.44;
export const SHELL_TOP = SHELL_HEIGHT / 2;
export const SHELL_BOTTOM = -SHELL_HEIGHT / 2;
export const LOWER_CHAMBER_HEIGHT = 1.38;
export const LOWER_CHAMBER_BOTTOM = -1.18;
export const UPPER_CHAMBER_Y = 0.82;
export const UPPER_CHAMBER_RADIUS = 0.34;

export const TONE_COLORS: Record<QuotaTone, string> = {
  empty: '#94a3b8',
  healthy: '#22d3ee',
  warn: '#facc15',
  danger: '#fb7185',
  reauth: '#fb923c',
};

export const PARTICLES = [
  [-0.16, -0.62, 0.18],
  [0.12, -0.34, 0.2],
  [-0.08, 0.08, 0.16],
  [0.17, 0.34, 0.17],
  [-0.18, 0.72, 0.14],
] as const;

export const PORTS = [
  [-0.55, 0.28],
  [0.55, 0.28],
  [-0.55, -0.62],
  [0.55, -0.62],
] as const;

export const GLASS_CAPS = [
  [SHELL_TOP, 0],
  [SHELL_BOTTOM, Math.PI],
] as const;
