// lantern.mappers.ts
import type { CategoryDTO, StyleDTO, LanternStyleKey, WishCategory } from './lantern';

/** 共用：標準化字串 */
export const normalize = (s?: string) => (s ?? '').toLowerCase().trim();

/** 前端 ViewModel 型別（給 UI 用） */
export interface Style {
  id: number;
  key: LanternStyleKey;       // 前端可渲染的樣式 key
  name: string;               // 顯示名稱
  description: string;
  points: number;
  gradient?: string;
  shadowColor?: string;
}

export interface Category {
  id: number;
  key: WishCategory;          // 前端標準類別 key
  name: string;               // 顯示名稱
  description: string;
}

/** 已知可渲染的樣式 key */
const KNOWN_STYLE_KEYS: LanternStyleKey[] = [
  'turtle','tiger','bird','sunflower','otter','cat','hedgehog','rabbit','elephant'
];

/** 把後端 StyleDTO 映射成前端可用的 key */
export function mapStyleKey(dto: StyleDTO): LanternStyleKey {
  // 優先用 code / name（有些後端會把英文 key 放在 name）
  const code = normalize((dto as any).code ?? dto.name ?? dto.displayName);
  if (KNOWN_STYLE_KEYS.includes(code as LanternStyleKey)) return code as LanternStyleKey;

  // 退回用 displayName/name 做關鍵字比對
  const name = normalize(dto.displayName ?? dto.name ?? '');
  if (/(turtle|龜|烏龜)/.test(name)) return 'turtle';
  if (/(tiger|虎|老虎)/.test(name)) return 'tiger';
  if (/(bird|鳥|小鳥)/.test(name)) return 'bird';
  if (/(sunflower|向日葵)/.test(name)) return 'sunflower';
  if (/(otter|水獺)/.test(name)) return 'otter';
  if (/(cat|貓)/.test(name)) return 'cat';
  if (/(hedgehog|刺蝟|刺猬)/.test(name)) return 'hedgehog';
  if (/(rabbit|兔|兔子)/.test(name)) return 'rabbit';
  if (/(elephant|大象)/.test(name)) return 'elephant';
  return 'turtle';
}

/** 後端 StyleDTO -> 前端 Style（UI 用） */
export function toStyle(dto: StyleDTO): Style {
  return {
    id: dto.id,
    key: mapStyleKey(dto),
    name: (dto.displayName ?? dto.name ?? '').trim() || '—',
    description: (dto.desc ?? (dto as any).description ?? '').trim(),
    points: (dto.point ?? (dto as any).points ?? 0) as number,
    gradient: dto.gradient ?? (dto as any).Gradient ?? undefined,
    shadowColor: dto.shadowColor ?? (dto as any).ShadowColor ?? 'rgba(0,0,0,0.2)',
  };
}

/** 把後端 CategoryDTO 映射成前端可用的 key */
export function mapCategoryKey(dto: CategoryDTO): WishCategory {
  const code = normalize(dto.code ?? dto.name ?? dto.displayName);
  if (['wish','talk','thanks','vent','other'].includes(code)) return code as WishCategory;

  const name = normalize(dto.displayName ?? dto.name ?? '');
  if (/(願|許願|祈願|wish)/.test(name)) return 'wish';
  if (/(傾訴|訴說|說說|分享|talk)/.test(name)) return 'talk';
  if (/(感謝|感恩|thanks)/.test(name)) return 'thanks';
  if (/(發洩|抱怨|vent)/.test(name)) return 'vent';
  return 'other';
}

/** 後端 CategoryDTO -> 前端 Category（UI 用） */
export function toCategory(dto: CategoryDTO): Category {
  return {
    id: dto.id,
    key: mapCategoryKey(dto),
    name: (dto.displayName ?? dto.name ?? '').trim() || '—',
    description: (dto.desc ?? (dto as any).description ?? '').trim(),
  };
}