import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanternRenderer } from './lantern/LanternRenderer';
import { getLanternList } from './lantern/lanternService';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import tagBg from '@/assets/tag-bg.png';
import type { LanternDTO, LanternStyleKey, WishCategory } from './lantern/lantern';
import { AVAILABLE_STYLE_KEYS } from './lantern/constants';

interface UserLantern {
  id: string;
  userId: string;
  style: string;
  category: string;
  content: string;
  timestamp: number;
  position: { x: number; y: number };
  likes: number;
  likedBy: string[];
}

interface WishWallProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
  userLanterns: UserLantern[];
  userId: string;
  onLikeLantern: (lanternId: string) => void;
}

/* ===================== 常數與工具 ===================== */
const ANTI_DRUG_TAGLINES = [
  '要健康 不吸毒',
  '遠離毒品 守護健康',
  '彩色人生 拒絕毒品',
  '愛與陪伴 全民防毒',
  '青春要舞台，毒品不要來',
  '堅定說不，毒品讓步',
  '拒絕「毒」、「賭」一生',
  '重視生命，拒絕毒害',
  '用愛牽起手，反毒不失守',
] as const;

const pickRandomTagline = () =>
  ANTI_DRUG_TAGLINES[Math.floor(Math.random() * ANTI_DRUG_TAGLINES.length)];

type CategoryKey = WishCategory;

const normalize = (s?: string) => (s ?? '').toLowerCase().trim();
const validStyleIds = [...AVAILABLE_STYLE_KEYS] as LanternStyleKey[];
const XMIN = 5;
const XMAX = 95;
const randIn = (min: number, max: number) => min + Math.random() * (max - min);

const RISE_SPEED = 0.25;
const spawnBelow = (extra = 0) => 110 + 90 + extra;

/* ===================== 型別 ===================== */
interface FloatingLantern {
  id: string;
  x: number;
  y: number;
  style: LanternStyleKey;
  category: string;
  wish: string;
  speed: number;
  categoryType: CategoryKey;
  tagline: string;
}

interface FloatingHeart {
  id: string;
  x: number;
  y: number;
}

