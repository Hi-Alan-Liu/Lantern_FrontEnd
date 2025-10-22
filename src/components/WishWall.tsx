import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanternRenderer } from './lantern/LanternRenderer';
import { getLanternList, toggleLanternLike } from './lantern/lanternService';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import tagBg from '@/assets/tag-bg.png';
import type { LanternDTO, LanternStyleKey } from './lantern/lantern';
import { AVAILABLE_STYLE_KEYS } from './lantern/constants';

interface FloatingLantern {
  id: string;
  x: number;
  y: number;
  style: LanternStyleKey;
  category: string;
  wish: string;
  tagline: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
}

interface FloatingHeart {
  id: string;
  x: number;
  y: number;
}

export function WishWall({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [selectedLantern, setSelectedLantern] = useState<FloatingLantern | null>(null);
  const [activeLanterns, setActiveLanterns] = useState<FloatingLantern[]>([]);
  const [totalLikes, setTotalLikes] = useState<number>(0);

  const XMIN = 5;
  const XMAX = 95;
  const RISE_SPEED = 0.25;
  const randIn = (min: number, max: number) => min + Math.random() * (max - min);
  const spawnBelow = (extra = 0) => 110 + 90 + extra;

  const chooseSafeStyle = (raw?: string): LanternStyleKey => {
    const valid = [...AVAILABLE_STYLE_KEYS] as LanternStyleKey[];
    const s = (raw ?? '').toLowerCase().trim() as LanternStyleKey;
    return valid.includes(s) ? s : 'turtle';
  };

  // ✅ 初始化：抓取天燈清單
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getLanternList({ page: 1, pageSize: 0 });
        const list: LanternDTO[] = res?.dataList ?? [];

        const mapped: FloatingLantern[] = list.map((item, i) => ({
          id: `${item.id}`,
          x: randIn(XMIN, XMAX),
          y: Math.random() * 100,
          style: chooseSafeStyle(item.style),
          category: item.categoryName ?? '許願',
          wish: item.text ?? '',
          tagline: item.taglineText ?? '',
          likeCount: item.likeCount ?? 0,
          isLiked: item.isLiked ?? false,
          createdAt: item.createdAt ?? '',
        }));

        if (alive) {
          setActiveLanterns(mapped.slice(0, 8));
          // ✅ 總讚數取自所有 likeCount 加總
          const sum = mapped.reduce((s, l) => s + (l.likeCount ?? 0), 0);
          setTotalLikes(sum);
        }
      } catch (err) {
        console.error('getLanternList failed:', err);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ 飄動畫面更新
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLanterns(prev =>
        prev.map(l => ({
          ...l,
          y: l.y - RISE_SPEED,
          ...(l.y < -10 && { y: spawnBelow(Math.random() * 10), x: randIn(XMIN, XMAX) }),
        })),
      );
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // ✅ Dialog 關閉
  const handleDialogChange = (open: boolean) => {
    if (!open) setSelectedLantern(null);
  };

  // ✅ 點讚
  const handleLikeLantern = async (lanternId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const heartId = `heart-${Date.now()}`;
    setFloatingHearts(prev => [...prev, { id: heartId, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setFloatingHearts(prev => prev.filter(h => h.id !== heartId)), 1000);

    try {
      await toggleLanternLike(lanternId);

      // ✅ 更新當前天燈
      setActiveLanterns(prev =>
        prev.map(l =>
          l.id === lanternId
            ? {
                ...l,
                isLiked: true,
                likeCount: l.likeCount + 1,
              }
            : l,
        ),
      );

      // ✅ 更新 Dialog 畫面
      setSelectedLantern(prev =>
        prev
          ? {
              ...prev,
              isLiked: true,
              likeCount: prev.likeCount + 1,
            }
          : prev,
      );

      // ✅ 更新總讚數
      setTotalLikes(prev => prev + 1);
    } catch (err) {
      console.error('toggleLanternLike error:', err);
    }
  };

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

      {/* 總讚數 */}
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

      {/* 天燈清單 */}
      <div className="absolute inset-0 overflow-hidden">
        {activeLanterns.map(l => (
          <motion.div
            key={l.id}
            className="absolute cursor-pointer -translate-x-1/2"
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
            animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            onClick={() => setSelectedLantern(l)}
          >
            <div className="relative">
              <div className="w-16 h-20 relative opacity-80 hover:opacity-100 transition-all duration-300">
                <LanternRenderer style={l.style} size="small" className="w-full h-full" />

                {/* 吊牌 */}
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
      </div>

      {/* Dialog 願望詳情 */}
      <Dialog open={!!selectedLantern} onOpenChange={handleDialogChange}>
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
                <p className="text-foreground">{selectedLantern.wish}</p>
                {/* 🕓 留言時間 */}
                <p className="text-xs text-gray-400">
                  {(() => {
                    const d = new Date(selectedLantern.createdAt ?? Date.now());
                    return `${d.getFullYear()}年${(d.getMonth() + 1)
                      .toString()
                      .padStart(2, '0')}月${d.getDate().toString().padStart(2, '0')}日`;
                  })()}
                </p>

                <button
                  onClick={(e: any) => handleLikeLantern(selectedLantern.id, e)}
                  disabled={selectedLantern.isLiked}
                  className={`w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                    bg-gradient-to-r from-pink-500/20 to-red-500/20 
                    hover:from-pink-500/30 hover:to-red-500/30 
                    border border-pink-500/30 
                    transition-all duration-300 transform
                    hover:scale-[1.05] active:scale-[0.97]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      selectedLantern.isLiked
                        ? 'fill-pink-400 text-pink-400'
                        : 'text-pink-400'
                    }`}
                    style={{
                      fill: selectedLantern.isLiked ? 'var(--color-pink-400)' : 'none', // ✅ 手動覆蓋 Lucide 預設 fill="none"
                    }}
                  />
                  <span className="text-foreground">
                    {selectedLantern.isLiked ? '已按讚' : '喜歡這個天燈'}
                  </span>
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}