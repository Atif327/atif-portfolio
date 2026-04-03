-- Migration: Add reviews table for SEO trust signals and review moderation

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_email_unique
  ON public.reviews (lower(email));

CREATE INDEX IF NOT EXISTS idx_reviews_approved_created_at
  ON public.reviews (approved, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_select_approved ON public.reviews;
CREATE POLICY reviews_select_approved
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (approved = true);

DROP POLICY IF EXISTS reviews_insert_public ON public.reviews;
CREATE POLICY reviews_insert_public
  ON public.reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
