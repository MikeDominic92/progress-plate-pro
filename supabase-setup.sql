-- ============================================================
-- Big Booty Builder - Complete Database Setup
-- Paste this entire file into Supabase SQL Editor and click Run
-- ============================================================

-- 1. TABLES
-- ---------

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  username text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT user_roles_user_id_key UNIQUE (user_id)
);

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

CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  meals jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS nutrition_logs_user_date ON public.nutrition_logs(user_id, log_date);


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

ALTER TABLE public.workout_sessions DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

-- user_roles policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read user_roles') THEN
    CREATE POLICY "Anyone can read user_roles" ON public.user_roles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own role') THEN
    CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own role') THEN
    CREATE POLICY "Users can update own role" ON public.user_roles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- profiles policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read profiles') THEN
    CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert profiles') THEN
    CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update profiles') THEN
    CREATE POLICY "Anyone can update profiles" ON public.profiles FOR UPDATE USING (true);
  END IF;
END $$;

-- session_analytics policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read session_analytics') THEN
    CREATE POLICY "Anyone can read session_analytics" ON public.session_analytics FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert session_analytics') THEN
    CREATE POLICY "Anyone can insert session_analytics" ON public.session_analytics FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- exercise_index policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read exercise_index') THEN
    CREATE POLICY "Anyone can read exercise_index" ON public.exercise_index FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert exercise_index') THEN
    CREATE POLICY "Anyone can insert exercise_index" ON public.exercise_index FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update exercise_index') THEN
    CREATE POLICY "Anyone can update exercise_index" ON public.exercise_index FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete exercise_index') THEN
    CREATE POLICY "Anyone can delete exercise_index" ON public.exercise_index FOR DELETE USING (true);
  END IF;
END $$;

-- nutrition_logs policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own nutrition logs') THEN
    CREATE POLICY "Users can read own nutrition logs" ON public.nutrition_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own nutrition logs') THEN
    CREATE POLICY "Users can insert own nutrition logs" ON public.nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own nutrition logs') THEN
    CREATE POLICY "Users can update own nutrition logs" ON public.nutrition_logs FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own nutrition logs') THEN
    CREATE POLICY "Users can delete own nutrition logs" ON public.nutrition_logs FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


-- 4. FUNCTIONS
-- ------------

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


-- 5. TRIGGER
-- ----------

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

-- Done!
