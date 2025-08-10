// 後端代碼型別
export type LanternStyleCode = 'turtle' | 'tiger' | 'bird' | 'rabbit';
export type CategoryCode = 'wish' | 'talk' | 'thanks' | 'vent' | 'other';

// 前端查詢參數（對應 DefaultTableRequest）
export interface TableQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

// 後端：清單包裝（BaseListQueryResponse<T>）
export interface BaseList<T> {
  totalCount: number;
  dataList: T[];
}

// 後端：外層包裝（DefaultResponse<T>）
export interface ApiEnvelope<T> {
  statusCode: number;
  message?: string | null;
  contents: T;
}

// 造型
export interface Style {
  id: number;
  name: string; 
  displayName: string;
  desc?: string | null;
  price: number;
  sortOrder: number;
}

// 類別
export interface Category {
  id: number;
  name: string;
  displayName: string;
  desc?: string | null;
  sortOrder: number;
}

// 天燈清單
export interface Lantern {
  id: number;
  styleId: number;
  style: string;
  styleName: string;
  categoryId: number;
  category: string;
  categoryName: string;
  text: string;
  createdAt: string;
}

// 建立天燈
export interface CreateLanternRequest {
  styleId: number;
  categoryId: number;
  text: string;
}