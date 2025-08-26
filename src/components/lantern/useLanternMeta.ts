import { useEffect, useRef, useState } from 'react';
import { getStyleList, getCategoryList } from './lanternService';
import { toStyle, toCategory } from './mappers';
import type { StyleDTO, CategoryDTO } from './lantern';

const cache = {
  styles: null as StyleDTO[] | null,
  categories: null as CategoryDTO[] | null,
};

export function useLanternMeta() {
  const [styles, setStyles] = useState<StyleDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        setLoading(true);

        if (!cache.styles || !cache.categories) {
          const [s, c] = await Promise.all([
            getStyleList(),
            getCategoryList(),
          ]);
          cache.styles = (s.dataList ?? []).map(toStyle);
          cache.categories = (c.dataList ?? []).map(toCategory);
        }

        if (mounted.current) {
          setStyles(cache.styles!);
          setCategories(cache.categories!);
          setErr(null);
        }
      } catch (e:any) {
        if (mounted.current) setErr(e.message ?? '載入失敗');
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();
    return () => { mounted.current = false; };
  }, []);

  return { styles, categories, loading, error };
}
