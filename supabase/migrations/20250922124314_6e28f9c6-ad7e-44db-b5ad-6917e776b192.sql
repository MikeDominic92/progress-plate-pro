-- Fix the search path security warning for the function
CREATE OR REPLACE FUNCTION public.handle_new_workout_session()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (username, last_session_date, total_sessions)
  VALUES (NEW.username, NEW.session_date, 1)
  ON CONFLICT (username) 
  DO UPDATE SET 
    last_session_date = NEW.session_date,
    total_sessions = profiles.total_sessions + 1,
    updated_at = now();
  RETURN NEW;
END;
$$;