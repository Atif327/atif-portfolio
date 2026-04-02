-- Migration: Persist education records for portfolio and admin panel

CREATE TABLE IF NOT EXISTS public.portfolio_education (
  id text PRIMARY KEY,
  title text NOT NULL,
  institution text NOT NULL,
  status text,
  academic_meta jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration text,
  progress integer NOT NULL DEFAULT 0,
  icon text,
  theme text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_education ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portfolio_education_select_public ON public.portfolio_education;
CREATE POLICY portfolio_education_select_public
  ON public.portfolio_education
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS portfolio_education_insert_public ON public.portfolio_education;
CREATE POLICY portfolio_education_insert_public
  ON public.portfolio_education
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS portfolio_education_update_public ON public.portfolio_education;
CREATE POLICY portfolio_education_update_public
  ON public.portfolio_education
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS portfolio_education_delete_public ON public.portfolio_education;
CREATE POLICY portfolio_education_delete_public
  ON public.portfolio_education
  FOR DELETE
  TO anon, authenticated
  USING (true);
