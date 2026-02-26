import React, { useMemo } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
}

export const CircularProgress = React.memo(({
  percentage,
  size = 80,
  strokeWidth = 8,
  showText = true
}: CircularProgressProps) => {
  const progressStyles = useMemo(() => buildStyles({
    textSize: '16px',
    pathColor: 'hsl(340 82% 66%)',
    textColor: 'hsl(0 0% 98%)',
    trailColor: 'hsl(230 15% 12%)',
    backgroundColor: 'transparent',
    strokeLinecap: 'round',
    pathTransitionDuration: 0.8,
  }), []);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <CircularProgressbar
        value={percentage}
        text={showText ? `${Math.round(percentage)}%` : ''}
        styles={progressStyles}
        strokeWidth={strokeWidth}
      />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
    </div>
  );
});