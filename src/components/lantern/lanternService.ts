import { api } from './apiClient';
import type { ApiEnvelope, Paged, StyleDTO, CategoryDTO, LanternDTO } from './lantern';

export async function getStyleList(): Promise<Paged<StyleDTO>> {
  const json = await api<ApiEnvelope<Paged<StyleDTO>>>(`/api/style`);
  if (json.statusCode !== 200) throw new Error(json.message || 'getStyleList error');
  return json.contents;
}

export async function getCategoryList(): Promise<Paged<CategoryDTO>> {
  const json = await api<ApiEnvelope<Paged<CategoryDTO>>>(`/api/category`);
  if (json.statusCode !== 200) throw new Error(json.message || 'getCategoryList error');
  return json.contents;
}

export async function createLantern(body: { styleId: number; categoryId: number; text: string }) {
  const json = await api<ApiEnvelope<number>>(`/api/user/lantern`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (json.statusCode !== 200) throw new Error(json.message || 'createLantern error');
  return json.contents;
}

/** 取得天燈清單（包含 TotalLike） */
export async function getLanternList(params: { page: number; pageSize: number }): Promise<Paged<LanternDTO> & { totalLike?: number }> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('pageSize', String(params.pageSize));

  const json = await api<ApiEnvelope<Paged<LanternDTO>>>(`/api/lantern?${qs.toString()}`);
  if (json.statusCode !== 200) throw new Error(json.message || 'getLanternList error');
  return json.contents;
}

/** 按讚 / 取消讚 */
export async function toggleLanternLike(id: string): Promise<boolean> {
  const json = await api<ApiEnvelope<null>>(`/api/lantern/${id}/like`, {
    method: 'POST',
  });
  if (json.statusCode !== 200) throw new Error(json.message || 'toggleLanternLike error');
  return true;
}
