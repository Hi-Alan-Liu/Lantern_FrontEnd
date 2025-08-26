// ===== 後端 DTO（保持可能的命名）=====
export interface ApiEnvelope<T> {
  statusCode: number;
  message?: string;
  contents: T;
}

// -------- Paged ----------
export interface Paged<T> {
  totalCount: number;
  dataList: T[];
}

// -------- DTO from backend ----------
export interface StyleDTO {
  id: number;
  name?: string;
  displayName?: string;
  desc?: string;
  point?: number;
  gradient?: string;
  shadowColor?: string;
  code?: string;
}

export interface CategoryDTO {
  id: number;
  name?: string;
  displayName?: string;
  desc?: string;
  code?: string;
}

// -------- Lantern DTO ----------
// 後端回傳的天燈
export interface LanternDTO {
  id: number;
  style?: string;
  styleId?: number;
  category?: string;
  categoryId?: number;
  categoryName?: string;
  text?: string; 
  content?: string;
  createdAt?: string;
  userId?: number;
}

// 你原本前端用的 key
export type LanternStyleKey =
  | 'turtle' | 'tiger' | 'bird' | 'sunflower'
  | 'otter' | 'cat' | 'hedgehog' | 'rabbit' | 'elephant';

export type WishCategory = 'wish' | 'talk' | 'thanks' | 'vent' | 'other';