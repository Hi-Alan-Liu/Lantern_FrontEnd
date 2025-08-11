// src/hooks/useLanternMeta.ts
import { useEffect, useState } from 'react';
import { getStyleList, getCategoryList } from '@/services/lanternService';
import type { Style, Category } from '@/types/lantern';
import {
  fallbackLanternStyles,
  fallbackWishCategories,
  normalize,
  asStyle,
  asCategory,
  type LanternStyle,
  type WishCategory,
} from '@/components/lantern/constants';

export type StyleVM = {
  id: LanternStyle;
  name: string;
  description?: string;
  points: number;
  gradient?: string;
  decoration?: string;
  shadowColor?: string;
};

export type CategoryVM = {
  id: WishCategory;
  name: string;
  description?: string;
  icon: any;
};

type State = {
  styles: StyleVM[];
  categories: CategoryVM[];
  loading: boolean;
  error: string | null;
};

export function useLanternMeta(): State {
  const [state, setState] = useState<State>({
    styles: [],
    categories: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setState(s => ({ ...s, loading: true, error: null }));

        const [styleRes, catRes] = await Promise.all([
          getStyleList({ page: 1, pageSize: 0 }),
          getCategoryList({ page: 1, pageSize: 0 }),
        ]);

        const stylesApi: StyleVM[] = (styleRes.dataList ?? [])
          .map((s: Style) => ({
            id: asStyle(normalize(s.name)),
            name: s.displayName,
            description: s.desc ?? undefined,
            gradient: s.gradient ?? undefined,
            decoration: s.name,
            shadowColor: s.shadowColor ?? undefined,
            points: s.point ?? 0,
          }))
          .filter(s => ['turtle', 'tiger', 'bird', 'rabbit'].includes(s.id));

        const fMap = new Map(fallbackLanternStyles.map(x => [x.id, x]));
        const stylesMerged =
          stylesApi.length > 0
            ? stylesApi.map(s => ({
                ...s
              }))
            : fallbackLanternStyles;

        const categoriesApi: CategoryVM[] = (catRes.dataList ?? []).map((c: Category) => {
          const id = asCategory(normalize(c.name));
          return {
            id,
            name: c.displayName,
            description: c.desc ?? undefined,
            icon: fallbackWishCategories.find(f => f.id === id)?.icon ?? fallbackWishCategories[0].icon,
          };
        });

        const categoriesMerged =
          categoriesApi.length > 0
            ? categoriesApi
            : fallbackWishCategories.map(x => ({
                id: x.id,
                name: x.name,
                description: x.description,
                icon: x.icon,
              }));

        if (!alive) return;
        setState({ styles: stylesMerged, categories: categoriesMerged, loading: false, error: null });
      } catch (e: any) {
        if (!alive) return;
        setState({
          styles: fallbackLanternStyles,
          categories: fallbackWishCategories.map(x => ({
            id: x.id,
            name: x.name,
            description: x.description,
            icon: x.icon,
          })),
          loading: false,
          error: e?.message ?? '載入樣式/類別失敗',
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
