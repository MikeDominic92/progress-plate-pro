import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Trophy } from 'lucide-react';

interface SessionTimerProps {
  startTime: number | null;
  onMotivationalMessage: (message: string) => void;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ startTime, onMotivationalMessage }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [hasShownWarning, setHasShownWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!startTime) return null;

  const elapsedMs = currentTime - startTime;
  const totalMinutes = Math.floor(elapsedMs / 60000) + 10; // Start from 10 minutes
  const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  const maxSessionMinutes = 130; // 2 hours 10 minutes (including the initial 10)
  const warningThreshold = 110; // 1h 50min total
  
  const progress = (totalMinutes / maxSessionMinutes) * 100;
  const isNearLimit = totalMinutes >= warningThreshold;
  const isOverLimit = totalMinutes >= maxSessionMinutes;

  // Show motivational messages
  useEffect(() => {
    if (totalMinutes >= warningThreshold && !hasShownWarning) {
      setHasShownWarning(true);
      onMotivationalMessage("You're doing great! 20 minutes left - let's finish strong! 💪");
    }
    if (totalMinutes >= maxSessionMinutes) {
      onMotivationalMessage("Amazing effort! You've hit the 2-hour mark. Consider wrapping up for optimal recovery. 🏆");
    }
  }, [totalMinutes, hasShownWarning, onMotivationalMessage, warningThreshold, maxSessionMinutes]);

  const getTimerColor = () => {
    if (isOverLimit) return 'bg-destructive/20 border-destructive text-destructive';
    if (isNearLimit) return 'bg-warning/20 border-warning text-warning';
    if (progress > 50) return 'bg-accent/20 border-accent text-accent';
    return 'bg-success/20 border-success text-success';
  };

  const getProgressColor = () => {
    if (isOverLimit) return 'bg-destructive';
    if (isNearLimit) return 'bg-warning';
    if (progress > 50) return 'bg-accent';
    return 'bg-success';
  };

  return (
    <Card className={`fixed top-4 right-4 z-50 transition-all duration-300 ${getTimerColor()}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isOverLimit ? (
              <AlertTriangle className="h-4 w-4" />
            ) : isNearLimit ? (
              <Clock className="h-4 w-4 animate-pulse" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <div className="text-sm font-mono">
              {hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${elapsedSeconds.toString().padStart(2, '0')}` 
                         : `${minutes}:${elapsedSeconds.toString().padStart(2, '0')}`}
            </div>
          </div>
          
          <div className="w-16 h-2 bg-background/30 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          
          {isOverLimit && (
            <Badge variant="destructive" className="text-xs">
              <Trophy className="h-3 w-3 mr-1" />
              2h+
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};