-- Fix RLS policies for user_roles table to use user_id instead of username
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Create new policy that uses user_id which is more reliable
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Also add insert policy for future user creation
CREATE POLICY "Users can insert their own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);