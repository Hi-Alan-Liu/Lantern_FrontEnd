import type { WishCategory, LanternStyleKey } from './lantern';
export type FlowStep = 'style' | 'category' | 'content' | 'confirm' | 'animation' | 'complete';

export const suggestionTexts: Record<WishCategory, string[]> = {
  wish: ['願家人健康', '願心想事成', '願我更勇敢'],
  talk: ['最近壓力有點大', '我想被理解', '我需要休息'],
  thanks: ['感謝一路陪伴', '謝謝今天的陽光', '謝謝自己'],
  vent: ['今天真的很累', '我需要宣洩一下', '心情有點悶'],
  other: ['保持初心', '珍惜當下', '明天會更好'],
} as const;

export const AVAILABLE_STYLE_KEYS: readonly LanternStyleKey[] = [
  'turtle','tiger','bird','sunflower','otter','cat','hedgehog','rabbit','elephant'
] as const;
