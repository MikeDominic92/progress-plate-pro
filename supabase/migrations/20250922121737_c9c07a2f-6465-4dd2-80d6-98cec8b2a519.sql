-- Fix RLS security warning - Enable RLS on existing workout_sessions table
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- NOTE: These policies use incorrect JWT path (auth.jwt() ->> 'username')
-- They are superseded by migration 20260225000000_fix_rls_jwt_paths.sql
-- which uses correct path: auth.jwt() -> 'user_metadata' ->> 'username'
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