/* ===================== 主組件 ===================== */
export function WishWall({ onNavigate, userLanterns, userId, onLikeLantern }: WishWallProps) {
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [hoveredLantern, setHoveredLantern] = useState<string | null>(null);
  const [selectedLantern, setSelectedLantern] = useState<UserLantern | null>(null);

  const [activeApiLanterns, setActiveApiLanterns] = useState<FloatingLantern[]>([]);
  const [animatingUserLanterns, setAnimatingUserLanterns] = useState<UserLantern[]>([]);

  const apiPoolRef = useRef<FloatingLantern[]>([]);
  const nextIndexRef = useRef<number>(0);

  /* 計算使用者天燈總讚數 */
  const totalLikes = userLanterns
    .filter(l => l.userId === userId)
    .reduce((sum, l) => sum + l.likes, 0);

  /* 飄心效果 */
  const handleLikeLantern = (lanternId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const heartId = `heart-${Date.now()}`;
    setFloatingHearts(prev => [...prev, { id: heartId, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setFloatingHearts(prev => prev.filter(h => h.id !== heartId)), 1000);
    onLikeLantern(lanternId);
  };

  const getLanternGlowColor = (style: string) => {
    const glowColors: Record<string, string> = {
      turtle: '#4ade80',
      tiger: '#f97316',
      bird: '#06b6d4',
      sunflower: '#eab308',
      otter: '#8b5cf6',
      cat: '#ec4899',
      hedgehog: '#ef4444',
      rabbit: '#f59e0b',
      elephant: '#6366f1',
    };
    return glowColors[style] || '#ff8a65';
  };

  const chooseSafeStyle = (raw?: string): LanternStyleKey => {
    const s = normalize(raw) as LanternStyleKey;
    return validStyleIds.includes(s) ? s : ('turtle' as LanternStyleKey);
  };

  /* ============= 初始化載入 API 天燈 ============= */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getLanternList({ page: 1, pageSize: 0 });
        const list: LanternDTO[] = res?.dataList ?? [];
        const mapped: FloatingLantern[] = list.map((item, i) => ({
          id: `api-${i}`,
              x: randIn(XMIN, XMAX),
              y: Math.random() * 100,
          style: chooseSafeStyle(item.style),
          category: item.categoryName ?? '許願',
          wish: item.text ?? item.content ?? '',
              speed: RISE_SPEED,
          categoryType: 'wish',
              tagline: pickRandomTagline(),
        }));
        if (alive) {
          apiPoolRef.current = mapped;
          setActiveApiLanterns(mapped.slice(0, 6));
          nextIndexRef.current = 6;
        }
      } catch {
        console.warn('Fallback: using demo lanterns');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ============= 更新動畫位置 ============= */
  useEffect(() => {
    setAnimatingUserLanterns(userLanterns);
  }, [userLanterns]);

  useEffect(() => {
    const timer = setInterval(() => {
      // API 天燈上升
      setActiveApiLanterns(prev =>
        prev.map(l => ({
              ...l,
          y: l.y - RISE_SPEED,
          ...(l.y < -10 && {
            y: spawnBelow(Math.random() * 10),
              x: randIn(XMIN, XMAX),
            tagline: pickRandomTagline(),
          }),
        })),
      );

      // 使用者天燈上升
      setAnimatingUserLanterns(prev =>
        prev.map(u => {
          const newY = u.position.y - 0.15;
          if (newY < -25) {
            return { ...u, position: { y: spawnBelow(20), x: randIn(XMIN, XMAX) } };
          }
          return { ...u, position: { ...u.position, y: newY } };
        }),
      );
    }, 100);
    return () => clearInterval(timer);
  }, []);

  /* ================== UI ================== */
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 飄心動畫 */}
      <AnimatePresence>
        {floatingHearts.map(heart => (
          <motion.div
            key={heart.id}
            className="fixed pointer-events-none z-50"
            style={{ left: heart.x, top: heart.y }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5, y: -100 }}
            transition={{ duration: 1 }}
          >
            <Heart className="w-8 h-8 fill-pink-500 text-pink-500" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 左上角總讚數 */}
      <motion.div
        className="fixed top-3 left-3 z-50 bg-card/30 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-2 flex items-center gap-2"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
        <span className="text-lg font-medium">{totalLikes}</span>
      </motion.div>

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

      {/* 所有天燈 */}
      <div className="absolute inset-0 overflow-hidden">
        {activeApiLanterns.map(l => (
            <motion.div
            key={l.id}
              className="absolute cursor-pointer -translate-x-1/2"
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
              animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            onClick={() =>
              setSelectedLantern({
                id: l.id,
                userId: 'public',
                style: l.style,
                category: l.category,
                content: l.wish,
                timestamp: Date.now(),
                position: { x: l.x, y: l.y },
                likes: 0,
                likedBy: [],
              })
            }
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
                      top: '-36px',       // 👈 控制上下位置
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

      {/* 彈窗 Dialog 願望詳情 */}
      <Dialog open={!!selectedLantern} onOpenChange={(open: boolean) => !open && setSelectedLantern(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border" aria-describedby={undefined}>
          {selectedLantern && (
            <>
              <DialogTitle className="sr-only">{selectedLantern.category}</DialogTitle>
              <div className="text-center space-y-3">
                <LanternRenderer
                  style={selectedLantern.style as LanternStyleKey}
                  size="small"
                  className="mx-auto"
                />
                <h3 className="text-accent font-medium">{selectedLantern.category}</h3>
                <p className="text-foreground">{selectedLantern.content}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedLantern.timestamp).toLocaleDateString('zh-TW')}
                </p>
                {selectedLantern.userId !== userId && (
                  <Button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                      handleLikeLantern(selectedLantern.id, e)
                    }
                    disabled={selectedLantern.likedBy.includes(userId)}
                    className="w-full bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40"
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${
                        selectedLantern.likedBy.includes(userId)
                          ? 'fill-pink-500 text-pink-500'
                          : 'text-pink-400'
                      }`}
                    />
                    {selectedLantern.likedBy.includes(userId) ? '已按讚' : '喜歡這個天燈'}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 底部操作 */}
      <div className="relative z-10 mt-auto p-8">
          <div className="flex flex-row gap-4 justify-center">
            <Button
              onClick={() => onNavigate('lantern-flow')}
              size="lg"
            className="px-8 bg-gradient-to-r from-[#ff8a65] to-[#ffb74d]"
            >
            我也要點燈
            </Button>
            <Button
              onClick={() => onNavigate('landing')}
              variant="outline"
              size="lg"
            className="px-8"
            >
            返回首頁
            </Button>
        </div>
      </div>
    </div>
  );
}
