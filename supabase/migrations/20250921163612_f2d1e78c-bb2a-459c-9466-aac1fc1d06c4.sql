-- First drop all policies that depend on user_id
DROP POLICY IF EXISTS "Users can view their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can create their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can update their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can delete their own workout sessions" ON public.workout_sessions;

-- Disable RLS
ALTER TABLE public.workout_sessions DISABLE ROW LEVEL SECURITY;

-- Now drop the user_id column and add username
ALTER TABLE public.workout_sessions 
  DROP COLUMN user_id,
  ADD COLUMN username TEXT NOT NULL DEFAULT 'JackyLove';