import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
}

export const CircularProgress = ({ 
  percentage, 
  size = 80, 
  strokeWidth = 8,
  showText = true 
}: CircularProgressProps) => {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <CircularProgressbar
        value={percentage}
        text={showText ? `${Math.round(percentage)}%` : ''}
        styles={buildStyles({
          textSize: '16px',
          pathColor: 'hsl(24 95% 53%)',
          textColor: 'hsl(0 0% 98%)',
          trailColor: 'hsl(216 15% 10%)',
          backgroundColor: 'transparent',
          strokeLinecap: 'round',
          pathTransitionDuration: 0.8,
        })}
        strokeWidth={strokeWidth}
      />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
    </div>
  );
};