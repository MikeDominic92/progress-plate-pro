-- ============================================================================
-- Migration: Create meal-photos Storage Bucket
-- Date: 2026-02-27
-- Description: Creates a public Supabase Storage bucket for persisting
--   nutrition tracker meal photos. Uploads go to:
--     meal-photos/{user_id}/{date}/{meal_id}.jpg
--
--   RLS policies allow authenticated users to upload/read their own photos
--   and anyone to read via public URL.
-- ============================================================================

-- 1. Create the bucket (public so getPublicUrl works without auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own meal photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow authenticated users to update/overwrite their own photos
CREATE POLICY "Users can update their own meal photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow anyone to read photos (bucket is public)
CREATE POLICY "Anyone can read meal photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'meal-photos');

-- 5. Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own meal photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
