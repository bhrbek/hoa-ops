-- Create storage bucket for rock attachments (images, files)
-- Note: Bucket creation via SQL may not work in all Supabase environments
-- If this fails, create the bucket manually via Supabase Dashboard

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rock-attachments',
  'rock-attachments',
  true,  -- Public so images can be displayed without signed URLs
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload rock attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'rock-attachments');

-- RLS Policy: Anyone can read (public bucket for displaying images)
CREATE POLICY "Anyone can read rock attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'rock-attachments');

-- RLS Policy: Users can update their own uploads
CREATE POLICY "Users can update own rock attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'rock-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS Policy: Users can delete their own uploads
CREATE POLICY "Users can delete own rock attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'rock-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
