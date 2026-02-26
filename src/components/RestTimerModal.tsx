import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Pause, Play, CheckCircle2 } from 'lucide-react';
import { playBeep, notifyRestComplete, requestNotificationPermission } from '@/utils/timerNotifications';

// Recommended rest duration by set type
const RECOMMENDED_REST: Record<string, number> = {
  'Warm Up Set': 1,
  'Medium/Primer Set': 2,
  'Heavy/Top Set': 3,
  'Failure/Back-Off Set': 4,
};

interface RestTimerModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
  setDetails?: {
    exerciseName: string;
    setType: string;
    setNumber: number;
  };
  onRestStarted?: (duration: number) => void;
  onRestCompleted?: (actualDuration: number) => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  isOpen,
  onComplete,
  onClose,
  setDetails,
  onRestStarted,
  onRestCompleted,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [restStartTime, setRestStartTime] = useState<number | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customSeconds, setCustomSeconds] = useState(90);

  const recommendedMinutes = setDetails ? RECOMMENDED_REST[setDetails.setType] || 2 : null;

  const restOptions = [
    { value: 1, label: '1 min', color: 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 active:bg-primary/30' },
    { value: 2, label: '2 min', color: 'bg-primary/15 border-primary/50 text-primary hover:bg-primary/25 active:bg-primary/35' },
    { value: 3, label: '3 min', color: 'bg-accent/10 border-accent/40 text-accent hover:bg-accent/20 active:bg-accent/30' },
    { value: 4, label: '4 min', color: 'bg-accent/15 border-accent/50 text-accent hover:bg-accent/25 active:bg-accent/35' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Audio chime and browser notification when timer finishes
  useEffect(() => {
    if (isCompleted) {
      playBeep();
      notifyRestComplete();
      const timeout = setTimeout(() => {
        handleFinish();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isCompleted]);

  const handleSelectTime = (minutes: number) => {
    requestNotificationPermission();
    setSelectedMinutes(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(true);
    setIsCompleted(false);
    setRestStartTime(Date.now());
    setShowCustom(false);
    onRestStarted?.(minutes * 60);
  };

  const handleSelectSeconds = (totalSeconds: number) => {
    requestNotificationPermission();
    setSelectedMinutes(totalSeconds / 60);
    setTimeLeft(totalSeconds);
    setIsRunning(true);
    setIsCompleted(false);
    setRestStartTime(Date.now());
    setShowCustom(false);
    onRestStarted?.(totalSeconds);
  };

  const handleSkip = () => {
    onRestCompleted?.(0);
    resetAndClose();
  };

  const handleFinish = () => {
    if (restStartTime) {
      const actualDuration = Math.round((Date.now() - restStartTime) / 1000);
      onRestCompleted?.(actualDuration);
    }
    onComplete();
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedMinutes(null);
    setTimeLeft(0);
    setIsRunning(false);
    setIsCompleted(false);
    setRestStartTime(null);
    onClose();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = selectedMinutes ? ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100 : 0;

  const getProgressColor = () => {
    if (timeLeft <= 30) return 'bg-red-500 animate-pulse';
    if (timeLeft <= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <Card className="w-full max-w-sm md:max-w-md bg-black/95 backdrop-blur-glass border-primary/30 shadow-2xl">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-center flex items-center justify-center gap-2 text-white text-base">
            <Clock className="h-5 w-5 text-primary" />
            Rest
          </CardTitle>
          {setDetails && (
            <p className="text-center text-xs text-white/50">
              {setDetails.exerciseName} - Set {setDetails.setNumber}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {!selectedMinutes ? (
            <>
              {/* Time options */}
              <div className="grid grid-cols-2 gap-3">
                {restOptions.map(option => (
                  <Button
                    key={option.value}
                    onClick={() => handleSelectTime(option.value)}
                    variant="outline"
                    className={`h-14 text-base sm:h-16 sm:text-lg font-semibold relative ${option.color} transition-all duration-200 ${
                      recommendedMinutes === option.value ? 'ring-2 ring-primary ring-offset-1 ring-offset-black' : ''
                    }`}
                  >
                    {option.label}
                    {recommendedMinutes === option.value && (
                      <span className="absolute -top-2 -right-2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                        Suggested
                      </span>
                    )}
                  </Button>
                ))}
              </div>

              {/* 30s option */}
              <Button
                onClick={() => handleSelectSeconds(30)}
                variant="outline"
                className="w-full h-11 text-sm font-medium bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:text-white active:bg-white/20"
              >
                30s
              </Button>

              {/* Custom timer */}
              {!showCustom ? (
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full text-center text-sm text-white/40 hover:text-white/70 active:text-white/90 py-2 min-h-[44px] transition-colors"
                >
                  Custom
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 sm:gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                  <Button
                    onClick={() => setCustomSeconds(s => Math.max(15, s - 15))}
                    variant="outline"
                    size="sm"
                    className="h-11 w-11 p-0 bg-white/10 border-white/20 text-white hover:bg-white/20 active:bg-white/30 text-lg font-bold"
                  >
                    -
                  </Button>
                  <span className="text-white font-mono text-lg w-16 text-center">
                    {Math.floor(customSeconds / 60)}:{(customSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <Button
                    onClick={() => setCustomSeconds(s => Math.min(600, s + 15))}
                    variant="outline"
                    size="sm"
                    className="h-11 w-11 p-0 bg-white/10 border-white/20 text-white hover:bg-white/20 active:bg-white/30 text-lg font-bold"
                  >
                    +
                  </Button>
                  <Button
                    onClick={() => handleSelectSeconds(customSeconds)}
                    size="sm"
                    className="bg-gradient-primary text-white font-semibold h-11 active:opacity-80"
                  >
                    Start
                  </Button>
                </div>
              )}

              {/* Skip rest */}
              <button
                onClick={handleSkip}
                className="w-full text-center text-sm text-white/40 hover:text-white/70 active:text-white/90 py-2 min-h-[44px] transition-colors"
              >
                Skip Rest
              </button>
            </>
          ) : (
            <>
              {/* Timer display */}
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-mono font-bold mb-3 text-white">
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getProgressColor()}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Controls */}
              {!isCompleted ? (
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setIsRunning(r => !r)}
                    variant="outline"
                    size="lg"
                    className="bg-white/10 hover:bg-white/20 active:bg-white/30 border-white/30 text-white"
                  >
                    {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={handleFinish}
                    size="lg"
                    className="bg-gradient-primary hover:shadow-glow active:opacity-80 text-white font-semibold"
                  >
                    Continue Now
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4 bg-success/20 rounded-lg border border-success/30">
                  <div className="flex items-center justify-center gap-2 text-success font-bold text-lg">
                    <CheckCircle2 className="h-5 w-5" />
                    Ready!
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
