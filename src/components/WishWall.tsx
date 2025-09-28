import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Sparkles, MessageCircle, Gift, Frown, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { LanternRenderer } from './lantern/LanternRenderer';

import { getLanternList } from './lantern/lanternService';
import type { LanternDTO, LanternStyleKey, WishCategory } from './lantern/lantern';
import { AVAILABLE_STYLE_KEYS } from './lantern/constants';
import tagBg from '@/assets/tag-bg.png';

/* ---------- 反毒標語（用於隨機 tagline） ---------- */
const ANTI_DRUG_TAGLINES = [
  '要健康 不吸毒',
  '愛與陪伴 全民防毒',
  '遠離毒品 守護健康',
  '反毒新世代 幸福下一代',
  '彩色人生 拒絕毒品',
  '青春要舞台，毒品不要來',
  '毒品無底洞，終身不能碰',
  '堅定說不，毒品讓步',
  '堅持自己，拒絕毒來毒往',
  '食毒九輸，無毒才有我',
  '重視生命，拒絕毒害',
  '反毒好表現，行動是關鍵',
  '用愛牽起手，反毒不失守',
  '反毒好樣，健康好YOUNG！',
  '反毒雄讚',
  '青春不毒白',
  '拒絕「毒」、「賭」一生',
  '吸毒人生塗塗塗！',
] as const;

const pickRandomTagline = () =>
  ANTI_DRUG_TAGLINES[Math.floor(Math.random() * ANTI_DRUG_TAGLINES.length)];

/* ---------- 型別 ---------- */
interface UserLantern {
  id: string;
  style: string;
  category: string;
  content: string;
  timestamp: number;
  position: { x: number; y: number };
}

interface WishWallProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
  userLanterns: UserLantern[];
}

type CategoryKey = WishCategory;

interface FloatingLantern {
  id: string;
  x: number;          // 百分比（0~100）
  y: number;          // 百分比（0~100 以外也可，用於螢幕外）
  style: LanternStyleKey;
  category: string;
  wish: string;
  speed: number;
  categoryType: CategoryKey;
  tagline: string;
}

/* ---------- 初始 fallback 資料 ---------- */
const sampleWishes: Array<{ category: string; wish: string; type: CategoryKey }> = [
  { category: '許願',   wish: '希望家人身體健康平安', type: 'wish' },
  { category: '感謝',   wish: '謝謝你一直陪伴在我身邊', type: 'thanks' },
  { category: '傾訴',   wish: '最近工作壓力很大，但我會撐過去的', type: 'talk' },
  { category: '小小發洩', wish: '今天真的很累，想好好休息', type: 'vent' },
  { category: '其他',   wish: '今天是美好的一天', type: 'other' },
];

/* ---------- 小工具 ---------- */
const normalize = (s?: string) => (s ?? '').toLowerCase().trim();
const validStyleIds = [...AVAILABLE_STYLE_KEYS] as LanternStyleKey[];

/* 安全區（左右各 5%） */
const SAFE_MARGIN_X = 5;
const XMIN = SAFE_MARGIN_X;
const XMAX = 100 - SAFE_MARGIN_X;

/* 位置與碰撞輔助 */
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const randIn = (min: number, max: number) => min + Math.random() * (max - min);
const INIT_X_GAP = 10;
const INIT_Y_GAP = 10;
const MIN_DIST = Math.max(INIT_X_GAP, INIT_Y_GAP);
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/* === 統一上升速度：數值越大越快（每 100ms tick）=== */
const RISE_SPEED = 0;

/* === 生成從螢幕外開始的小工具 === */
const OFFSCREEN_Y_OFFSET = 0; // 讓 110 -> 110
const spawnBelow = (extra = 0) => 110 + OFFSCREEN_Y_OFFSET + extra;

/* === 模糊防重疊：可調參數（像素） === */
export const COLLISION_FUZZ_PX = 200; // 你可調整這個值

// 像素 -> 百分比（相對 viewport）
const pxToPercentX = (px: number) =>
  typeof window === 'undefined' ? 0 : (px / window.innerWidth) * 100;
const pxToPercentY = (px: number) =>
  typeof window === 'undefined' ? 0 : (px / window.innerHeight) * 100;

// 模糊矩形禁放區
const fuzzyOverlap = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const fx = pxToPercentX(COLLISION_FUZZ_PX);
  const fy = pxToPercentY(COLLISION_FUZZ_PX);
  return Math.abs(a.x - b.x) <= fx && Math.abs(a.y - b.y) <= fy;
};

