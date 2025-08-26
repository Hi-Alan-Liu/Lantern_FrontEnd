import React from 'react';
import { LanternStyle } from './constants';
import turtleImage from '@/assets/119410796dbf217b520e3ff49127f06a9a97556a.png';
import tigerImage from '@/assets/286622944f4d946eee43a3e8b30fba7651a5c289.png';
import birdImage from '@/assets/b952c75101ea25b8f341fc27f8706bc1c5ee7b0f.png';
import sunflowerImage from '@/assets/17a67e69c60f1bd6e95de6eb161c80ff8d9fee66.png';
import otterImage from '@/assets/e1e646cbdd6f4424b56985ba6894ae2af2b1e23c.png';
import catImage from '@/assets/5e2d4c951cd954353ee1c6e6fa027373b321304f.png';
import hedgehogImage from '@/assets/346db09d1db72662e4e1fb9e52a74a167e72c4f9.png';
import rabbitImage from '@/assets/0f8c4820cc2c3965bbd2baf4d47b6fb46030dfb4.png';
import elephantImage from '@/assets/25fe6106c900c7c17f704b0008c6a6c3adbab290.png';

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