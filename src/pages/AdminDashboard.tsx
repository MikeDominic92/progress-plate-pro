import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Activity, Timer, TrendingUp, Calendar, Dumbbell, Trash2, RefreshCw, Database } from 'lucide-react';
import { extractUniqueExercises, getExerciseSyncStats } from '@/utils/exerciseSync';
import { useExerciseIndex } from '@/hooks/useExerciseIndex';
import { deleteAllData } from '@/utils/adminActions';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  username: string;
  display_name?: string;
  total_sessions: number;
  total_workout_time: number;
  last_session_date: string;
  created_at: string;
}

interface SessionData {
  id: string;
  username: string;
  session_date: string;
  current_phase: string;
  cardio_completed: boolean;
  cardio_time?: string;
  cardio_calories?: string;
  warmup_completed: boolean;
  workout_data: any;
  created_at: string;
  updated_at: string;
}

interface AnalyticsData {
  id: string;
  username: string;
  event_type: string;
  event_data: any;
  timestamp: string;
  duration_seconds?: number;
  exercise_name?: string;
  set_number?: number;
  weight?: number;
  reps?: number;
}

const AdminDashboard: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');
  
  // Exercise index hooks
  const { addExercise, updateExercise, exercises, fetchExercises } = useExerciseIndex();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('total_sessions', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch recent sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Fetch analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('session_analytics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData || []);

      // Fetch exercises
      await fetchExercises();

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    try {
      await deleteAllData();
      toast({
        title: "Success",
        description: "All data has been reset successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSyncExercises = async () => {
    try {
      const exercisesToSync = extractUniqueExercises('JackyLove');
      let syncedCount = 0;
      let updatedCount = 0;
      
      console.log('🔄 Syncing exercises with Jeff Nippard videos and glute descriptions:', exercisesToSync);
      
      for (const exerciseData of exercisesToSync) {
        // Check if exercise already exists by name
        const existingExercise = exercises.find(ex => ex.name === exerciseData.name);
        
        if (existingExercise) {
          // Update existing exercise with new video URL and instructions
          await updateExercise(existingExercise.id, {
            tier: exerciseData.tier,
            video_url: exerciseData.video_url,
            instructions: exerciseData.instructions,
            subcategory: exerciseData.subcategory
          });
          updatedCount++;
          console.log(`✅ Updated: ${exerciseData.name} with ${exerciseData.video_url}`);
        } else {
          // Add new exercise
          await addExercise(exerciseData);
          syncedCount++;
          console.log(`➕ Added: ${exerciseData.name} with ${exerciseData.video_url}`);
        }
      }
      
      await fetchExercises();
      
      toast({
        title: "Exercise Sync Complete! 🎯",
        description: `Updated ${updatedCount} exercises + added ${syncedCount} new ones with Jeff Nippard timestamped videos and glute region descriptions.`,
      });
      
      console.log(`🎉 Sync Complete: ${updatedCount} updated, ${syncedCount} new exercises`);
    } catch (error) {
      console.error('❌ Sync error:', error);
      toast({
        title: "Error",
        description: "Failed to sync exercises. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (selectedUser !== 'all' && session.username !== selectedUser) return false;
    
    const sessionDate = new Date(session.session_date);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
    
    return sessionDate >= daysAgo;
  });

  const filteredAnalytics = analytics.filter(event => {
    if (selectedUser !== 'all' && event.username !== selectedUser) return false;
    
    const eventDate = new Date(event.timestamp);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
    
    return eventDate >= daysAgo;
  });

  // Calculate stats
  const totalUsers = profiles.length;
  const activeSessions = filteredSessions.filter(s => s.current_phase !== 'completed').length;
  const totalWorkoutTime = Math.round(profiles.reduce((sum, p) => sum + (p.total_workout_time || 0), 0) / 3600);
  const avgSessionTime = filteredSessions.length > 0 ? 
    Math.round(filteredSessions.reduce((sum, s) => {
      const duration = new Date(s.updated_at).getTime() - new Date(s.created_at).getTime();
      return sum + duration;
    }, 0) / filteredSessions.length / 60000) : 0;

  // Chart data
  const dailySessionsData = Array.from({ length: parseInt(dateRange) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = filteredSessions.filter(s => s.session_date === dateStr).length;
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: count
    };
  }).reverse();

  const exercisePopularityData = filteredAnalytics
    .filter(a => a.event_type === 'set_completed' && a.exercise_name)
    .reduce((acc, event) => {
      const name = event.exercise_name!;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topExercises = Object.entries(exercisePopularityData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const phaseCompletionData = ['cardio', 'warmup', 'workout', 'completed'].map(phase => ({
    phase: phase.charAt(0).toUpperCase() + phase.slice(1),
    count: filteredSessions.filter(s => s.current_phase === phase).length
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor user activity and workout analytics</p>
          </div>
          <div className="flex gap-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {profiles.map(profile => (
                  <SelectItem key={profile.username} value={profile.username}>
                    {profile.display_name || profile.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchData}>Refresh</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {profiles.filter(p => {
                  const lastSession = new Date(p.last_session_date);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return lastSession >= weekAgo;
                }).length} active this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workout Hours</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWorkoutTime}h</div>
              <p className="text-xs text-muted-foreground">Across all users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgSessionTime}m</div>
              <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailySessionsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sessions" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phase Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={phaseCompletionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {phaseCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Popular Exercises</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topExercises} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-4">
              {profiles.map((profile) => (
                <Card key={profile.username}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{profile.display_name || profile.username}</CardTitle>
                        <CardDescription>@{profile.username}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {profile.total_sessions} sessions
                        </Badge>
                        <Badge variant="outline">
                          {Math.round((profile.total_workout_time || 0) / 3600)}h total
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Joined</p>
                        <p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Session</p>
                        <p className="font-medium">{new Date(profile.last_session_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Session</p>
                        <p className="font-medium">
                          {profile.total_sessions > 0 ? Math.round((profile.total_workout_time || 0) / profile.total_sessions / 60) : 0}m
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant={
                          new Date(profile.last_session_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                            ? "default" : "secondary"
                        }>
                          {new Date(profile.last_session_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                            ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="grid gap-4">
              {filteredSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{session.username}</CardTitle>
                        <CardDescription>{new Date(session.session_date).toLocaleDateString()}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={session.current_phase === 'completed' ? 'default' : 'secondary'}>
                          {session.current_phase}
                        </Badge>
                        {session.cardio_completed && <Badge variant="outline">Cardio</Badge>}
                        {session.warmup_completed && <Badge variant="outline">Warmup</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">
                          {Math.round((new Date(session.updated_at).getTime() - new Date(session.created_at).getTime()) / 60000)}m
                        </p>
                      </div>
                      {session.cardio_time && (
                        <div>
                          <p className="text-muted-foreground">Cardio Time</p>
                          <p className="font-medium">{session.cardio_time}</p>
                        </div>
                      )}
                      {session.cardio_calories && (
                        <div>
                          <p className="text-muted-foreground">Calories</p>
                          <p className="font-medium">{session.cardio_calories}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Exercises</p>
                        <p className="font-medium">
                          {session.workout_data?.logs ? Object.keys(session.workout_data.logs).length : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4">
              {filteredAnalytics.slice(0, 50).map((event) => (
                <Card key={event.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{event.username}</span>
                        </div>
                        <Badge variant="outline">{event.event_type.replace('_', ' ')}</Badge>
                        {event.exercise_name && (
                          <span className="text-sm text-muted-foreground">{event.exercise_name}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                      {event.set_number && <span>Set {event.set_number}</span>}
                      {event.weight && <span>{event.weight} lbs</span>}
                      {event.reps && <span>{event.reps} reps</span>}
                      {event.duration_seconds && <span>{event.duration_seconds}s</span>}
                      {event.event_data?.restDuration && <span>Rest: {event.event_data.restDuration}s</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-primary" />
                    Sync Exercise Index
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground mb-4">
                     Sync all exercises from your 40-day workout plan with Jeff Nippard timestamped videos and glute region descriptions.
                   </p>
                  <div className="text-sm text-muted-foreground mb-4">
                    <div>Exercises with videos: {getExerciseSyncStats('Admin').exercisesWithVideos}</div>
                    <div>Current index size: {exercises.length}</div>
                  </div>
                   <Button 
                     onClick={handleSyncExercises}
                     className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                   >
                     <RefreshCw className="h-4 w-4 mr-2" />
                     🎯 Sync All Exercises (Jeff Nippard Videos)
                   </Button>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-destructive" />
                    Reset Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete all workout sessions, profiles, and analytics data.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleResetData}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;