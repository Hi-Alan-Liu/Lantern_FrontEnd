import React from 'react';
import { LanternStyle } from './constants';
// import turtleImage from 'figma:asset/77c01e84d3ea668a4a6bf174344e9ce607a71818.png';
// import tigerImage from 'figma:asset/c05a431ec7e88403afbb97ede2c2d8794edd850f.png';
// import birdImage from 'figma:asset/c24383adfb4b961f8f5083ecc7ff13f0b42afb10.png';

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
    <div className={`${sizeClasses} mx-auto ${size === 'small' ? 'lantern-float' : ''} ${className}`}>
      <img 
        src={imageSrc} 
        alt={`${style} lantern`}
        className="w-full h-full object-contain transform scale-[1.95]"
      />
    </div>
  );
}