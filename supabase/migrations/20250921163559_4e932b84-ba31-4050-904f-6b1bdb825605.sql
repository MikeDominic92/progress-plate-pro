-- Update workout_sessions table to use username instead of user_id
ALTER TABLE public.workout_sessions 
  DROP COLUMN user_id,
  ADD COLUMN username TEXT NOT NULL DEFAULT 'JackyLove';

-- Update RLS policies for username-based access
DROP POLICY "Users can view their own workout sessions" ON public.workout_sessions;
DROP POLICY "Users can create their own workout sessions" ON public.workout_sessions;
DROP POLICY "Users can update their own workout sessions" ON public.workout_sessions;
DROP POLICY "Users can delete their own workout sessions" ON public.workout_sessions;

-- Disable RLS since we're using username-based access without auth
ALTER TABLE public.workout_sessions DISABLE ROW LEVEL SECURITY;