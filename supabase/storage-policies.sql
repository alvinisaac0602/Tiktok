-- ============================================
-- Storage policies for "product-images" bucket
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Allow anyone to VIEW/download images (public read)
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- 2. Allow logged-in users to UPLOAD images
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 3. Allow logged-in users to UPDATE their own uploads
CREATE POLICY "Authenticated users can update own images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 4. Allow logged-in users to DELETE their own uploads
CREATE POLICY "Authenticated users can delete own images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);
