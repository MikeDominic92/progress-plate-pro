-- Update workout_sessions table to use username instead of user_id
ALTER TABLE public.workout_sessions 
  DROP COLUMN user_id,
  ADD COLUMN username TEXT NOT NULL DEFAULT 'JackyLove';

-- Update RLS policies for username-based access
DROP POLICY IF EXISTS "Users can view their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can create their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can update their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can delete their own workout sessions" ON public.workout_sessions;

-- SECURITY FIX: Keep RLS enabled - proper policies will be added in migration 20260225000000_fix_rls_jwt_paths.sql
-- DO NOT DISABLE RLS - this leaves user data completely unprotected
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;