
CREATE TABLE public.data_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dataset_name TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  column_count INTEGER NOT NULL DEFAULT 0,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.data_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own versions"
ON public.data_versions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own versions"
ON public.data_versions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own versions"
ON public.data_versions FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_data_versions_user_dataset ON public.data_versions (user_id, dataset_name, version_number DESC);
