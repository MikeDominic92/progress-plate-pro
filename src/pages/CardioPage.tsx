import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FitnessInput } from '@/components/ui/fitness-input';
import { Timer, CheckCircle2, Target, SkipForward, Pause, Play } from 'lucide-react';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import SonnyAngelDetailed from '@/components/characters/SonnyAngelDetailed';
import BottomNav from '@/components/BottomNav';

export default function CardioPage() {
  const navigate = useNavigate();
  const { username } = useAuthenticatedUser();
  const { currentSession, updateSession, initializeSession, manualSave } = useWorkoutStorage(username || '');

  const [cardioData, setCardioData] = useState({
    time: '',
    calories: '',
    completed: false,
  });

  // Cardio countdown timer state (restored from sessionStorage on refresh)
  const [timerSeconds, setTimerSeconds] = useState(() => {
    const saved = sessionStorage.getItem('cardio_timer_state');
    if (saved) {
      try { return JSON.parse(saved).timerSeconds ?? 600; } catch { return 600; }
    }
    return 600;
  });
  const [timerRunning, setTimerRunning] = useState(() => {
    const saved = sessionStorage.getItem('cardio_timer_state');
    if (saved) {
      try { return JSON.parse(saved).isRunning ?? false; } catch { return false; }
    }
    return false;
  });
  const [timerFinished, setTimerFinished] = useState(() => {
    const saved = sessionStorage.getItem('cardio_timer_state');
    if (saved) {
      try { return (JSON.parse(saved).timerSeconds ?? 600) === 0; } catch { return false; }
    }
    return false;
  });

  // Persist timer state to sessionStorage on changes
  useEffect(() => {
    sessionStorage.setItem('cardio_timer_state', JSON.stringify({
      timerSeconds,
      isRunning: timerRunning,
    }));
  }, [timerSeconds, timerRunning]);

  useEffect(() => {
    if (username) initializeSession();
  }, [username, initializeSession]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            setTimerFinished(true);
            // Auto-fill the time field
            setCardioData(d => ({ ...d, time: '10' }));
            updateSession({ cardio_time: '10' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, updateSession]);

  useEffect(() => {
    if (currentSession) {
      const sessionData = {
        time: currentSession.cardio_time || '',
        calories: currentSession.cardio_calories || '',
        completed: currentSession.cardio_completed || false,
      };
      if (sessionData.time !== cardioData.time ||
          sessionData.calories !== cardioData.calories ||
          sessionData.completed !== cardioData.completed) {
        setCardioData(sessionData);
      }
      if (currentSession.cardio_completed && !cardioData.completed) {
        navigate('/warmup');
      }
    }
  }, [currentSession]);

  const handleComplete = async () => {
    if (cardioData.time) {
      setCardioData({ ...cardioData, completed: true });
      const updates = {
        current_phase: 'warmup' as const,
        cardio_completed: true,
        cardio_time: cardioData.time,
        cardio_calories: cardioData.calories || '0',
      };
      updateSession(updates);
      sessionStorage.removeItem('cardio_timer_state');
      try { await manualSave(updates); } catch {}
      navigate('/warmup', { replace: true });
    }
  };

  const handleSkip = async () => {
    if (!window.confirm('Skip cardio warm-up? You can still come back.')) return;
    const updates = {
      current_phase: 'warmup' as const,
      cardio_completed: true,
      cardio_time: '0',
      cardio_calories: '0',
    };
    updateSession(updates);
    sessionStorage.removeItem('cardio_timer_state');
    try { await manualSave(updates); } catch {}
    navigate('/warmup', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(340_82%_66%/0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-sm md:max-w-lg lg:max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-hero bg-clip-text text-transparent mb-2">
              Cardio Warm-Up
            </h1>
            <div className="pointer-events-none opacity-85">
              <SonnyAngelDetailed variant="duck" size={48} />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            10 minutes of stair master to get the blood flowing
          </p>
        </div>

        {/* Cardio Card */}
        <Card className="bg-black border-primary/10 shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="text-accent flex items-center gap-2 text-base">
              <Timer className="h-5 w-5" />
              Stair Master
              {cardioData.completed && <CheckCircle2 className="h-5 w-5 text-success" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
              <p className="text-sm text-muted-foreground">
                10 minutes at an easy pace. Focus on long steps to fully stretch the glutes.
              </p>
            </div>

            {/* Countdown timer */}
            {!cardioData.completed && (
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-white mb-2">
                    {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="w-full h-2 sm:h-2.5 md:h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        timerSeconds <= 30 ? 'bg-red-500 animate-pulse' :
                        timerSeconds <= 60 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${((600 - timerSeconds) / 600) * 100}%` }}
                    />
                  </div>
                  {timerFinished ? (
                    <p className="text-sm text-green-400 font-medium">Time's up!</p>
                  ) : (
                    <Button
                      onClick={() => setTimerRunning(r => !r)}
                      variant="outline"
                      className="h-11 px-5 bg-white/10 border-white/20 text-white hover:bg-white/20 active:bg-white/30 active:scale-95 transition-all"
                    >
                      {timerRunning ? (
                        <><Pause className="h-4 w-4 mr-1" /> Pause</>
                      ) : (
                        <><Play className="h-4 w-4 mr-1" /> {timerSeconds < 600 ? 'Resume' : 'Start Timer'}</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FitnessInput
                label="Time (min)"
                icon={<Timer className="h-4 w-4" />}
                type="number"
                placeholder="10"
                value={cardioData.time}
                onChange={(e) => {
                  const newData = { ...cardioData, time: e.target.value };
                  setCardioData(newData);
                  setTimeout(() => updateSession({ cardio_time: e.target.value }), 500);
                }}
                variant={cardioData.time ? 'success' : 'default'}
                disabled={cardioData.completed}
              />
              <FitnessInput
                label="Calories"
                icon={<Target className="h-4 w-4" />}
                type="number"
                placeholder="0"
                value={cardioData.calories}
                onChange={(e) => {
                  const newData = { ...cardioData, calories: e.target.value };
                  setCardioData(newData);
                  setTimeout(() => updateSession({ cardio_calories: e.target.value }), 500);
                }}
                variant={cardioData.calories ? 'success' : 'default'}
                disabled={cardioData.completed}
              />
            </div>

            {cardioData.time && !cardioData.completed && (
              <Button
                onClick={handleComplete}
                className="w-full h-12 sm:h-14 bg-gradient-primary hover:shadow-glow active:shadow-none active:scale-[0.98] font-bold transition-all"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Cardio
              </Button>
            )}

            {cardioData.completed && (
              <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center justify-center gap-2 text-success font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Done! {cardioData.time} min{cardioData.calories && cardioData.calories !== '0' ? `, ${cardioData.calories} cal` : ''}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Elephant character */}
        <div className="flex justify-center pointer-events-none opacity-85 mb-2">
          <SonnyAngelDetailed variant="elephant" size={40} />
        </div>

        {/* Skip */}
        {!cardioData.completed && (
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full h-11 sm:h-12 text-muted-foreground hover:text-foreground active:text-foreground active:bg-muted/30 active:scale-[0.98] transition-all"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip Cardio
          </Button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
