import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface PointsDisplayProps {
  points: number;
  onGetMorePoints: () => void;
}

export function PointsDisplay({ points, onGetMorePoints }: PointsDisplayProps) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-2 right-2 md:top-6 md:right-6 z-50"
    >
      <div className="flex flex-col md:flex-row items-stretch gap-1.5 md:gap-3">
        {/* Points Display Card */}
        <motion.div
          className="relative bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-lg rounded-lg md:rounded-xl px-2 md:px-6 border border-primary/30 md:border-2 shadow-xl md:shadow-2xl overflow-hidden flex items-center"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          {/* Sparkle effects */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-accent rounded-full"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${30 + i * 20}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.7,
                }}
              />
            ))}
          </div>
          
          {/* Content */}
          <div className="relative flex items-center gap-1.5 md:gap-4 py-1.5 md:py-3">
            {/* Icon with glow */}
            <motion.div
              className="relative"
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.div
                className="absolute inset-0 bg-accent/40 rounded-full blur-sm md:blur-md"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              <Sparkles className="w-4 h-4 md:w-9 md:h-9 text-accent relative z-10" />
            </motion.div>
            
            {/* Points text */}
            <div className="flex flex-col justify-center items-start">
              <span className="text-[8px] md:text-xs text-muted-foreground uppercase tracking-wide md:tracking-wider leading-none mb-0.5 md:mb-1">
                我的點數
              </span>
              <motion.div
                key={points}
                initial={{ scale: 1.3, color: '#ff8a65' }}
                animate={{ scale: 1, color: '#e8eaf6' }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center"
              >
                <span className="text-lg md:text-3xl font-bold text-foreground leading-none">
                  {points}
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Get More Points Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-stretch"
        >
          <Button
            onClick={onGetMorePoints}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-lg md:rounded-xl px-2 md:px-6 py-1.5 md:py-3 shadow-md md:shadow-lg border-0 relative overflow-hidden group h-full"
          >
            {/* Button glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            
            {/* Button content */}
            <div className="relative flex items-center gap-1 md:gap-2 whitespace-nowrap">
              <Plus className="w-3.5 h-3.5 md:w-5 md:h-5" />
              <span className="text-xs md:text-base">獲得點數</span>
            </div>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
