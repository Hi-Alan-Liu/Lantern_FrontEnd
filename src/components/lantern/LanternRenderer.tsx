import React from 'react';
import { LanternStyleKey } from './lantern';
import turtleImage from '@/assets/turtle.png';
import tigerImage from '@/assets/tiger.png';
import birdImage from '@/assets/bird.png';
import sunflowerImage from '@/assets/sunflower.png';
import otterImage from '@/assets/otter.png';
import catImage from '@/assets/cat.png';
import hedgehogImage from '@/assets/hedgehog.png';
import rabbitImage from '@/assets/rabbit.png';
import elephantImage from '@/assets/elephant.png';
import eagleImage from '@/assets/eagle.png';
import lionImage from '@/assets/lion.png';
import wolfImage from '@/assets/wolf.png';
import foxImage from '@/assets/fox.png';

interface LanternRendererProps {
  style: LanternStyleKey;
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
    case 'sunflower':
      imageSrc = sunflowerImage;
      break;
    case 'otter':
      imageSrc = otterImage;
      break;
    case 'cat':
      imageSrc = catImage;
      break;
    case 'hedgehog':
      imageSrc = hedgehogImage;
      break;
    case 'rabbit':
      imageSrc = rabbitImage;
      break;
    case 'elephant':
      imageSrc = elephantImage;
      break;
    case 'eagle':
      imageSrc = eagleImage;
      break;
    case 'lion':
      imageSrc = lionImage;
      break;
    case 'wolf':
      imageSrc = wolfImage;
      break;
    case 'fox':
      imageSrc = foxImage;
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
