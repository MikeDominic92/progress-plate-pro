-- ============================================================================
-- Migration: Create nutrition_logs Table + RLS Policies
-- Date: 2026-02-28
-- Description: Creates the nutrition_logs table that the app code references.
--   This was missing from the original migration.sql and caused all nutrition
--   features to fail silently.
-- ============================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  meals jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Unique index: one log per user per day (enables upsert)
CREATE UNIQUE INDEX IF NOT EXISTS nutrition_logs_user_date
  ON public.nutrition_logs(user_id, log_date);

-- 3. Enable RLS
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - users can only access their own nutrition logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own nutrition logs') THEN
    CREATE POLICY "Users can read own nutrition logs"
      ON public.nutrition_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own nutrition logs') THEN
    CREATE POLICY "Users can insert own nutrition logs"
      ON public.nutrition_logs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own nutrition logs') THEN
    CREATE POLICY "Users can update own nutrition logs"
      ON public.nutrition_logs FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own nutrition logs') THEN
    CREATE POLICY "Users can delete own nutrition logs"
      ON public.nutrition_logs FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
