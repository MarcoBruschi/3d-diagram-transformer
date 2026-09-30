import { NodeType, NodeStatus } from './diagram';

export interface VisualConfig {
  color: string;
  glowColor: string;
  wireframeColor: string;
  emissiveIntensity: number;
  iconName: string;
  badgeLabel: string;
  defaultScale: number;
  roughness: number;
  metalness: number;
}

export interface StatusVisual {
  color: string;
  emissive: string;
  badgeBg: string;
  badgeText: string;
  pulseSpeed: number;
}

export type NodeVisualMap = Record<string, VisualConfig>;
export type StatusVisualMap = Record<NodeStatus, StatusVisual>;
