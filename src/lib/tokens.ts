/**
 * CAD & Spatial Architecture Design Tokens
 * Estética de alta fidelidade técnica: sem cores genéricas de IA, com contraste WCAG 2.1 AA rigoroso.
 */

export const CAD_COLORS = {
  cyan: '#00F0FF',
  cyanDim: '#00D1E0',
  sky: '#38BDF8',
  emerald: '#10B981',
  amber: '#F59E0B',
  amberBright: '#FCD34D',
  rose: '#F43F5E',
  bgDark: '#05070B',
  bgSurface: '#0B0E14',
  bgElevated: '#101520',
  borderDark: '#1E273A',
  borderSubtle: '#151D2C',
  textMuted: '#64748B',
  textSecondary: '#94A3B8',
  textPrimary: '#F8FAFC',
  laserGrid: '#00F0FF',
  laserSubGrid: '#38BDF8',
} as const;

export const DURATIONS = {
  instant: 0.15,
  fast: 0.25,
  normal: 0.45,
  cinematic: 0.85,
  monumental: 1.2,
} as const;

export const EASINGS = {
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOutExpo: 'cubic-bezier(0.87, 0, 0.13, 1)',
  subtleSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  gsapPower3Out: 'power3.out',
  gsapExpoOut: 'expo.out',
} as const;
