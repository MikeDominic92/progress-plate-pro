-- Create profiles table to track user information and analytics
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_sessions INTEGER DEFAULT 0,
  total_workout_time INTEGER DEFAULT 0, -- in seconds
  last_session_date DATE,
  favorite_exercises JSONB DEFAULT '[]'::jsonb,
  personal_records JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (username IS NOT NULL);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (username IS NOT NULL);

-- Create session_analytics table for detailed tracking
CREATE TABLE public.session_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'set_completed', 'rest_started', 'rest_completed', 'exercise_started', 'exercise_completed', 'phase_started', 'phase_completed'
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER, -- duration for timed events
  exercise_name TEXT,
  set_number INTEGER,
  weight DECIMAL,
  reps INTEGER
);

-- Enable RLS for session_analytics
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for session_analytics
CREATE POLICY "Session analytics viewable by everyone" 
ON public.session_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create session analytics" 
ON public.session_analytics 
FOR INSERT 
WITH CHECK (username IS NOT NULL);

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_session_analytics_session_id ON public.session_analytics(session_id);
CREATE INDEX idx_session_analytics_username ON public.session_analytics(username);
CREATE INDEX idx_session_analytics_event_type ON public.session_analytics(event_type);
CREATE INDEX idx_session_analytics_timestamp ON public.session_analytics(timestamp DESC);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create function to automatically create profile when first session is created
CREATE OR REPLACE FUNCTION public.handle_new_workout_session()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (username, last_session_date, total_sessions)
  VALUES (NEW.username, NEW.session_date, 1)
  ON CONFLICT (username) 
  DO UPDATE SET 
    last_session_date = NEW.session_date,
    total_sessions = profiles.total_sessions + 1,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create/update profiles
CREATE TRIGGER on_workout_session_created
  AFTER INSERT ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_workout_session();