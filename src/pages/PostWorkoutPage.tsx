import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Trophy, Target, CheckCircle2, Home } from 'lucide-react';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { supabase } from '@/integrations/supabase/client';

export default function PostWorkoutPage() {
  const navigate = useNavigate();
  const { username } = useAuthenticatedUser();
  const { currentSession, initializeSession, resetSession } = useWorkoutStorage(username || '');

  useEffect(() => {
    if (username) {
      initializeSession();
    }
  }, [username, initializeSession]);

  useEffect(() => {
    if (currentSession) {
      // Check if user should be on this page
      if (currentSession.current_phase !== 'completed') {
        // Redirect based on current phase
        switch (currentSession.current_phase) {
          case 'cardio':
            navigate('/cardio');
            break;
          case 'warmup':
            navigate('/warmup');
            break;
          case 'main':
            navigate('/workout');
            break;
          default:
            navigate('/');
            break;
        }
      }
    }
  }, [currentSession, navigate]);

  const handleNewWorkout = async () => {
    // Clear current session and start fresh
    localStorage.removeItem('jackyWorkoutLog');
    localStorage.removeItem('jackyCardioData');
    localStorage.removeItem('jackyWarmupData');
    // Force creation of a brand new session on next page
    localStorage.setItem('forceNewSession', '1');
    
    // Create a new session in Supabase by updating the current one to completed
    // and letting the system create a fresh one
    if (currentSession) {
      try {
        await supabase
          .from('workout_sessions')
          .update({ 
            current_phase: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSession.id);
      } catch (error) {
        console.error('Error marking session as completed:', error);
      }
    }
    
    // Reset the session state in the hook
    resetSession();
    
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(24_95%_53%/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(24_95%_53%/0.05),transparent_50%)]" />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-primary/20 backdrop-blur-glass rounded-full text-primary-foreground font-medium text-sm mb-6 border border-primary/30">
            <Trophy className="h-4 w-4" />
            Workout Complete!
            <Trophy className="h-4 w-4" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-hero bg-clip-text text-transparent mb-4 tracking-tight">
            Congratulations! 🎉
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            You've successfully completed your glute workout session
          </p>
        </div>

        {/* Celebration Card */}
        <Card className="bg-gradient-to-r from-success/20 to-success/10 border-success/30 shadow-lg mb-8">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Outstanding Work!</h2>
            <p className="text-muted-foreground mb-4">
              You've completed all phases of your workout with dedication and focus.
            </p>
            <div className="flex items-center justify-center gap-2 text-success font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              Session Complete
            </div>
          </CardContent>
        </Card>

        {/* Post-Workout Protocol */}
        <Card className="bg-gradient-secondary/80 backdrop-blur-glass border-accent/30 shadow-lg shadow-glass mb-8">
          <CardHeader>
            <CardTitle className="text-accent flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Post-Workout Protocol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Cool-Down Cardio</h4>
                <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                  <p className="text-muted-foreground mb-2">
                    <strong>Treadmill:</strong> 10 minutes incline walk
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Set incline to 8 and pace between 2.5-3.0 mph to promote recovery
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Recovery & Nutrition</h4>
                <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>Protein shake within 30 minutes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>Post-workout meal with quality protein</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>Stay hydrated throughout the day</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>No additional core work today</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Tips */}
        <Card className="bg-gradient-card/80 backdrop-blur-glass border-primary/30 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recovery Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <h4 className="font-semibold text-foreground mb-2">Next 24-48 Hours</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Gentle stretching or light yoga</li>
                  <li>• Adequate sleep (7-9 hours)</li>
                  <li>• Active recovery (light walking)</li>
                  <li>• Monitor muscle soreness</li>
                </ul>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <h4 className="font-semibold text-foreground mb-2">Before Next Session</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Allow 48-72 hours rest for this muscle group</li>
                  <li>• Track any soreness or fatigue levels</li>
                  <li>• Stay consistent with nutrition</li>
                  <li>• Plan your next workout session</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleNewWorkout}
            className="bg-gradient-primary hover:shadow-glow"
            size="lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Start New Workout
          </Button>
        </div>

        {/* Enhanced Footer */}
        <footer className="text-center mt-16 py-8 border-t border-border/50">
          <div className="space-y-2">
            <p className="text-foreground font-medium">
              Excellent work! Your dedication is building strength! 💪
            </p>
            <p className="text-xs text-muted-foreground">
              Remember: consistency beats intensity. Keep showing up!
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}