import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Sparkles, MessageCircle, Gift, Frown, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { LanternRenderer } from './lantern/LanternRenderer';

import { getLanternList } from './lantern/lanternService';
import type { LanternDTO, LanternStyleKey, WishCategory } from './lantern/lantern';
import { AVAILABLE_STYLE_KEYS } from './lantern/constants';

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
  '青春要舞台，毒品不要來',
  '青春不毒白',
  '拒絕「毒」、「賭」一生',
  '吸毒人生塗塗塗！',
  '堅定說不，毒品讓步',
  '毒品無底洞，終身不能碰',
  '染毒一生，孤獨一生',
  '拒絕毒品，你我做起',
  '邪惡毒品愛KO',
] as const;

const pickRandomTagline = () =>
  ANTI_DRUG_TAGLINES[Math.floor(Math.random() * ANTI_DRUG_TAGLINES.length)];

interface UserLantern {
  id: string;
  style: string; // 使用者本地資料
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
  x: number;
  y: number;
  style: LanternStyleKey;
  category: string;   // 顯示用（可中文）
  wish: string;
  speed: number;      // 上升速度
  categoryType: CategoryKey;
  tagline: string;
}

/* ---------- Fallback（API 無資料/失敗時才用） ---------- */
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

/* ✅ 左右保留邊界（可自行調整） */
const SAFE_MARGIN_X = 5;   // 左右各 5%
const XMIN = SAFE_MARGIN_X;
const XMAX = 100 - SAFE_MARGIN_X;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const randIn = (min: number, max: number) => min + Math.random() * (max - min);

/* ✅ 初始鋪滿的最小間距（彼此避開 ±10%） */
const INIT_X_GAP = 10;   // 你原本誤寫成 100，我幫你修正回 10
const INIT_Y_GAP = 10;

/* ✅ 本頁同時顯示上限（包含使用者天燈） */
const MAX_ACTIVE = 9;

/** 初始鋪滿用：挑一個與已存在清單保持 X/Y 都大於最小間距的位置 */
const getInitialPosition = (existing: Array<{ x: number; y: number }>) => {
  for (let tries = 0; tries < 80; tries++) {
    const x = randIn(XMIN, XMAX);
    const y = Math.random() * 100; // 初始直接鋪在畫面 0~100%
    const ok = existing.every(p => Math.abs(p.x - x) > INIT_X_GAP && Math.abs(p.y - y) > INIT_Y_GAP);
    if (ok) return { x, y };
  }
  // fallback：如果一直找不到，就給一個安全區的隨機點
  return { x: randIn(XMIN, XMAX), y: Math.random() * 100 };
};

const toCategoryKey = (raw?: string): CategoryKey => {
  const code = normalize(raw);
  if (code === 'wish' || code === 'talk' || code === 'thanks' || code === 'vent' || code === 'other') return code;
  // 常見中文映射
  if (code.includes('願')) return 'wish';
  if (code.includes('訴') || code.includes('說')) return 'talk';
  if (code.includes('謝') || code.includes('恩')) return 'thanks';
  if (code.includes('洩') || code.includes('抱怨')) return 'vent';
  return 'other';
};

const chooseSafeStyle = (raw?: string): LanternStyleKey => {
  const s = normalize(raw) as LanternStyleKey;
  return (validStyleIds as string[]).includes(s) ? s : (validStyleIds[0] ?? 'turtle');
};

const toFloatingFromApi = (item: LanternDTO, i: number): FloatingLantern => {
  const any = item as any;
  const id = String(any.id ?? any.Id ?? `api-${i}`);
  const style = chooseSafeStyle(any.style ?? any.Style);
  const text = String(any.text ?? any.content ?? any.Content ?? '');
  const catDisplay = String(any.categoryName ?? any.CategoryName ?? any.category ?? any.Category ?? '其他');
  const catKey = toCategoryKey(any.category ?? any.Category ?? any.categoryName ?? any.CategoryName);
  const tagline = String(any.taglineText ?? any.taglineText ?? pickRandomTagline());

  return {
    id: `lantern-${id}-${i}`,
    x: randIn(XMIN, XMAX),         // 初始值會在鋪滿時被覆蓋；保險仍放安全區
    y: Math.random() * 100,
    style,
    category: catDisplay,
    wish: text,
    speed: 0.1 + Math.random() * 0.2,
    categoryType: catKey,
    tagline: tagline,
  };
};

