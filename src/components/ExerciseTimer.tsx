import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Timer, AlertTriangle } from 'lucide-react';

interface ExerciseTimerProps {
  duration: number; // in minutes
  onComplete: () => void;
  onStart: () => void;
  isActive: boolean;
  exerciseType: 'warmup' | 'main';
}

export const ExerciseTimer: React.FC<ExerciseTimerProps> = ({ 
  duration, 
  onComplete, 
  onStart, 
  isActive,
  exerciseType 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // convert to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsRunning(false);
      setTimeLeft(duration * 60);
      setHasStarted(false);
    }
  }, [isActive, duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  
  const isLowTime = timeLeft <= 120; // 2 minutes
  const isCriticalTime = timeLeft <= 60; // 1 minute

  const handleStart = () => {
    if (!hasStarted) {
      setHasStarted(true);
      onStart();
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setHasStarted(false);
  };

  const getTimerColor = () => {
    if (isCriticalTime) return 'bg-destructive/20 border-destructive text-destructive';
    if (isLowTime) return 'bg-warning/20 border-warning text-warning';
    if (progress > 50) return 'bg-accent/20 border-accent text-accent';
    return 'bg-success/20 border-success text-success';
  };

  const getProgressColor = () => {
    if (isCriticalTime) return 'bg-destructive';
    if (isLowTime) return 'bg-warning';
    if (progress > 50) return 'bg-accent';
    return 'bg-success';
  };

  if (!isActive) return null;

  return (
    <Card className={`mb-4 transition-all duration-300 ${getTimerColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Timer className={`h-5 w-5 ${isCriticalTime ? 'animate-pulse' : ''}`} />
            <span className="font-semibold">
              {exerciseType === 'warmup' ? 'Warm-up' : 'Exercise'} Timer
            </span>
            {isCriticalTime && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Low Time
              </Badge>
            )}
          </div>
          
          <div className="text-2xl font-mono font-bold">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="w-full h-3 bg-background/30 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex gap-2 justify-center">
          {!isRunning ? (
            <Button onClick={handleStart} variant="default" size="sm">
              <Play className="h-4 w-4 mr-2" />
              {hasStarted ? 'Resume' : 'Start'}
            </Button>
          ) : (
            <Button onClick={handlePause} variant="secondary" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          
          <Button onClick={handleReset} variant="outline" size="sm">
            <Square className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        
        {timeLeft === 0 && (
          <div className="text-center mt-3 p-2 bg-success/10 rounded-lg border border-success/20">
            <span className="text-success font-medium">Timer Complete! 🎉</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};