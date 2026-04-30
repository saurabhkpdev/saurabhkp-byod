CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('data_upload', 'data_manipulation')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by uuid NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  file_name text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  column_count integer NOT NULL DEFAULT 0,
  data jsonb,
  changes jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_submitted_by ON public.approval_requests(submitted_by);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Submitters can view their own requests; admins can view all
CREATE POLICY "Submitters or admins can view approval requests"
  ON public.approval_requests
  FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- Any authenticated user can submit a request (as themselves)
CREATE POLICY "Authenticated users can submit approval requests"
  ON public.approval_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- Only admins can approve/reject (UPDATE)
CREATE POLICY "Admins can review approval requests"
  ON public.approval_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can delete
CREATE POLICY "Admins can delete approval requests"
  ON public.approval_requests
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- updated_at trigger
CREATE TRIGGER set_approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();