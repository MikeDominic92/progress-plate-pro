-- Fix security vulnerability: Restrict session_analytics table access to own data only
DROP POLICY "Session analytics viewable by everyone" ON public.session_analytics;

-- Create new restrictive policy that only allows users to view their own analytics data
CREATE POLICY "Users can view their own session analytics only" 
ON public.session_analytics 
FOR SELECT 
USING (username = (auth.jwt() ->> 'username'::text));