export function WishWall({ onNavigate, userLanterns }: WishWallProps) {
  const [lanterns, setLanterns] = useState<FloatingLantern[]>([]);
  const [animatingUserLanterns, setAnimatingUserLanterns] = useState<UserLantern[]>([]);
  const [hoveredLantern, setHoveredLantern] = useState<string | null>(null);

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

  /* 1) 載入 API；失敗或為空 → fallback（初始鋪滿時彼此避開 ±10%） */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await getLanternList({ page: 1, pageSize: 0 });
        const list: LanternDTO[] = res?.dataList ?? [];
        const mapped = list.map(toFloatingFromApi);   // 先轉型
        if (!alive) return;

        const firstPlaced: FloatingLantern[] = [];
        // 只擺到最多 MAX_ACTIVE（避免一開始就超過上限）
        mapped.slice(0, MAX_ACTIVE).forEach((l) => {
          const pos = getInitialPosition(firstPlaced);
          firstPlaced.push({ ...l, x: pos.x, y: pos.y });
        });

        if (firstPlaced.length) {
          setLanterns(firstPlaced);
        } else {
          // fallback
          const fallback: FloatingLantern[] = [];
          for (let i = 0; i < Math.min(14, MAX_ACTIVE); i++) {
            const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
            const style = validStyleIds[Math.floor(Math.random() * validStyleIds.length)];
            const pos = getInitialPosition(fallback);
            fallback.push({
              id: `fallback-${i}`,
              x: pos.x,
              y: pos.y,
              style,
              category: w.category,
              wish: w.wish,
              speed: 0.1 + Math.random() * 0.2,
              categoryType: w.type,
              tagline: pickRandomTagline(), 
            });
          }
          setLanterns(fallback);
        }
      } catch {
        if (!alive) return;
        const fallback: FloatingLantern[] = [];
        for (let i = 0; i < Math.min(14, MAX_ACTIVE); i++) {
          const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
          const style = validStyleIds[Math.floor(Math.random() * validStyleIds.length)];
          const pos = getInitialPosition(fallback);
          fallback.push({
            id: `fallback-${i}`,
            x: pos.x,
            y: pos.y,
            style,
            category: w.category,
            wish: w.wish,
            speed: 0.1 + Math.random() * 0.2,
            categoryType: w.type,
            tagline: pickRandomTagline(), 
          });
        }
        setLanterns(fallback);
      }
    })();

    return () => { alive = false; };
  }, []);

  /* 2) 使用者的特別天燈：把初始 x 也 clamp 到安全區 */
  useEffect(() => {
    setAnimatingUserLanterns(
      (userLanterns ?? []).map((l) => ({
        ...l,
        position: {
          x: clamp(l.position.x, XMIN, XMAX),
          y: l.position.y,
        },
      }))
    );
  }, [userLanterns]);

  /* 3) 動畫輪詢（循環 + 限制安全區） */
  useEffect(() => {
    const timer = setInterval(() => {
      // API / fallback 的天燈（數量不變，只做位移與重生）
      setLanterns((prev) =>
        prev.map((l) => {
          const ny = l.y - l.speed;
          if (ny >= -10) {
            return { ...l, y: ny, x: clamp(l.x, XMIN, XMAX) };
          }
          // 從底部重生（維持同一顆，數量不增加）
          const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
          return {
            ...l,
            y: 110,
            x: randIn(XMIN, XMAX),
            wish: l.wish?.trim() ? l.wish : w.wish,
            category: l.category?.trim() ? l.category : w.category,
            categoryType: l.categoryType ?? w.type,
            tagline: l.tagline ?? pickRandomTagline(),
          };
        })
      );

      // 使用者天燈（獨立於 API 天燈；渲染時一起限制總數）
      setAnimatingUserLanterns((prev) =>
        prev.map((u) => {
          const newY = u.position.y - 0.12;
          if (newY < -25) {
            return {
              ...u,
              position: { y: 110 + Math.random() * 20, x: randIn(XMIN, XMAX) },
            };
          }
          return {
            ...u,
            position: { x: clamp(u.position.x, XMIN, XMAX), y: newY },
          };
        })
      );
    }, 100);

    return () => clearInterval(timer);
  }, []);

  /* ---- 渲染時做總量上限：使用者優先，剩餘名額給 API/fallback ---- */
  const visibleUserLanterns = animatingUserLanterns.filter((u) => u.position.y > -20);
  const apiSlots = Math.max(0, MAX_ACTIVE - visibleUserLanterns.length);
  const visibleLanterns = lanterns.slice(0, apiSlots);

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

      {/* Floating Lanterns (API 優先 / fallback 次之；受 MAX_ACTIVE 限制) */}
      <div className="absolute inset-0 overflow-hidden">
        {visibleLanterns.map((lantern) => {
          const Icon = CategoryIcon(lantern.categoryType);
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
                      className="absolute -top-20 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4 w-64 sm:w-72 md:w-80 text-sm text-center shadow-xl z-50"
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <p className="text-accent font-medium">{lantern.category}</p>
                      </div>
                      <p className="text-foreground leading-relaxed">{lantern.wish}</p>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border/50 rotate-45" />
                    </motion.div>
                  )}
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 mt-1.5
                              px-1.5 py-[2px] rounded-xs border border-border/30
                              bg-card/80 backdrop-blur-sm shadow
                              text-xs leading-[1.1] text-white/85 text-center w-max"
                  >
                    {lantern.tagline}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* 使用者的特別天燈 */}
        {animatingUserLanterns
          .filter((u) => u.position.y > -20)
          .map((userLantern) => {
            const glowColor = getLanternGlowColor(userLantern.style);
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
                    className="absolute inset-0 rounded-full blur-lg pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${glowColor}70 0%, transparent 70%)`,
                      boxShadow: `0 0 18px ${glowColor}66`
                    }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
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
                      style={chooseSafeStyle(userLantern.style)}
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
                        style={{ backgroundColor: getLanternGlowColor(userLantern.style), left: `${20 + i * 20}%`, top: `${20 + i * 20}%` }}
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
