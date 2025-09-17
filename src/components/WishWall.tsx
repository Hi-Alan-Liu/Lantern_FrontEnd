import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Sparkles, MessageCircle, Gift, Frown, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { LanternRenderer } from './lantern/LanternRenderer';

import { getLanternList } from './lantern/lanternService';
import type { LanternDTO, LanternStyleKey, WishCategory } from './lantern/lantern';
import { AVAILABLE_STYLE_KEYS } from './lantern/constants';

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
  style: string; // 入口仍允許 string，渲染前用 chooseSafeStyle 收斂
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
  x: number;          // 百分比座標（0~100）
  y: number;          // 百分比座標（0~100）
  style: LanternStyleKey;
  category: string;   // 顯示用（中文）
  wish: string;
  speed: number;      // 上升速度
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
const MAX_ACTIVE = 9; // 畫面同時顯示上限
const MIN_DIST = Math.max(INIT_X_GAP, INIT_Y_GAP);

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const getInitialPosition = (existing: Array<{ x: number; y: number }>) => {
  let best: { x: number; y: number } | null = null;
  let bestMinD = -1;
  for (let tries = 0; tries < 120; tries++) {
    const candidate = { x: randIn(XMIN, XMAX), y: Math.random() * 100 };
    if (existing.length === 0) return candidate;

    const ok = existing.every((p) => dist(p, candidate) > MIN_DIST);
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
  // 常見中文映射
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
    x: randIn(XMIN, XMAX),         // 初始會被鋪滿邏輯覆蓋；保險仍放安全區
    y: Math.random() * 100,
    style,
    category: catDisplay,
    wish: text,
    speed: 0.1 + Math.random() * 0.2,
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

/* === 生成從螢幕外開始（+100）的小工具 === */
const OFFSCREEN_Y_OFFSET = 80;
const spawnBelow = (extra = 0) => 110 + OFFSCREEN_Y_OFFSET + extra; // 210 + extra

/* ========================================================================== */
/*                              WishWall Component                             */
/* ========================================================================== */
export function WishWall({ onNavigate, userLanterns }: WishWallProps) {
  /* ---------------- React state ---------------- */
  const [hoveredLantern, setHoveredLantern] = useState<string | null>(null);

  // API「活動中的 1~9 顆」
  const [activeApiLanterns, setActiveApiLanterns] = useState<FloatingLantern[]>([]);
  // 使用者天燈（帶動畫位置）
  const [animatingUserLanterns, setAnimatingUserLanterns] = useState<UserLantern[]>([]);

  /* ---------------- Pool 與索引（循環佇列） ---------------- */
  const apiPoolRef = useRef<FloatingLantern[]>([]);  // API 回來的全量（例如 40）
  const nextIndexRef = useRef<number>(0);            // 下一筆要補進來的 index

  /* ---------------- 1) 載入 API；初始化資料池 + 初始鋪滿（y 從螢幕外開始） ---------------- */
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
          // 初始化活動 1~MAX_ACTIVE（y 加 OFFSCREEN_Y_OFFSET）
          const firstPlaced: FloatingLantern[] = [];
          mapped.slice(0, MAX_ACTIVE).forEach((l) => {
            const pos = getInitialPosition(firstPlaced);
            firstPlaced.push({ ...l, x: pos.x, y: pos.y + OFFSCREEN_Y_OFFSET });
          });
          setActiveApiLanterns(firstPlaced);
          nextIndexRef.current = Math.min(mapped.length, MAX_ACTIVE); // 從第 10 筆開始
        } else {
          // fallback 也走 pool + 初始
          const fallbackPool: FloatingLantern[] = [];
          for (let i = 0; i < Math.max(MAX_ACTIVE, 14); i++) {
            const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
            const style = validStyleIds[Math.floor(Math.random() * validStyleIds.length)];
            fallbackPool.push({
              id: `fallback-pool-${i}`,
              x: randIn(XMIN, XMAX),
              y: Math.random() * 100,
              style,
              category: w.category,
              wish: w.wish,
              speed: 0.1 + Math.random() * 0.2,
              categoryType: w.type,
              tagline: pickRandomTagline(),
            });
          }
          apiPoolRef.current = fallbackPool;

          const firstPlaced: FloatingLantern[] = [];
          fallbackPool.slice(0, MAX_ACTIVE).forEach((l) => {
            const pos = getInitialPosition(firstPlaced);
            firstPlaced.push({ ...l, x: pos.x, y: pos.y + OFFSCREEN_Y_OFFSET });
          });
          setActiveApiLanterns(firstPlaced);
          nextIndexRef.current = Math.min(fallbackPool.length, MAX_ACTIVE);
        }
      } catch {
        if (!alive) return;
        // fallback on error（同上）
        const fallbackPool: FloatingLantern[] = [];
        for (let i = 0; i < Math.max(MAX_ACTIVE, 14); i++) {
          const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
          const style = validStyleIds[Math.floor(Math.random() * validStyleIds.length)];
          fallbackPool.push({
            id: `fallback-pool-${i}`,
            x: randIn(XMIN, XMAX),
            y: Math.random() * 100,
            style,
            category: w.category,
            wish: w.wish,
            speed: 0.1 + Math.random() * 0.2,
            categoryType: w.type,
            tagline: pickRandomTagline(),
          });
        }
        apiPoolRef.current = fallbackPool;

        const firstPlaced: FloatingLantern[] = [];
        fallbackPool.slice(0, MAX_ACTIVE).forEach((l) => {
          const pos = getInitialPosition(firstPlaced);
          firstPlaced.push({ ...l, x: pos.x, y: pos.y + OFFSCREEN_Y_OFFSET });
        });
        setActiveApiLanterns(firstPlaced);
        nextIndexRef.current = Math.min(fallbackPool.length, MAX_ACTIVE);
      }
    })();
    return () => { alive = false; };
  }, []);

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
  const apiSlots = Math.max(0, MAX_ACTIVE - visibleUserLanterns.length);

  // apiSlots 變化時，補或裁減 activeApiLanterns（從 pool 取「下一筆」，y 從螢幕外）
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
          y: spawnBelow(Math.random() * 10), // 由 110~120 變成 210~220
          speed: next.speed ?? (0.1 + Math.random() * 0.2),
        });
      }
      return [...prev, ...added];
    });
  }, [apiSlots]);

  /* ---------------- 4) setInterval 迴圈（每 100ms 更新；離場重生從螢幕外） ---------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      // API 活動天燈：若離場，換「下一筆」補位（1→2→…→40→1）
      setActiveApiLanterns((prev) => {
        const pool = apiPoolRef.current;
        if (pool.length === 0) {
          // 沒 pool：維持原先重生邏輯，但 y 從螢幕外開始
          return prev.map((l) => {
            const ny = l.y - l.speed;
            if (ny >= -10) {
              return { ...l, y: ny, x: clamp(l.x, XMIN, XMAX) };
            }
            const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
            return {
              ...l,
              y: spawnBelow(0),          // 原本 110 → 210
              x: randIn(XMIN, XMAX),
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
          const ny = l.y - l.speed;

          if (ny >= -10) {
            updated.push({ ...l, y: ny, x: clamp(l.x, XMIN, XMAX) });
          } else {
            // 離場 → 從資料池取「下一筆」補位（循環佇列），y 從螢幕外
            const next = pool[nextIndexRef.current % pool.length];
            nextIndexRef.current = (nextIndexRef.current + 1) % pool.length;

            const pos = getInitialPosition(updated);
            updated.push({
              ...next,
              x: pos.x,
              y: spawnBelow(Math.random() * 10), // 原本 110~120 → 210~220
              speed: next.speed ?? (0.1 + Math.random() * 0.2),
            });
          }
        }
        return updated;
      });

      // 使用者天燈：自走 + 循環（重生時 y 從螢幕外）
      setAnimatingUserLanterns((prev) =>
        prev.map((u) => {
          const newY = u.position.y - 0.12;
          if (newY < -25) {
            return {
              ...u,
              position: { y: spawnBelow(Math.random() * 20), x: randIn(XMIN, XMAX) }, // 原本 110~130 → 210~230
            };
          }
          return { ...u, position: { x: clamp(u.position.x, XMIN, XMAX), y: newY } };
        })
      );
    }, 100);

    return () => clearInterval(timer);
  }, []);

  /* ---------------- 5) 渲染 ---------------- */
  const visibleLanterns = activeApiLanterns; // 已等於 apiSlots

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

          // Tooltip 溢出保護：左右兩側時改變錨點
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

                  {/* Tagline badge（防誤觸） */}
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 mt-1.5
                               px-1.5 py-[2px] rounded-xs border border-border/30
                               bg-card/80 backdrop-blur-sm shadow
                               text-xs leading-[1.1] text-white/85 text-center w-max
                               pointer-events-none"
                  >
                    {lantern.tagline}
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
