-- Fix security vulnerability: Remove overly permissive OR clause from workout_sessions SELECT policy
DROP POLICY "Users can view their own workout sessions" ON public.workout_sessions;

-- Create new restrictive policy that only allows users to view their own workout sessions
CREATE POLICY "Users can view their own workout sessions" 
ON public.workout_sessions 
FOR SELECT 
USING (username = (auth.jwt() ->> 'username'::text));