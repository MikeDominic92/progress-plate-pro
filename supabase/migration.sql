-- ============================================================
-- Big Booty Builder - Complete Database Setup
-- Paste this entire file into Supabase SQL Editor and click Run
-- ============================================================

-- 1. TABLES
-- ---------

-- User roles (maps auth.users to app usernames)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  username text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT user_roles_user_id_key UNIQUE (user_id)
);

-- Profiles (stores user stats and personal records)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  display_name text,
  total_sessions integer DEFAULT 0,
  total_workout_time integer DEFAULT 0,
  last_session_date date,
  favorite_exercises jsonb DEFAULT '[]'::jsonb,
  personal_records jsonb DEFAULT '{}'::jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Workout sessions (main session tracking)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL,
  session_date date DEFAULT CURRENT_DATE NOT NULL,
  current_phase text DEFAULT 'cardio' NOT NULL,
  cardio_completed boolean DEFAULT false,
  cardio_time text,
  cardio_calories text,
  warmup_completed boolean DEFAULT false,
  warmup_exercises_completed boolean DEFAULT false,
  warmup_mood text,
  warmup_watched_videos text[] DEFAULT '{}',
  workout_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Session analytics (per-set tracking, PRs, rest times)
CREATE TABLE IF NOT EXISTS public.session_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  username text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  duration_seconds integer,
  exercise_name text,
  set_number integer,
  weight numeric,
  reps integer,
  timestamp timestamptz DEFAULT now() NOT NULL
);

-- Exercise index (exercise library)
CREATE TABLE IF NOT EXISTS public.exercise_index (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  tier text,
  video_url text NOT NULL,
  time_segment text,
  instructions text,
  exercise_data jsonb,
  tags text[] DEFAULT '{}',
  is_custom boolean DEFAULT false,
  created_by text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);


-- Nutrition logs (per-user daily meal tracking)
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  meals jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS nutrition_logs_user_date
  ON public.nutrition_logs(user_id, log_date);


-- 2. INDEXES
-- ----------

CREATE INDEX IF NOT EXISTS idx_workout_sessions_username ON public.workout_sessions(username);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON public.workout_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_updated ON public.workout_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_analytics_session ON public.session_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_username ON public.session_analytics(username);
CREATE INDEX IF NOT EXISTS idx_session_analytics_event ON public.session_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_session_analytics_exercise_lookup
  ON public.session_analytics(username, exercise_name, event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);


-- 3. ROW LEVEL SECURITY
-- ---------------------

-- workout_sessions: RLS OFF (username-based, no auth required for simplicity)
ALTER TABLE public.workout_sessions DISABLE ROW LEVEL SECURITY;

-- user_roles: RLS ON
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read user_roles"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own role"
  ON public.user_roles FOR UPDATE
  USING (auth.uid() = user_id);

-- profiles: RLS ON
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
  ON public.profiles FOR UPDATE
  USING (true);

-- session_analytics: RLS ON
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read session_analytics"
  ON public.session_analytics FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert session_analytics"
  ON public.session_analytics FOR INSERT
  WITH CHECK (true);

-- exercise_index: RLS ON
ALTER TABLE public.exercise_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exercise_index"
  ON public.exercise_index FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert exercise_index"
  ON public.exercise_index FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update exercise_index"
  ON public.exercise_index FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete exercise_index"
  ON public.exercise_index FOR DELETE
  USING (true);


-- nutrition_logs: RLS ON (user-scoped)
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own nutrition logs"
  ON public.nutrition_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition logs"
  ON public.nutrition_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition logs"
  ON public.nutrition_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition logs"
  ON public.nutrition_logs FOR DELETE
  USING (auth.uid() = user_id);


-- 4. FUNCTIONS
-- ------------

-- is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(check_username text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF check_username IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE username = check_username AND role = 'admin'
    );
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;


-- 5. TRIGGER: Auto-create profile when a new session is inserted
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (username, last_session_date, total_sessions)
  VALUES (NEW.username, NEW.session_date, 1)
  ON CONFLICT (username) DO UPDATE
  SET
    last_session_date = NEW.session_date,
    total_sessions = profiles.total_sessions + 1,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_session_created ON public.workout_sessions;
CREATE TRIGGER on_session_created
  AFTER INSERT ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_session();


-- 6. AUTO-CONFIRM EMAILS (so Kara can auto-sign-up without email verification)
-- -----------------------------------------------------------------------------
-- This cannot be done via SQL. You must do this in the dashboard:
--   Go to: Authentication > Providers > Email
--   Turn OFF "Confirm email"
--
-- OR go to: https://supabase.com/dashboard/project/yidrdfhiouaeybmrjwnd/auth/providers
-- and disable email confirmation there.


-- Done! All tables, indexes, policies, and triggers are set up.
