import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FitnessInput } from '@/components/ui/fitness-input';
import { Timer, CheckCircle2, Target, SkipForward } from 'lucide-react';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

export default function CardioPage() {
  const navigate = useNavigate();
  const { username } = useAuthenticatedUser();
  const { currentSession, updateSession, initializeSession, manualSave } = useWorkoutStorage(username || '');

  const [cardioData, setCardioData] = useState({
    time: '',
    calories: '',
    completed: false,
  });

  useEffect(() => {
    if (username) initializeSession();
  }, [username, initializeSession]);

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
    if (cardioData.time && cardioData.calories) {
      setCardioData({ ...cardioData, completed: true });
      const updates = {
        current_phase: 'warmup' as const,
        cardio_completed: true,
        cardio_time: cardioData.time,
        cardio_calories: cardioData.calories,
      };
      updateSession(updates);
      try { await manualSave(updates); } catch {}
      navigate('/warmup', { replace: true });
    }
  };

  const handleSkip = async () => {
    const updates = {
      current_phase: 'warmup' as const,
      cardio_completed: true,
      cardio_time: '0',
      cardio_calories: '0',
    };
    updateSession(updates);
    try { await manualSave(updates); } catch {}
    navigate('/warmup', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(340_82%_66%/0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Cardio Warm-Up
          </h1>
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

            <div className="grid grid-cols-2 gap-4">
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

            {cardioData.time && cardioData.calories && !cardioData.completed && (
              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-primary hover:shadow-glow"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Cardio
              </Button>
            )}

            {cardioData.completed && (
              <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center justify-center gap-2 text-success font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Done! {cardioData.time} min, {cardioData.calories} cal
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skip */}
        {!cardioData.completed && (
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip Cardio
          </Button>
        )}
      </div>
    </div>
  );
}
