import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Star, Sparkles, MessageCircle, Gift, Frown, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import turtleImage from '@/assets/turtle.png';
import tigerImage from '@/assets/tiger.png';
import birdImage from '@/assets/bird.png';
import rabbitImage from '@/assets/rabbit.png';

import { getLanternList } from '@/services/lanternService';
import type { Lantern } from '@/types/lantern';

interface WishWallProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
}

type LanternStyle = 'turtle' | 'tiger' | 'bird' | 'rabbit';

interface FloatingLantern {
  id: string;
  x: number;
  y: number;
  style: LanternStyle;
  category: string; // 顯示名稱（後端 categoryName）
  wish: string;     // text
  speed: number;
  categoryType: 'wish' | 'talk' | 'thanks' | 'vent' | 'other';
}

const positiveMessages = [
  '每個願望都值得被聽見',
  '你的心意已經傳達到星空',
  '願温柔能治癒一切傷痛',
  '每一份情感都珍貴無比',
  '在這裡，你不會孤單',
  '讓星星見證你的美好',
];

// 代碼 -> 圖片
const styleImageMap: Record<LanternStyle, string> = {
  turtle: turtleImage,
  tiger: tigerImage,
  bird: birdImage,
  rabbit: rabbitImage,
};

const normalize = (s?: string) => s?.toLowerCase().trim() ?? '';

const toFloatingLantern = (it: Lantern, i: number): FloatingLantern => {
  const styleCode = normalize(it.style) as LanternStyle;
  const safeStyle: LanternStyle = (['turtle','tiger','bird','rabbit'] as const).includes(styleCode)
    ? styleCode
    : 'turtle';

  const catCode = normalize(it.category) as FloatingLantern['categoryType'];
  const safeCat: FloatingLantern['categoryType'] = (['wish','talk','thanks','vent','other'] as const).includes(catCode)
    ? catCode
    : 'other';

  return {
    id: `lantern-${it.id}-${i}`,
    x: Math.random() * 100,
    y: Math.random() * 100,
    style: safeStyle,
    category: it.categoryName, // 顯示中文/名稱
    wish: it.text,
    speed: 0.1 + Math.random() * 0.2,
    categoryType: safeCat,
  };
};

export function WishWall({ onNavigate }: WishWallProps) {
  const [lanterns, setLanterns] = useState<FloatingLantern[]>([]);
  const [hoveredLantern, setHoveredLantern] = useState<string | null>(null);

  const getCategoryIcon = (categoryType: 'wish' | 'talk' | 'thanks' | 'vent' | 'other') => {
    switch (categoryType) {
      case 'wish': return Sparkles;
      case 'talk': return MessageCircle;
      case 'thanks': return Gift;
      case 'vent': return Frown;
      case 'other': return MoreHorizontal;
      default: return Sparkles;
    }
  };

  useEffect(() => {
    let alive = true;

    // 讀取 API（PageSize=0 代表不分頁、全部撈）
    (async () => {
      try {
        const list = await getLanternList({ page: 1, pageSize: 0 });
        const mapped = list.dataList.slice(0, 30).map(toFloatingLantern); // 最多 30 顆避免太炸
        if (alive) setLanterns(mapped);
      } catch (err) {
        console.error('load lanterns failed:', err);
        if (alive) setLanterns([]); // 失敗就先空陣列（或可放 fallback）
      }
    })();

    // 動畫 loop（沿用你原本的做法）
    const animationInterval = setInterval(() => {
      setLanterns(prev => prev.map(l => ({
        ...l,
        y: l.y - l.speed,
        ...(l.y < -10 && {
          y: 110,
          x: Math.random() * 100,
        }),
      })));
    }, 100);

    return () => { alive = false; clearInterval(animationInterval); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate('landing')}
          className="text-muted-foreground hover:text-foreground bg-card/20 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首頁
        </Button>

        <div className="text-center">
          <h1 className="text-xl font-medium">天燈星空牆</h1>
          <p className="text-sm text-muted-foreground">觀看滿天飛舞的願望</p>
        </div>

        <div className="w-24"></div>
      </div>

      {/* Floating Lanterns */}
      <div className="absolute inset-0 overflow-hidden">
        {lanterns.map((lantern) => {
          const imageSrc = styleImageMap[lantern.style] ?? turtleImage;

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
                  <img
                    src={imageSrc}
                    alt={`${lantern.style} lantern`}
                    className="w-full h-full object-contain transform scale-[1.95]"
                  />

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
      </div>

      {/* Bottom Content */}
      <div className="relative z-10 mt-auto p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card/20 backdrop-blur-sm border border-border/30 rounded-lg p-6 mb-6">
            <Star className="w-8 h-8 mx-auto mb-4 text-accent" />
            <h2 className="text-lg mb-3">星空漫遊模式</h2>
            <p className="text-sm text-muted-foreground mb-4">
              將滑鼠移到天燈上，可以看見來自世界各地的溫暖心意
            </p>
            <p className="text-xs text-muted-foreground italic">
              "{positiveMessages[Math.floor(Math.random() * positiveMessages.length)]}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => onNavigate('lantern-flow')}
              size="lg"
              className="px-8 bg-gradient-to-r from-[#ff8a65] to-[#ffb74d] hover:from-[#ff7043] hover:to-[#ff9800]"
            >
              我也要點燈
            </Button>

            <Button
              onClick={() => onNavigate('landing')}
              variant="outline"
              size="lg"
              className="px-8 border-border/50 hover:border-accent/50"
            >
              返回首頁
            </Button>
          </div>
        </div>
      </div>

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full star-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}