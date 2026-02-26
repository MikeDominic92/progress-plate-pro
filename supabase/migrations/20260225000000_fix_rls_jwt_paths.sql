-- ============================================================================
-- Migration: Fix RLS JWT Paths
-- Date: 2026-02-25
-- Description: Drop and recreate ALL RLS policies on workout_sessions,
--   profiles, session_analytics, and exercise_index tables.
--
-- CRITICAL FIX: All existing policies incorrectly reference the username
-- claim via:
--     auth.jwt() ->> 'username'
--
-- Supabase stores custom user data inside user_metadata, so the correct
-- path is:
--     auth.jwt() -> 'user_metadata' ->> 'username'
--
-- This migration also:
--   * Adds admin bypass policies using the user_roles table
--   * Restricts exercise_index mutations to admins only
--   * Makes profiles SELECT restricted to own row (not public)
--   * Ensures the migration is fully idempotent (DROP IF EXISTS + re-enable)
-- ============================================================================

-- ============================================================================
-- SECTION 0: Helper expression reference
-- ============================================================================
-- Throughout this file we use the following expression to extract the
-- authenticated user's username from the JWT:
--
--   auth.jwt() -> 'user_metadata' ->> 'username'
--
-- And the following sub-select to determine admin status:
--
--   EXISTS (
--     SELECT 1 FROM public.user_roles
--     WHERE user_id = auth.uid() AND role = 'admin'
--   )
-- ============================================================================


-- ============================================================================
-- SECTION 1: Enable RLS on all tables (idempotent -- safe to run repeatedly)
-- ============================================================================

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_index ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- SECTION 2: workout_sessions policies
-- ============================================================================
-- Users can SELECT, INSERT, UPDATE, DELETE their own rows.
-- Admins can access all rows.
-- ============================================================================

-- 2a. SELECT
DROP POLICY IF EXISTS "Users can view their own workout sessions" ON public.workout_sessions;