/* 找不重疊的位置 */
const getInitialPosition = (existing: Array<{ x: number; y: number }>) => {
  let best: { x: number; y: number } | null = null;
  let bestMinD = -1;
  for (let tries = 0; tries < 160; tries++) {
    const candidate = { x: randIn(XMIN, XMAX), y: Math.random() * 100 };
    if (existing.length === 0) return candidate;

    const ok = existing.every(
      (p) => dist(p, candidate) > MIN_DIST && !fuzzyOverlap(p, candidate)
    );
    if (ok) return candidate;

    const minD = existing.reduce((m, p) => Math.min(m, dist(p, candidate)), Infinity);
    if (minD > bestMinD) {
      bestMinD = minD;
      best = candidate;
    }
  }
  return best ?? { x: randIn(XMIN, XMAX), y: Math.random() * 100 };
};

const toCategoryKey = (raw?: string): CategoryKey => {
  const code = normalize(raw);
  if (code === 'wish' || code === 'talk' || code === 'thanks' || code === 'vent' || code === 'other') return code;
  if (code.includes('願')) return 'wish';
  if (code.includes('訴') || code.includes('說')) return 'talk';
  if (code.includes('謝') || code.includes('恩')) return 'thanks';
  if (code.includes('洩') || code.includes('怨') || code.includes('怒')) return 'vent';
  return 'other';
};

const chooseSafeStyle = (raw?: string): LanternStyleKey => {
  const s = normalize(raw) as LanternStyleKey;
  return (validStyleIds as string[]).includes(s) ? s : ('turtle' as LanternStyleKey);
};

/* 將 API DTO 轉為 FloatingLantern（含 tagline 鍵修正） */
const toFloatingFromApi = (item: LanternDTO, i: number): FloatingLantern => {
  const any = item as any;
  const id = String(any.id ?? any.Id ?? `api-${i}`);
  const style = chooseSafeStyle(any.style ?? any.Style);
  const text = String(any.text ?? any.content ?? any.Content ?? '');
  const catDisplay = String(any.categoryName ?? any.CategoryName ?? any.category ?? any.Category ?? '其他');
  const catKey = toCategoryKey(any.category ?? any.Category ?? any.categoryName ?? any.CategoryName);
  const tagline =
    String(any.tagline ?? any.taglineText ?? any.Tagline ?? any.TaglineText ?? '') || pickRandomTagline();

  return {
    id: `lantern-${id}-${i}`,
    x: randIn(XMIN, XMAX),
    y: Math.random() * 100,
    style,
    category: catDisplay,
    wish: text,
    speed: RISE_SPEED,
    categoryType: catKey,
    tagline,
  };
};

/* ---------- 視覺 ---------- */
const getLanternGlowColor = (style: string) => {
  const glowColors: Record<string, string> = {
    turtle: '#4ade80', tiger: '#f97316', bird: '#06b6d4', sunflower: '#eab308',
    otter: '#8b5cf6', cat: '#ec4899', hedgehog: '#ef4444', rabbit: '#f59e0b', elephant: '#6366f1',
  };
  return glowColors[style] || '#ff8a65';
};

const CategoryIcon = (k: CategoryKey) => {
  switch (k) {
    case 'wish': return Sparkles;
    case 'talk': return MessageCircle;
    case 'thanks': return Gift;
    case 'vent': return Frown;
    default: return MoreHorizontal;
  }
};

/* ---------- 依螢幕寬度動態決定同時顯示天燈上限（3~9） ---------- */
const useViewportWidth = () => {
  const [w, setW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
    return () => {
      window.removeEventListener('resize', onR);
      window.removeEventListener('orientationchange', onR);
    };
  }, []);
  return w;
};

const computeMaxActiveByWidth = (vw: number) => {
  if (vw < 360) return 3;
  if (vw < 420) return 4;
  if (vw < 520) return 5;
  if (vw < 640) return 6;
  if (vw < 768) return 7;
  if (vw < 1024) return 8;
  return 9;
};

