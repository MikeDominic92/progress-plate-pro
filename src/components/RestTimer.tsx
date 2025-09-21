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
    <Card className="fixed top-4 right-4 z-50 bg-gradient-card/95 backdrop-blur-glass border-white/20 shadow-xl max-w-xs animate-slide-in">
      <CardContent className="p-6 text-center space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Rest Timer
          </h3>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onClose}
            className="h-8 w-8 p-0 bg-destructive/20 hover:bg-destructive border-destructive/40 text-destructive-foreground hover:text-white transition-all duration-200 font-bold text-lg"
          >
            ×
          </Button>
        </div>

        <div className="flex justify-center">
          <CircularProgress 
            percentage={progress} 
            size={120} 
            strokeWidth={6}
            showText={false}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">
              {formatTime(time)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
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
              className="text-xs h-8 bg-white/5 hover:bg-white/10 border-white/20"
            >
              {preset}s
            </Button>
          ))}
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
            className="bg-gradient-primary hover:shadow-glow"
          >
            {isRunning ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTime(initialTime);
              setIsRunning(false);
            }}
            className="bg-white/5 hover:bg-white/10 border-white/20"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {time === 0 && (
          <div className="text-success font-semibold animate-pulse">
            Rest Complete! 💪
          </div>
        )}
      </CardContent>
    </Card>
  );
};