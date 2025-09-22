import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, CheckCircle2, RotateCcw, Zap, Heart } from 'lucide-react';

interface RestTimerModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
  setDetails?: {
    exerciseName: string;
    setType: string;
    setNumber: number;
  };
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({ 
  isOpen,
  onComplete, 
  onClose,
  setDetails
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasShown30SecWarning, setHasShown30SecWarning] = useState(false);

  const restOptions = [
    { value: 1, label: '1 min', color: 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30', icon: '🏃‍♂️' },
    { value: 2, label: '2 min', color: 'bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30', icon: '🚶‍♂️' },
    { value: 3, label: '3 min', color: 'bg-yellow-500/20 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30', icon: '🧘‍♂️' },
    { value: 4, label: '4 min', color: 'bg-purple-500/20 border-purple-500 text-purple-400 hover:bg-purple-500/30', icon: '😴' }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
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

  // 30-second warning
  useEffect(() => {
    if (timeLeft === 30 && !hasShown30SecWarning && isRunning) {
      setHasShown30SecWarning(true);
      // Optional: Add haptic feedback simulation
      document.body.style.animation = 'pulse 0.3s ease-in-out';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 300);
    }
  }, [timeLeft, hasShown30SecWarning, isRunning]);

  const handleSelectTime = (minutes: number) => {
    setSelectedMinutes(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(true); // Auto-start timer immediately
    setIsCompleted(false);
    setHasShown30SecWarning(false);
  };

  const handleFeelGood = () => {
    onComplete();
    resetAndClose();
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedMinutes ? selectedMinutes * 60 : 0);
    setIsCompleted(false);
    setHasShown30SecWarning(false);
  };

  const handleComplete = () => {
    onComplete();
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedMinutes(null);
    setTimeLeft(0);
    setIsRunning(false);
    setIsCompleted(false);
    setHasShown30SecWarning(false);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-black/95 backdrop-blur-glass border-orange-500/30 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-center flex items-center justify-center gap-2 text-white">
            <Clock className="h-5 w-5 text-orange-500" />
            Rest Between Sets
          </CardTitle>
          {setDetails && (
            <div className="text-center text-sm text-white/70">
              <p className="font-medium">{setDetails.exerciseName}</p>
              <p>{setDetails.setType} - Set {setDetails.setNumber} Complete</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedMinutes ? (
            <>
              <p className="text-center text-white/80 text-sm">
                How long would you like to rest before your next set?
              </p>
              
              {/* Rest Time Options */}
              <div className="grid grid-cols-2 gap-3">
                {restOptions.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => handleSelectTime(option.value)}
                    variant="outline"
                    className={`h-20 text-lg font-semibold ${option.color} hover:scale-105 transition-all duration-200 flex flex-col items-center space-y-1`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span>{option.label}</span>
                  </Button>
                ))}
              </div>

              {/* Feel Good Option */}
              <div className="mt-4">
                <Button
                  onClick={handleFeelGood}
                  className="w-full h-16 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg transition-all duration-200 hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <Heart className="h-6 w-6" />
                    <span>Feel Good - Continue Now!</span>
                    <Zap className="h-6 w-6" />
                  </div>
                </Button>
                <p className="text-center text-xs text-white/60 mt-2">
                  Skip rest and continue to your next set immediately
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Timer Display */}
              <div className="text-center">
                <div className="text-6xl font-mono font-bold mb-4 text-white">
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </div>
                <Badge variant="outline" className="bg-orange-500/20 border-orange-500 text-orange-400 text-lg px-4 py-2">
                  {selectedMinutes} minute rest
                  {timeLeft <= 30 && timeLeft > 0 && (
                    <span className="ml-2 text-red-400 font-bold animate-pulse">⚠️ 30s left!</span>
                  )}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-6 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getProgressColor()}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Timer Controls */}
              {!isCompleted ? (
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={isRunning ? handlePause : handleResume}
                    variant="outline" 
                    size="lg"
                    className="bg-white/10 hover:bg-white/20 border-white/30 text-white"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleReset}
                    variant="outline" 
                    size="lg"
                    className="bg-white/5 hover:bg-white/10 border-white/30 text-white/80"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  
                  <Button 
                    onClick={handleComplete}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Continue Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-green-500/20 rounded-lg border border-green-500/30">
                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-xl mb-2">
                      <CheckCircle2 className="h-6 w-6" />
                      Rest Complete! 💪
                    </div>
                    <p className="text-sm text-white/70">
                      You're ready for your next set
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleComplete} 
                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg"
                  >
                    Continue to Next Set
                  </Button>
                </div>
              )}

              {/* Back to Selection */}
              <div className="flex justify-center">
                <Button 
                  onClick={() => {
                    setSelectedMinutes(null);
                    setTimeLeft(0);
                    setIsRunning(false);
                    setIsCompleted(false);
                  }}
                  variant="ghost" 
                  size="sm"
                  className="text-white/60 hover:text-white"
                >
                  ← Back to Options
                </Button>
              </div>
            </>
          )}

          {/* Close Button */}
          <div className="flex justify-center pt-4 border-t border-white/10">
            <Button 
              onClick={resetAndClose} 
              variant="ghost" 
              size="sm"
              className="text-white/50 hover:text-white/80"
            >
              Skip Rest & Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};