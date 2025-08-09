import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Star, Sparkles, MessageCircle, Gift, Frown, MoreHorizontal } from 'lucide-react';
import { motion } from "framer-motion";
// import turtleImage from 'figma:asset/77c01e84d3ea668a4a6bf174344e9ce607a71818.png';
// import tigerImage from 'figma:asset/c05a431ec7e88403afbb97ede2c2d8794edd850f.png';
// import birdImage from 'figma:asset/c24383adfb4b961f8f5083ecc7ff13f0b42afb10.png';

interface WishWallProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
}

type LanternStyle = 'turtle' | 'tiger' | 'bird';

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
  { category: '小小發洩', wish: '為什麼生活總是這麼辛苦', type: 'vent' as const },
  { category: '其他', wish: '謝謝每一個給我溫暖的瞬間', type: 'other' as const },
  { category: '許願', wish: '希望能遇見對的人', type: 'wish' as const },
  { category: '感謝', wish: '感謝每一個幫助過我的人', type: 'thanks' as const },
  { category: '傾訴', wish: '想要更勇敢一點', type: 'talk' as const },
  { category: '許願', wish: '願所有動物都能被善待', type: 'wish' as const },
  { category: '其他', wish: '今天是美好的一天', type: 'other' as const },
];

const positiveMessages = [
  '每個願望都值得被聽見',
  '你的心意已經傳達到星空',
  '願温柔能治癒一切傷痛',
  '每一份情感都珍貴無比',
  '在這裡，你不會孤單',
  '讓星星見證你的美好',
];

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

  const getRandomLanternStyle = (): LanternStyle => {
    const styles: LanternStyle[] = ['turtle', 'tiger', 'bird'];
    return styles[Math.floor(Math.random() * styles.length)];
  };



  useEffect(() => {
    // Initialize floating lanterns
    const initialLanterns: FloatingLantern[] = Array.from({ length: 15 }, (_, i) => {
      const wish = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
      return {
        id: `lantern-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        style: getRandomLanternStyle(),
        category: wish.category,
        wish: wish.wish,
        categoryType: wish.type,
        speed: 0.1 + Math.random() * 0.2,
      };
    });
    setLanterns(initialLanterns);

    // Animation loop
    const animationInterval = setInterval(() => {
      setLanterns(prev => prev.map(lantern => ({
        ...lantern,
        y: lantern.y - lantern.speed,
        // Reset position when it goes off screen
        ...(lantern.y < -10 && {
          y: 110,
          x: Math.random() * 100,
          style: getRandomLanternStyle(),
          ...(function() {
            const newWish = sampleWishes[Math.floor(Math.random() * sampleWishes.length)];
            return {
              wish: newWish.wish,
              category: newWish.category,
              categoryType: newWish.type,
            };
          })(),
        }),
      })));
    }, 100);

    return () => clearInterval(animationInterval);
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
        
        <div className="w-24"></div> {/* Spacer for center alignment */}
      </div>

      {/* Floating Lanterns */}
      <div className="absolute inset-0 overflow-hidden">
        {lanterns.map((lantern) => {
          let imageSrc;
          switch (lantern.style) {
            case 'turtle':
              imageSrc = "turtleImage";
              break;
            case 'tiger':
              imageSrc = "tigerImage";
              break;
            case 'bird':
              imageSrc = "birdImage";
              break;
            default:
              imageSrc = "turtleImage";
          }
          
          return (
            <motion.div
              key={lantern.id}
              className="absolute cursor-pointer"
              style={{
                left: `${lantern.x}%`,
                top: `${lantern.y}%`,
              }}
              animate={{
                y: [0, -10, 0],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              onMouseEnter={() => setHoveredLantern(lantern.id)}
              onMouseLeave={() => setHoveredLantern(null)}
            >
              <div className="relative">
                {/* Main Lantern */}
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
                  
                  {/* Wish display on hover */}
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

      {/* Additional floating stars */}
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