CREATE POLICY "Users can view their own workout sessions"
ON public.workout_sessions
FOR SELECT
USING (
  username = (auth.jwt() -> 'user_metadata' ->> 'username')
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2b. INSERT
DROP POLICY IF EXISTS "Users can create their own workout sessions" ON public.workout_sessions;

CREATE POLICY "Users can create their own workout sessions"
ON public.workout_sessions
FOR INSERT
WITH CHECK (
  username = (auth.jwt() -> 'user_metadata' ->> 'username')
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2c. UPDATE
DROP POLICY IF EXISTS "Users can update their own workout sessions" ON public.workout_sessions;

CREATE POLICY "Users can update their own workout sessions"
ON public.workout_sessions
FOR UPDATE
USING (
  username = (auth.jwt() -> 'user_metadata' ->> 'username')
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2d. DELETE
DROP POLICY IF EXISTS "Users can delete their own workout sessions" ON public.workout_sessions;

CREATE POLICY "Users can delete their own workout sessions"
ON public.workout_sessions
FOR DELETE
USING (
  username = (auth.jwt() -> 'user_metadata' ->> 'username')
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);


-- ============================================================================
-- SECTION 3: profiles policies
-- ============================================================================
-- Users can SELECT and UPDATE their own profile row only.
-- Admins can access all rows.
-- NOTE: INSERT is handled by the handle_new_workout_session() trigger
-- which runs as SECURITY DEFINER, so no INSERT policy is needed for
-- regular users. Admins get an explicit INSERT policy.
-- ============================================================================

-- 3a. SELECT (own row only)
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile only"
ON public.profiles
FOR SELECT
USING (
  username = (auth.jwt() -> 'user_metadata' ->> 'username')
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 3b. UPDATE (own row only)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (
  username = (auth.jwt() -> 'user_metadata' ->> 'username')
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 3c. INSERT (admin only -- normal user profiles are created by trigger)
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON public.profiles;

CREATE POLICY "Admins can create profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 3d. DELETE (admin only)
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);


-- ============================================================================
-- SECTION 4: session_analytics policies
-- ============================================================================
-- Users can SELECT and INSERT their own rows.
-- Admins can access all rows.
-- ============================================================================

-- 4a. SELECT (own rows)
DROP POLICY IF EXISTS "Users can view their own session analytics only" ON public.session_analytics;
DROP POLICY IF EXISTS "Session analytics viewable by everyone" ON public.session_analytics;

CREATE POLICY "Users can view their own session analytics only"
ON public.session_analytics
FOR SELECT
USING (
  username = (auth.jwt() -> 'user_metadata' ->> 'username')
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4b. INSERT (own rows)
DROP POLICY IF EXISTS "Users can create session analytics" ON public.session_analytics;

CREATE POLICY "Users can create session analytics"
ON public.session_analytics
FOR INSERT
WITH CHECK (
  username = (auth.jwt() -> 'user_metadata' ->> 'username')
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4c. UPDATE (admin only)
DROP POLICY IF EXISTS "Admins can update session analytics" ON public.session_analytics;

CREATE POLICY "Admins can update session analytics"
ON public.session_analytics
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4d. DELETE (admin only)
DROP POLICY IF EXISTS "Admins can delete session analytics" ON public.session_analytics;

CREATE POLICY "Admins can delete session analytics"
ON public.session_analytics
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);


-- ============================================================================
-- SECTION 5: exercise_index policies
-- ============================================================================
-- Everyone (authenticated) can SELECT exercises.
-- Only admins can UPDATE and DELETE exercises.
-- INSERT is also restricted to admins to control the exercise catalog.
-- ============================================================================

-- 5a. SELECT (everyone)
DROP POLICY IF EXISTS "Exercise index is viewable by everyone" ON public.exercise_index;

CREATE POLICY "Exercise index is viewable by everyone"
ON public.exercise_index
FOR SELECT
USING (true);

-- 5b. INSERT (admin only)
DROP POLICY IF EXISTS "Users can create exercises" ON public.exercise_index;
DROP POLICY IF EXISTS "Admins can create exercises" ON public.exercise_index;

CREATE POLICY "Admins can create exercises"
ON public.exercise_index
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5c. UPDATE (admin only)
DROP POLICY IF EXISTS "Users can update their own exercises" ON public.exercise_index;
DROP POLICY IF EXISTS "Admins can update exercises" ON public.exercise_index;

CREATE POLICY "Admins can update exercises"
ON public.exercise_index
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5d. DELETE (admin only)
DROP POLICY IF EXISTS "Users can delete their own exercises" ON public.exercise_index;
DROP POLICY IF EXISTS "Admins can delete exercises" ON public.exercise_index;

CREATE POLICY "Admins can delete exercises"
ON public.exercise_index
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);


-- ============================================================================
-- SECTION 6: Update the is_admin() helper function to use the correct JWT path
-- ============================================================================
-- The existing is_admin() function also uses the wrong JWT path. Fix it here
-- so any code calling is_admin() gets the correct behavior.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin(check_username TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  target_username TEXT;
BEGIN
  target_username := COALESCE(check_username, auth.jwt() -> 'user_metadata' ->> 'username');

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE username = target_username
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;


-- ============================================================================
-- DONE
-- ============================================================================
-- Summary of changes:
--   * Corrected JWT path from: auth.jwt() ->> 'username'
--                          to: auth.jwt() -> 'user_metadata' ->> 'username'
--   * workout_sessions: SELECT, INSERT, UPDATE, DELETE (own rows + admin bypass)
--   * profiles: SELECT, UPDATE (own row + admin bypass), INSERT/DELETE (admin only)
--   * session_analytics: SELECT, INSERT (own rows + admin bypass), UPDATE/DELETE (admin only)
--   * exercise_index: SELECT (everyone), INSERT/UPDATE/DELETE (admin only)
--   * Updated is_admin() function to use correct JWT path
-- ============================================================================
