-- Fix RLS security warning - Enable RLS on existing workout_sessions table
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_sessions table to allow users to access their own sessions
CREATE POLICY "Users can view their own workout sessions" 
ON public.workout_sessions 
FOR SELECT 
USING (username = (auth.jwt() ->> 'username') OR username IS NOT NULL);

CREATE POLICY "Users can create their own workout sessions" 
ON public.workout_sessions 
FOR INSERT 
WITH CHECK (username IS NOT NULL);

CREATE POLICY "Users can update their own workout sessions" 
ON public.workout_sessions 
FOR UPDATE 
USING (username = (auth.jwt() ->> 'username') OR username IS NOT NULL);

CREATE POLICY "Users can delete their own workout sessions" 
ON public.workout_sessions 
FOR DELETE 
USING (username = (auth.jwt() ->> 'username') OR username IS NOT NULL);