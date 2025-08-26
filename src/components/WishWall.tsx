import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Sparkles, MessageCircle, Gift, Frown, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { LanternRenderer } from './lantern/LanternRenderer';
import { lanternStyles, LanternStyle } from './lantern/constants';

import { getLanternList } from './lantern/lanternService';
import type { Lantern } from './lantern/lantern';

interface UserLantern {
  id: string;
  style: string;
  category: string;
  content: string;
  timestamp: number;
  position: { x: number; y: number; };
}

interface WishWallProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
  userLanterns: UserLantern[];
}

interface FloatingLantern {
  id: string;
  x: number;
  y: number;
  style: LanternStyle;
  category: string;
  wish: string;
  speed: number;
  categoryType: 'wish' | 'talk' | 'thanks' | 'vent' | 'other';
}

/** ------- Fallback 範例（API 無資料/失敗時才使用） ------- */
const sampleWishes = [
  { category: '許願', wish: '希望家人身體健康平安', type: 'wish' as const },
  { category: '感謝', wish: '謝謝你一直陪伴在我身邊', type: 'thanks' as const },
  { category: '傾訴', wish: '最近工作壓力很大，但我會撑過去的', type: 'talk' as const },
  { category: '許願', wish: '願世界和平，沒有戰爭', type: 'wish' as const },
  { category: '小小發洩', wish: '今天真的很累，想好好休息', type: 'vent' as const },
  { category: '感謝', wish: '感謝生命中所有美好的遇見', type: 'thanks' as const },
  { category: '許願', wish: '希望能找到真正適合的工作', type: 'wish' as const },
  { category: '傾訴', wish: '想念遠方的朋友們', type: 'talk' as const },
  { category: '感謝', wish: '謝謝過去的自己，很努力', type: 'thanks' as const },
  { category: '許願', wish: '願所有人都能被溫柔對待', type: 'wish' as const },
  { category: '傾訴', wish: '有時候覺得很孤單', type: 'talk' as const },
  { category: '感謝', wish: '感謝今天的陽光和微風', type: 'thanks' as const },
  { category: '許願', wish: '希望能勇敢追求自己的夢想', type: 'wish' as const },
  { category: '許願', wish: '願我有老虎般的勇氣面對困難', type: 'wish' as const },
  { category: '許願', wish: '希望能像小鳥一樣自由翱翔', type: 'wish' as const },
  { category: '感謝', wish: '感謝像烏龜般穩定守護我的人', type: 'thanks' as const },
  { category: '許願', wish: '希望如向日葵般積極向上', type: 'wish' as const },
  { category: '許願', wish: '願自己如水獺般快樂自在', type: 'wish' as const },
  { category: '感謝', wish: '感謝如貓咪般溫暖的陪伴', type: 'thanks' as const },
  { category: '許願', wish: '願自己如刺蝟般堅強勇敢', type: 'wish' as const },
  { category: '許願', wish: '希望保持如兔子般的純真', type: 'wish' as const },
  { category: '感謝', wish: '感謝如大象般智慧的指導', type: 'thanks' as const },
  { category: '小小發洩', wish: '為什麼生活總是這麼辛苦', type: 'vent' as const },
  { category: '其他', wish: '謝謝每一個給我溫暖的瞬間', type: 'other' as const },
  { category: '許願', wish: '希望能遇見對的人', type: 'wish' as const },
  { category: '感謝', wish: '感謝每一個幫助過我的人', type: 'thanks' as const },
  { category: '傾訴', wish: '想要更勇敢一點', type: 'talk' as const },
  { category: '許願', wish: '願所有動物都能被善待', type: 'wish' as const },
  { category: '其他', wish: '今天是美好的一天', type: 'other' as const },
];

/** ------- 工具 ------- */
const normalize = (s?: string) => s?.toLowerCase().trim() ?? '';
const validStyleIds = lanternStyles.map(s => s.id); // 由 constants 帶入所有合法 style id

const mapCategoryToType = (raw?: string): FloatingLantern['categoryType'] => {
  const code = normalize(raw);
  if (['wish','talk','thanks','vent','other'].includes(code)) return code as any;

  // 後端若是中文類型 -> 映射
  switch (code) {
    case '許願': return 'wish';
    case '傾訴': return 'talk';
    case '感謝': return 'thanks';
    case '小小發洩': return 'vent';
    case '其他': return 'other';
    default: return 'other';
  }
};

const toFloatingFromApi = (item: Lantern, i: number): FloatingLantern => {
  // 後端欄位假設：style、category、categoryName、text、id
  const rawStyle = normalize((item as any).style);
  const style = (validStyleIds as string[]).includes(rawStyle) ? (rawStyle as LanternStyle) : (validStyleIds[0] as LanternStyle);

  return {
    id: `lantern-${item.id}-${i}`,
    x: Math.random() * 100,
    y: Math.random() * 100,
    style,
    category: (item as any).categoryName ?? (item as any).category ?? '其他',
    wish: (item as any).text ?? '',
    speed: 0.1 + Math.random() * 0.2,
    categoryType: mapCategoryToType((item as any).category),
  };
};

