-- Обновляем RLS политику для доступа к файлам по shared_token
DROP POLICY IF EXISTS "Users can view own files and public files" ON files;

CREATE POLICY "Users can view own files and public files"
ON files FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_public = true 
  OR shared_token IS NOT NULL
);