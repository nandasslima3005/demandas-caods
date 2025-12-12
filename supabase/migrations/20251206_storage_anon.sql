-- Allow anonymous access to attachments bucket in Supabase Storage
CREATE POLICY IF NOT EXISTS "anon_select_storage_attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

CREATE POLICY IF NOT EXISTS "anon_insert_storage_attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY IF NOT EXISTS "anon_update_storage_attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY IF NOT EXISTS "anon_delete_storage_attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'attachments');