export function WishWall({ onNavigate, userLanterns }: WishWallProps) {
  const [lanterns, setLanterns] = useState<FloatingLantern[]>([]);
  const [animatingUserLanterns, setAnimatingUserLanterns] = useState<UserLantern[]>([]);
  const [hoveredLantern, setHoveredLantern] = useState<string | null>(null);

  const getCategoryIcon = (categoryType: FloatingLantern['categoryType']) => {
    switch (categoryType) {
      case 'wish': return Sparkles;
      case 'talk': return MessageCircle;
      case 'thanks': return Gift;
      case 'vent': return Frown;
      case 'other': return MoreHorizontal;
      default: return Sparkles;
    }
  };

  const getLanternGlowColor = (style: string) => {
    const glowColors: { [key: string]: string } = {
      turtle: '#4ade80',    // 綠
      tiger: '#f97316',     // 橘
      bird: '#06b6d4',      // 青
      sunflower: '#eab308', // 黃
      otter: '#8b5cf6',     // 紫
      cat: '#ec4899',       // 粉
      hedgehog: '#ef4444',  // 紅
      rabbit: '#f59e0b',    // 琥珀
      elephant: '#6366f1',  // 靛藍
    };
    return glowColors[style] || '#ff8a65';
  };

  /** ✅ 1) 先嘗試從後端載入；失敗或為空時，用 sampleWishes 兜底 */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await getLanternList({ page: 1, pageSize: 0 });
        const list: Lantern[] = res?.dataList ?? [];
        const mapped = list.slice(0, 30).map(toFloatingFromApi);

        if (alive) {
          if (mapped.length > 0) {
            setLanterns(mapped);
          } else {
            // 後端沒資料 → 用 fallback
            const fallback = Array.from({ length: 12 }, (_, i) => {
              const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
              // 給一個合法 style
              const style = (validStyleIds[Math.floor(Math.random() * validStyleIds.length)] as LanternStyle);
              return {
                id: `fallback-${i}`,
                x: Math.random() * 100,
                y: Math.random() * 100,
                style,
                category: w.category,
                wish: w.wish,
                categoryType: mapCategoryToType(w.category),
                speed: 0.1 + Math.random() * 0.2,
              } as FloatingLantern;
            });
            setLanterns(fallback);
          }
        }
      } catch (err) {
        console.error('load lanterns failed:', err);
        if (alive) {
          // 載入失敗 → 用 fallback
          const fallback = Array.from({ length: 12 }, (_, i) => {
            const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
            const style = (validStyleIds[Math.floor(Math.random() * validStyleIds.length)] as LanternStyle);
            return {
              id: `fallback-${i}`,
              x: Math.random() * 100,
              y: Math.random() * 100,
              style,
              category: w.category,
              wish: w.wish,
              categoryType: mapCategoryToType(w.category),
              speed: 0.1 + Math.random() * 0.2,
            } as FloatingLantern;
          });
          setLanterns(fallback);
        }
      }
    })();

    return () => { alive = false; };
  }, []);

  /** ✅ 2) userLanterns 仍保留你傳入的資料來源（特別天燈） */
  useEffect(() => {
    setAnimatingUserLanterns(userLanterns.map(l => ({
      ...l,
      position: { ...l.position, y: l.position.y }
    })));
  }, [userLanterns]);

  /** 3) 動畫迴圈（沿用你的 setInterval 方案） */
  useEffect(() => {
    const timer = setInterval(() => {
      // 一般天燈
      setLanterns(prev => prev.map(l => ({
        ...l,
        y: l.y - l.speed,
        ...(l.y < -10 && {
          y: 110,
          x: Math.random() * 100,
          // 重生時隨機換一個願望（即使來自 API，也只在重生時隨機補文案）
          ...(function () {
            const w = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
            return {
              wish: l.wish?.trim() ? l.wish : w.wish, // 若原本有文案就保留，沒有才用備援
              category: l.category?.trim() ? l.category : w.category,
              categoryType: l.categoryType ?? mapCategoryToType(w.category),
            };
          })(),
        }),
      })));

      // 特別天燈（使用者）
      setAnimatingUserLanterns(prev => prev.map(u => {
        const newY = u.position.y - 0.12;
        if (newY < -25) {
          return {
            ...u,
            position: { y: 110 + Math.random() * 20, x: Math.random() * 80 + 10 }
          };
        }
        return { ...u, position: { ...u.position, y: newY } };
      }));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="relative z-20 flex items-center justify-center p-4">
        <div className="text-center bg-card/20 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <h1 className="text-xl font-medium bg-gradient-to-r from-accent to-soft-orange bg-clip-text text-transparent">
              天燈星空牆
            </h1>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          </div>
          <p className="text-sm text-muted-foreground">觀看滿天飛舞的願望</p>
        </div>
      </div>

      {/* Floating Lanterns (API 優先 / fallback 次之) */}
      <div className="absolute inset-0 overflow-hidden">
        {lanterns.map((lantern) => {
          return (
            <motion.div
              key={lantern.id}
              className="absolute cursor-pointer"
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
                      className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4 w-64 sm:w-72 md:w-80 text-sm text-center shadow-xl z-50"
                    >
                      <p className="text-accent font-medium mb-2 text-base">{lantern.category}</p>
                      <p className="text-foreground leading-relaxed">{lantern.wish}</p>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border/50 rotate-45" />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* 使用者的特別天燈 */}
        {animatingUserLanterns
          .filter(u => u.position.y > -20)
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
                    className="absolute inset-0 rounded-full blur-lg"
                    style={{ background: `radial-gradient(circle, ${glowColor}50 0%, transparent 70%)` }}
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
                      style={userLantern.style as LanternStyle}
                      size="medium"
                      className="w-full h-full opacity-95"
                    />

                    {hoveredLantern === userLantern.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-28 left-1/2 transform -translate-x-1/2 bg-card/95 backdrop-blur-sm border-2 rounded-lg p-4 w-64 sm:w-72 md:w-80 text-sm text-center shadow-xl z-50"
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
                          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-card rotate-45"
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
