-- Enable RLS on files table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Users can view their own files and public files
CREATE POLICY "Users can view own files and public files"
ON public.files
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_public = true
);

-- Users can insert their own files
CREATE POLICY "Users can insert own files"
ON public.files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own files
CREATE POLICY "Users can update own files"
ON public.files
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON public.files
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to update storage_used in profiles when files change
CREATE OR REPLACE FUNCTION public.update_storage_used()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET storage_used = COALESCE(storage_used, 0) + NEW.size
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET storage_used = GREATEST(COALESCE(storage_used, 0) - OLD.size, 0)
    WHERE id = OLD.user_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.size != NEW.size THEN
    UPDATE profiles
    SET storage_used = GREATEST(COALESCE(storage_used, 0) - OLD.size + NEW.size, 0)
    WHERE id = NEW.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_storage_on_file_change
AFTER INSERT OR UPDATE OR DELETE ON public.files
FOR EACH ROW
EXECUTE FUNCTION public.update_storage_used();