/* ========================================================================== */
/*                              WishWall Component                             */
/* ========================================================================== */
export function WishWall({ onNavigate, userLanterns }: WishWallProps) {
  const [hoveredLantern, setHoveredLantern] = useState<string | null>(null);

  // API「活動中的天燈」
  const [activeApiLanterns, setActiveApiLanterns] = useState<FloatingLantern[]>([]);
  // 使用者天燈（帶動畫位置）
  const [animatingUserLanterns, setAnimatingUserLanterns] = useState<UserLantern[]>([]);

  const viewportWidth = useViewportWidth();
  const maxActive = useMemo(() => computeMaxActiveByWidth(viewportWidth), [viewportWidth]);

  /* ---------------- Pool 與索引（循環佇列） ---------------- */
  const apiPoolRef = useRef<FloatingLantern[]>([]);
  const nextIndexRef = useRef<number>(0);

  /* ---------------- 1) 載入 API；初始化資料池 + 初始鋪滿 ---------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getLanternList({ page: 1, pageSize: 0 });
        const list: LanternDTO[] = res?.dataList ?? [];
        const mapped = list.map(toFloatingFromApi);

        if (!alive) return;

        if (mapped.length > 0) {
          apiPoolRef.current = mapped;
          const firstPlaced: FloatingLantern[] = [];
          mapped.slice(0, maxActive).forEach((l) => {
            const pos = getInitialPosition(firstPlaced);
            firstPlaced.push({ ...l, x: pos.x, y: pos.y + OFFSCREEN_Y_OFFSET });
          });
          setActiveApiLanterns(firstPlaced);
          nextIndexRef.current = Math.min(mapped.length, maxActive);
        } else {
          const fallbackPool: FloatingLantern[] = [];
          for (let i = 0; i < Math.max(maxActive, 14); i++) {
            const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
            const style = validStyleIds[Math.floor(Math.random() * validStyleIds.length)];
            fallbackPool.push({
              id: `fallback-pool-${i}`,
              x: randIn(XMIN, XMAX),
              y: Math.random() * 100,
              style,
              category: w.category,
              wish: w.wish,
              speed: RISE_SPEED,
              categoryType: w.type,
              tagline: pickRandomTagline(),
            });
          }
          apiPoolRef.current = fallbackPool;

          const firstPlaced: FloatingLantern[] = [];
          fallbackPool.slice(0, maxActive).forEach((l) => {
            const pos = getInitialPosition(firstPlaced);
            firstPlaced.push({ ...l, x: pos.x, y: pos.y + OFFSCREEN_Y_OFFSET });
          });
          setActiveApiLanterns(firstPlaced);
          nextIndexRef.current = Math.min(fallbackPool.length, maxActive);
        }
      } catch {
        if (!alive) return;
        const fallbackPool: FloatingLantern[] = [];
        for (let i = 0; i < Math.max(maxActive, 14); i++) {
          const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
          const style = validStyleIds[Math.floor(Math.random() * validStyleIds.length)];
          fallbackPool.push({
            id: `fallback-pool-${i}`,
            x: randIn(XMIN, XMAX),
            y: Math.random() * 100,
            style,
            category: w.category,
            wish: w.wish,
            speed: RISE_SPEED,
            categoryType: w.type,
            tagline: pickRandomTagline(),
          });
        }
        apiPoolRef.current = fallbackPool;

        const firstPlaced: FloatingLantern[] = [];
        fallbackPool.slice(0, maxActive).forEach((l) => {
          const pos = getInitialPosition(firstPlaced);
          firstPlaced.push({ ...l, x: pos.x, y: pos.y + OFFSCREEN_Y_OFFSET });
        });
        setActiveApiLanterns(firstPlaced);
        nextIndexRef.current = Math.min(fallbackPool.length, maxActive);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxActive]); // 視窗寬度變更 → 重新鋪滿

  /* ---------------- 2) 使用者天燈：進來時 clamp x 到安全區 ---------------- */
  useEffect(() => {
    setAnimatingUserLanterns(
      (userLanterns ?? []).map((l) => ({
        ...l,
        position: { x: clamp(l.position.x, XMIN, XMAX), y: l.position.y },
      }))
    );
  }, [userLanterns]);

  /* ---------------- 3) 根據「使用者優先」動態調整 API slots ---------------- */
  const visibleUserLanterns = useMemo(
    () => animatingUserLanterns.filter((u) => u.position.y > -20),
    [animatingUserLanterns]
  );
  const apiSlots = Math.max(0, maxActive - visibleUserLanterns.length);

  // apiSlots 變化時，補或裁減 activeApiLanterns
  useEffect(() => {
    setActiveApiLanterns((prev) => {
      const pool = apiPoolRef.current;
      if (pool.length === 0) return prev;

      if (prev.length === apiSlots) return prev;
      if (prev.length > apiSlots) {
        return prev.slice(0, apiSlots);
      }

      const need = apiSlots - prev.length;
      const added: FloatingLantern[] = [];
      for (let i = 0; i < need; i++) {
        const next = pool[nextIndexRef.current % pool.length];
        nextIndexRef.current = (nextIndexRef.current + 1) % pool.length;
        const pos = getInitialPosition([...prev, ...added]);
        added.push({
          ...next,
          x: pos.x,
          y: spawnBelow(Math.random() * 10),
          speed: RISE_SPEED,
        });
      }
      return [...prev, ...added];
    });
  }, [apiSlots, maxActive]);

  /* ---------------- 4) setInterval 迴圈（每 100ms 更新） ---------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveApiLanterns((prev) => {
        const pool = apiPoolRef.current;
        if (pool.length === 0) {
          return prev.map((l) => {
            const ny = l.y - RISE_SPEED;
            if (ny >= -10) {
              return { ...l, y: ny, x: clamp(l.x, XMIN, XMAX) };
            }
            const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
            return {
              ...l,
              y: spawnBelow(0),
              x: randIn(XMIN, XMAX),
              speed: RISE_SPEED,
              wish: l.wish?.trim() ? l.wish : w.wish,
              category: l.category?.trim() ? l.category : w.category,
              categoryType: l.categoryType ?? w.type,
              tagline: l.tagline ?? pickRandomTagline(),
            };
          });
        }

        const updated: FloatingLantern[] = [];
        for (let i = 0; i < prev.length; i++) {
          const l = prev[i];
          const ny = l.y - RISE_SPEED;

          if (ny >= -10) {
            updated.push({ ...l, y: ny, x: clamp(l.x, XMIN, XMAX) });
          } else {
            const next = pool[nextIndexRef.current % pool.length];
            nextIndexRef.current = (nextIndexRef.current + 1) % pool.length;

            const pos = getInitialPosition(updated);
            updated.push({
              ...next,
              x: pos.x,
              y: spawnBelow(Math.random() * 10),
              speed: RISE_SPEED,
            });
          }
        }
        return updated;
      });

      // 使用者天燈：自走 + 循環
      setAnimatingUserLanterns((prev) =>
        prev.map((u) => {
          const newY = u.position.y - RISE_SPEED;
          if (newY < -25) {
            return {
              ...u,
              position: { y: spawnBelow(Math.random() * 20), x: randIn(XMIN, XMAX) },
            };
          }
          return { ...u, position: { x: clamp(u.position.x, XMIN, XMAX), y: newY } };
        })
      );
    }, 100);

    return () => clearInterval(timer);
  }, []);

  /* ---------------- 5) 渲染 ---------------- */
  const visibleLanterns = activeApiLanterns;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="relative z-20 flex items-center justify-center p-4">
        <div className="text-center bg-card/20 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <h1 className="text-xl font-medium bg-gradient-to-r from-accent to-soft-orange bg-clip-text text-transparent">
              天燈星空牆
            </h1>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">觀看滿天飛舞的願望</p>
        </div>
      </div>

      {/* Floating Lanterns */}
      <div className="absolute inset-0 overflow-hidden">
        {visibleLanterns.map((lantern) => {
          const Icon = CategoryIcon(lantern.categoryType);
          const tipSide = lantern.x < 15 ? 'left' : lantern.x > 85 ? 'right' : 'center';
          const tipClass =
            tipSide === 'left'
              ? 'left-0 -translate-x-0'
              : tipSide === 'right'
              ? 'left-full -translate-x-full'
              : 'left-1/2 -translate-x-1/2';

          return (
            <motion.div
              key={lantern.id}
              className="absolute cursor-pointer -translate-x-1/2"
              style={{ left: `${lantern.x}%`, top: `${lantern.y}%` }}
              animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              onMouseEnter={() => setHoveredLantern(lantern.id)}
              onMouseLeave={() => setHoveredLantern(null)}
            >
              <div className="relative">
                <div
                  className={`w-16 h-20 relative transition-all duration-300 ${
                    hoveredLantern === lantern.id ? 'scale-125' : 'scale-100'
                  } opacity-80 hover:opacity-100`}
                >
                  <LanternRenderer style={lantern.style} size="small" className="w-full h-full" />

                  {hoveredLantern === lantern.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`absolute -top-20 ${tipClass} bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4 w-64 sm:w-72 md:w-80 text-sm text-center shadow-xl z-50`}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-accent" />
                        <p className="text-accent font-medium">{lantern.category}</p>
                      </div>
                      <p className="text-foreground leading-relaxed">{lantern.wish}</p>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border/50 rotate-45" />
                    </motion.div>
                  )}

                  {/* Tagline badge */}
                  <div
                    className="absolute top-full mt-2 left-0 pointer-events-none"
                    style={{
                      transform: 'translate(-30%, -20px) scale(1.2)', // 放大 1.2 倍，並往上 10px
                      transformOrigin: 'top center', // 確保放大以吊牌頂部為基準
                    }}
                  >
                    <div className="relative inline-block">
                      <img src={tagBg} alt="tag background" className="w-[120px] h-auto" />
                  <span
                    className="absolute inset-0 flex items-center font-medium text-white leading-snug break-words"
                    style={{
                      fontSize: '7px',
                      textAlign: 'center',
                      position: 'relative',
                      top: '-37px',       // 👈 控制上下位置
                      paddingLeft: '20px', // 👈 左邊縮進
                      paddingRight: '20px',// 👈 右邊縮進
                      lineHeight: '1.3',  // 👈 行距可調整
                    }}
                  >
                    {lantern.tagline}
                  </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* 使用者的特別天燈（優先顯示） */}
        {animatingUserLanterns
          .filter((u) => u.position.y > -20)
          .map((userLantern) => {
            const safeStyle = chooseSafeStyle(userLantern.style);
            const glowColor = getLanternGlowColor(safeStyle);

            return (
              <motion.div
                key={userLantern.id}
                className="absolute cursor-pointer"
                style={{ left: `${userLantern.position.x}%`, top: `${userLantern.position.y}%` }}
                animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0], scale: [1, 1.02, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.15 }}
                onMouseEnter={() => setHoveredLantern(userLantern.id)}
                onMouseLeave={() => setHoveredLantern(null)}
              >
                <div className="relative">
                  {/* Glow */}
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl pointer-events-none mix-blend-screen"
                    style={{
                      background: 'radial-gradient(circle, #ffffffb3 0%, transparent 70%)',
                      boxShadow: '0 0 24px #ffffff80',
                    }}
                    animate={{ scale: [1.3, 2, 1.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute -inset-4 rounded-full blur-md"
                    style={{ background: `radial-gradient(circle, ${glowColor}35 0%, transparent 60%)` }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full blur-sm opacity-30"
                    style={{ background: `linear-gradient(to top, ${glowColor}60 0%, transparent 100%)`, height: '150%', top: '0%' }}
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  {/* Lantern */}
                  <div
                    className={`w-20 h-25 relative transition-all duration-300 ${
                      hoveredLantern === userLantern.id ? 'scale-110' : 'scale-100'
                    } z-10`}
                  >
                    <LanternRenderer
                      style={safeStyle}
                      className="w-full h-full opacity-95"
                    />

                    {hoveredLantern === userLantern.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-28 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border-2 rounded-lg p-4 w-64 sm:w-72 md:w-80 text-sm text-center shadow-xl z-50"
                        style={{ borderColor: `${glowColor}60`, boxShadow: `0 0 25px ${glowColor}40, 0 0 50px ${glowColor}20` }}
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <motion.div className="w-2 h-2 rounded-full" style={{ backgroundColor: glowColor }}
                            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                          <p className="text-accent font-medium text-base">我的願望</p>
                          <motion.div className="w-2 h-2 rounded-full" style={{ backgroundColor: glowColor }}
                            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
                        </div>
                        <p className="text-foreground leading-relaxed font-medium">{userLantern.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(userLantern.timestamp).toLocaleDateString('zh-TW')}
                        </p>
                        <div
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card rotate-45"
                          style={{ borderRight: `1px solid ${glowColor}60`, borderBottom: `1px solid ${glowColor}60` }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* 小星火 */}
                  <motion.div className="absolute inset-0 pointer-events-none" animate={{ rotate: [0, 360] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{ backgroundColor: glowColor, left: `${20 + i * 20}%`, top: `${20 + i * 20}%` }}
                        animate={{ opacity: [0, 1, 0], scale: [0.3, 1.8, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6 }}
                      />
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Bottom */}
      <div className="relative z-10 mt-auto p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex flex-row gap-4 justify-center">
            <Button
              onClick={() => onNavigate('lantern-flow')}
              size="lg"
              className="flex-1 sm:flex-none px-4 sm:px-8 bg-gradient-to-r from-[#ff8a65] to-[#ffb74d] hover:from-[#ff7043] hover:to-[#ff9800]"
            >
              <span className="hidden sm:inline">我也要點燈</span>
              <span className="sm:hidden">點燈</span>
            </Button>

            <Button
              onClick={() => onNavigate('landing')}
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none px-4 sm:px-8 border-border/50 hover:border-accent/50"
            >
              <span className="hidden sm:inline">返回首頁</span>
              <span className="sm:hidden">首頁</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
