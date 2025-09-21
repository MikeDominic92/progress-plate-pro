import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface RestTimerProps {
  onClose: () => void;
}

export const RestTimer = ({ onClose }: RestTimerProps) => {
  const [time, setTime] = useState(90); // 90 seconds default
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(90);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(time => time - 1);
      }, 1000);
    } else if (time === 0) {
      setIsRunning(false);
      // Haptic feedback simulation
      document.body.style.animation = 'pulse 0.3s ease-in-out';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 300);
    }

    return () => clearInterval(interval);
  }, [isRunning, time]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialTime - time) / initialTime) * 100;

  const presetTimes = [60, 90, 120, 180]; // 1min, 1.5min, 2min, 3min

  return (
    <Card className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50 bg-gradient-card/95 backdrop-blur-glass border-white/20 shadow-xl w-[calc(100vw-1rem)] max-w-xs sm:w-auto animate-slide-in">
      <CardContent className="p-3 sm:p-6 text-center space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="hidden sm:inline">Rest Timer</span>
            <span className="sm:hidden">Rest</span>
          </h3>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onClose}
            aria-label="Close rest timer"
            className="h-6 w-6 sm:h-8 sm:w-8 p-0 bg-destructive/20 hover:bg-destructive border-destructive/40 text-destructive-foreground hover:text-white transition-all duration-200 font-bold text-sm sm:text-lg"
          >
            ×
          </Button>
        </div>

        <div className="flex justify-center">
          <div className="relative" style={{ width: 100, height: 100 }}>
            <CircularProgress 
              percentage={progress} 
              size={100} 
              strokeWidth={6}
              showText={false}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-lg sm:text-2xl font-bold text-foreground">
                {formatTime(time)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-3 sm:mb-4">
          {presetTimes.map((preset) => (
            <Button
              key={preset}
              size="sm"
              variant="outline"
              onClick={() => {
                setTime(preset);
                setInitialTime(preset);
                setIsRunning(false);
              }}
              className="text-xs h-6 sm:h-8 bg-white/5 hover:bg-white/10 border-white/20 px-1 sm:px-2"
            >
              {preset}s
            </Button>
          ))}
        </div>

        <div className="flex gap-1 sm:gap-2 justify-center">
          <Button
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
            className="bg-gradient-primary hover:shadow-glow h-8 sm:h-10 px-2 sm:px-4"
          >
            {isRunning ? (
              <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Play className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTime(initialTime);
              setIsRunning(false);
            }}
            className="bg-white/5 hover:bg-white/10 border-white/20 h-8 sm:h-10 px-2 sm:px-4"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {time === 0 && (
          <div className="text-success font-semibold animate-pulse text-sm sm:text-base">
            Rest Complete! 💪
          </div>
        )}
      </CardContent>
    </Card>
  );
};