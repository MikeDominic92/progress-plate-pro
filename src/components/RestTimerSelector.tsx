import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Pause, CheckCircle2, RotateCcw } from 'lucide-react';
import { playBeep, notifyRestComplete, requestNotificationPermission } from '@/utils/timerNotifications';

interface RestTimerSelectorProps {
  onComplete: () => void;
  onClose: () => void;
  isVisible: boolean;
}

export const RestTimerSelector: React.FC<RestTimerSelectorProps> = ({ 
  onComplete, 
  onClose, 
  isVisible 
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasShown30SecWarning, setHasShown30SecWarning] = useState(false);

  const restOptions = [
    { value: 1, label: '1 min', color: 'bg-success/20 border-success text-success hover:bg-success/30 active:bg-success/40' },
    { value: 2, label: '2 min', color: 'bg-primary/20 border-primary text-primary hover:bg-primary/30 active:bg-primary/40' },
    { value: 3, label: '3 min', color: 'bg-accent/20 border-accent text-accent hover:bg-accent/30 active:bg-accent/40' },
    { value: 4, label: '4 min', color: 'bg-warning/20 border-warning text-warning hover:bg-warning/30 active:bg-warning/40' }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            playBeep();
            notifyRestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // 30-second warning
  useEffect(() => {
    if (timeLeft === 30 && !hasShown30SecWarning && isRunning) {
      setHasShown30SecWarning(true);
      // You can add a toast notification here if needed
    }
  }, [timeLeft, hasShown30SecWarning, isRunning]);

  const handleSelectTime = (minutes: number) => {
    requestNotificationPermission();
    setSelectedMinutes(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(true); // Auto-start timer immediately
    setIsCompleted(false);
    setHasShown30SecWarning(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedMinutes ? selectedMinutes * 60 : 0);
    setIsCompleted(false);
    setHasShown30SecWarning(false);
  };

  const handleComplete = () => {
    onComplete();
    onClose();
    // Reset state
    setSelectedMinutes(null);
    setTimeLeft(0);
    setIsRunning(false);
    setIsCompleted(false);
    setHasShown30SecWarning(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = selectedMinutes ? ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100 : 0;

  const getProgressColor = () => {
    if (timeLeft <= 30) return 'bg-destructive animate-pulse';
    if (timeLeft <= 60) return 'bg-warning';
    return 'bg-success';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-glass border-primary/30 shadow-2xl">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Rest Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          {!selectedMinutes ? (
            <>
              <p className="text-center text-muted-foreground text-sm">
                Select your rest time before continuing to the next exercise
              </p>
              <div className="grid grid-cols-2 gap-3">
                {restOptions.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => handleSelectTime(option.value)}
                    variant="outline"
                    className={`h-14 sm:h-16 text-base sm:text-lg font-semibold ${option.color} hover:scale-105 active:scale-95 transition-all duration-200`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="text-4xl font-mono font-bold mb-2">
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </div>
                <Badge variant="outline" className="bg-primary/10">
                  {selectedMinutes} minute rest
                  {timeLeft <= 30 && timeLeft > 0 && (
                    <span className="ml-2 text-destructive font-bold animate-pulse">⚠️ 30s left!</span>
                  )}
                </Badge>
              </div>

              <div className="w-full h-4 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getProgressColor()}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {!isCompleted ? (
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                  <Button
                    onClick={handlePause}
                    variant="secondary"
                    className="h-11 px-3 sm:px-4 bg-white/10 hover:bg-white/20 active:bg-white/30 border-white/20"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="h-11 px-3 sm:px-4 bg-white/5 hover:bg-white/10 active:bg-white/20 border-white/20"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleComplete}
                    variant="default"
                    className="h-11 px-3 sm:px-4 bg-gradient-primary hover:shadow-glow active:opacity-80"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Continue to Next Set</span>
                    <span className="sm:hidden">Continue</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center justify-center gap-2 text-success font-semibold mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Rest Complete!
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can now continue to the next exercise
                    </p>
                  </div>
                  
                  <Button onClick={handleComplete} className="w-full h-11 bg-gradient-primary active:opacity-80">
                    Continue to Next Exercise
                  </Button>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="h-11 px-4 text-muted-foreground active:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};