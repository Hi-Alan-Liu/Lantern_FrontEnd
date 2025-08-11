import type {
  ApiEnvelope, 
  BaseList, 
  TableQuery,
  Lantern, 
  CreateLanternRequest,
  Style, 
  Category
} from '@/types/lantern';


const API_BASE = 'https://lantern-api.zeabur.app';

function buildQuery(params?: TableQuery): string {
  const p = new URLSearchParams();
  if (params?.page && params.page > 0) p.set('Page', String(params.page));
  if (typeof params?.pageSize === 'number') p.set('PageSize', String(params.pageSize));
  if (params?.search) p.set('Search', params.search.trim());
  return p.toString();
}

// 取得類別清單
export async function getCategoryList(
  params: TableQuery = { page: 1, pageSize: 0 }
): Promise<BaseList<Category>> {
  const qs = buildQuery(params);
  const res = await fetch(`${API_BASE}/api/Category${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`GET /api/Category ${res.status}`);
  const json = (await res.json()) as ApiEnvelope<BaseList<Category>>;
  if (json.statusCode !== 200) throw new Error(json.message || 'getCategoryList error');
  return json.contents;
}

// 取得造型清單
export async function getStyleList(
  params: TableQuery = { page: 1, pageSize: 0 }
): Promise<BaseList<Style>> {
  const qs = buildQuery(params);
  const res = await fetch(`${API_BASE}/api/Style${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`GET /api/Style ${res.status}`);
  const json = (await res.json()) as ApiEnvelope<BaseList<Style>>;
  if (json.statusCode !== 200) throw new Error(json.message || 'getStyleList error');
  return json.contents;
}

// 取得天燈清單
export async function getLanternList(
  params: TableQuery = { page: 1, pageSize: 0 }
): Promise<BaseList<Lantern>> {
  const qs = buildQuery(params);
  const url = `${API_BASE}/api/lantern${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`GET /api/lantern failed: ${res.status}`);

  const json = (await res.json()) as ApiEnvelope<BaseList<Lantern>>;
  if (json.statusCode !== 200) {
    throw new Error(json.message || 'getLanternList error');
  }
  return json.contents;
}

/** 建立天燈 */
export async function createLantern(payload: CreateLanternRequest): Promise<Lantern> {
  const url = `${API_BASE}/api/user/lantern`;
  const existingUserId = localStorage.getItem('X-User-Id') || '';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(existingUserId && { 'X-User-Id': existingUserId }), // 有就帶上
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`POST /api/user/lantern failed: ${res.status}`);

  const newUserId = res.headers.get('X-User-Id');
  if (newUserId) {
    localStorage.setItem('X-User-Id', newUserId);
  }

  const json = (await res.json()) as ApiEnvelope<Lantern>;
  if (json.statusCode !== 200) {
    throw new Error(json.message || 'createLantern error');
  }
  return json.contents;
}