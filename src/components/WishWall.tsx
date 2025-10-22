import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';
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

const normalize = (s?: string) => (s ?? '').toLowerCase().trim();
const validStyleIds = [...AVAILABLE_STYLE_KEYS] as LanternStyleKey[];
const XMIN = 5;
const XMAX = 95;
const randIn = (min: number, max: number) => min + Math.random() * (max - min);
const RISE_SPEED = 0.25;
const spawnBelow = (extra = 0) => 110 + 90 + extra;

interface FloatingLantern {
  id: string;
  x: number;
  y: number;
  style: LanternStyleKey;
  category: string;
  wish: string;
  tagline: string;
}

interface FloatingHeart {
  id: string;
  x: number;
  y: number;
}

export function WishWall({ onNavigate, userLanterns, userId, onLikeLantern }: WishWallProps) {
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [selectedLantern, setSelectedLantern] = useState<UserLantern | null>(null);
  const [activeApiLanterns, setActiveApiLanterns] = useState<FloatingLantern[]>([]);
  const [animatingUserLanterns, setAnimatingUserLanterns] = useState<UserLantern[]>([]);

  const apiPoolRef = useRef<FloatingLantern[]>([]);

  const totalLikes = userLanterns
    .filter(l => l.userId === userId)
    .reduce((sum, l) => sum + l.likes, 0);

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
          tagline: item.taglineText ?? '',
        }));
        if (alive) {
          apiPoolRef.current = mapped;
          setActiveApiLanterns(mapped.slice(0, 6));
        }
      } catch {
        console.warn('Fallback: using demo lanterns');
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => setAnimatingUserLanterns(userLanterns), [userLanterns]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveApiLanterns(prev =>
        prev.map(l => ({
          ...l,
          y: l.y - RISE_SPEED,
          ...(l.y < -10 && { y: spawnBelow(Math.random() * 10), x: randIn(XMIN, XMAX) }),
        })),
      );
      setAnimatingUserLanterns(prev =>
        prev.map(u => {
          const newY = u.position.y - 0.15;
          return newY < -25
            ? { ...u, position: { y: spawnBelow(20), x: randIn(XMIN, XMAX) } }
            : { ...u, position: { ...u.position, y: newY } };
        }),
      );
    }, 100);
    return () => clearInterval(timer);
  }, []);

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
          <h1 className="text-xl font-medium bg-gradient-to-r from-accent to-soft-orange bg-clip-text text-transparent">
            天燈星空牆
          </h1>
          <p className="text-sm text-muted-foreground">觀看滿天飛舞的願望</p>
        </div>
      </div>

      {/* 天燈們 */}
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
                className="w-16 h-20 relative transition-all duration-300 opacity-80 hover:opacity-100"
              >
                {/* 天燈主體 */}
                <LanternRenderer style={l.style} size="small" className="w-full h-full" />

                {/* 吊牌固定顯示 */}
                <div
                  className="absolute top-full mt-2 left-0 pointer-events-none"
                  style={{
                    transform: 'translate(-30%, -20px) scale(1.2)',
                    transformOrigin: 'top center',
                  }}
                >
                  <div className="relative inline-block">
                    <img src={tagBg} alt="tag background" className="w-[120px] h-auto" />
                    <span
                      className="absolute inset-0 flex items-center font-medium text-white leading-snug break-words"
                      style={{
                        fontSize: '8px',
                        textAlign: 'center',
                        position: 'relative',
                        top: '-36px',
                        paddingLeft: '20px',
                        paddingRight: '20px',
                        lineHeight: '1.3',
                      }}
                    >
                      {l.tagline}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* 使用者自己的天燈 */}
        {animatingUserLanterns.map(u => {
          const glow = getLanternGlowColor(u.style);
          return (
            <motion.div
              key={u.id}
              className="absolute cursor-pointer"
              style={{ left: `${u.position.x}%`, top: `${u.position.y}%` }}
              animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0], scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              onClick={() => setSelectedLantern(u)}
            >
              <motion.div
                className="absolute -inset-4 rounded-full blur-md"
                style={{ background: `radial-gradient(circle, ${glow}40 0%, transparent 60%)` }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <LanternRenderer style={u.style as LanternStyleKey} size="large" />
            </motion.div>
          );
        })}
      </div>

      {/* Dialog 願望詳情 */}
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
