-- Fix critical RLS policy vulnerabilities

-- 1. Fix workout_sessions DELETE policy - remove dangerous OR clause
DROP POLICY "Users can delete their own workout sessions" ON public.workout_sessions;

CREATE POLICY "Users can delete their own workout sessions" 
ON public.workout_sessions 
FOR DELETE 
USING (username = (auth.jwt() ->> 'username'::text));

-- 2. Fix workout_sessions UPDATE policy - remove dangerous OR clause  
DROP POLICY "Users can update their own workout sessions" ON public.workout_sessions;

CREATE POLICY "Users can update their own workout sessions" 
ON public.workout_sessions 
FOR UPDATE 
USING (username = (auth.jwt() ->> 'username'::text));

-- 3. Fix profiles UPDATE policy - ensure users can only update their own profile
DROP POLICY "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (username = (auth.jwt() ->> 'username'::text));

-- 4. Fix session_analytics INSERT policy - ensure users can only create their own data
DROP POLICY "Users can create session analytics" ON public.session_analytics;

CREATE POLICY "Users can create session analytics" 
ON public.session_analytics 
FOR INSERT 
WITH CHECK (username = (auth.jwt() ->> 'username'::text));

-- 5. Create user roles table for admin access control
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(username)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (username = (auth.jwt() ->> 'username'::text));

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(check_username TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  target_username TEXT;
BEGIN
  target_username := COALESCE(check_username, auth.jwt() ->> 'username');
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE username = target_username 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Add trigger for user_roles timestamp updates
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();