-- Fix security vulnerability: Restrict profiles table access to own data only
DROP POLICY "Profiles are viewable by everyone" ON public.profiles;

-- Create new restrictive policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (username = (auth.jwt() ->> 'username'::text));