import React from 'react';
import { LanternStyle } from './constants';
import turtleImage from '@/assets/turtle.png';
import tigerImage from '@/assets/tiger.png';
import birdImage from '@/assets/bird.png';
import rabbitImage from '@/assets/rabbit.png';

interface LanternRendererProps {
  style: LanternStyle;
  size?: 'small' | 'large';
  className?: string;
}

export function LanternRenderer({ style, size = 'small', className = '' }: LanternRendererProps) {
  const sizeClasses = size === 'large' ? 'w-32 h-40' : 'w-24 h-30';
  
  let imageSrc;
  switch (style) {
    case 'turtle':
      imageSrc = turtleImage;
      break;
    case 'tiger':
      imageSrc = tigerImage;
      break;
    case 'bird':
      imageSrc = birdImage;
      break;
    case 'rabbit':
      imageSrc = rabbitImage;
      break;
    default:
      imageSrc = turtleImage;
  }
  
  return (
    <div className={`${sizeClasses} mx-auto ${size === 'small' ? 'lantern-float' : ''} ${className}`}>
      <img 
        src={imageSrc} 
        alt={`${style} lantern`}
        className="w-full h-full object-contain transform scale-[1.95]"
      />
    </div>
  );
}