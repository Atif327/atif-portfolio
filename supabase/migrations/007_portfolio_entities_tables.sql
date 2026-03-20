-- Migration: Persist services, projects, and social links for admin panel

CREATE TABLE IF NOT EXISTS public.portfolio_services (
  id text PRIMARY KEY,
  title text NOT NULL,
  short_description text,
  full_description text,
  icon text,
  rate text,
  category text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id text PRIMARY KEY,
  title text NOT NULL,
  short_description text,
  full_description text,
  thumbnail text,
  gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  technologies jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text,
  live_url text,
  github_url text,
  case_study_url text,
  project_status text,
  featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  start_date text,
  end_date text,
  client_name text,
  role text,
  highlights text,
  challenges_solutions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_links (
  id text PRIMARY KEY,
  platform text NOT NULL,
  url text NOT NULL,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portfolio_services_select_public ON public.portfolio_services;
CREATE POLICY portfolio_services_select_public
  ON public.portfolio_services
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS portfolio_services_insert_public ON public.portfolio_services;
CREATE POLICY portfolio_services_insert_public
  ON public.portfolio_services
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS portfolio_services_update_public ON public.portfolio_services;
CREATE POLICY portfolio_services_update_public
  ON public.portfolio_services
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS portfolio_services_delete_public ON public.portfolio_services;
CREATE POLICY portfolio_services_delete_public
  ON public.portfolio_services
  FOR DELETE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS portfolio_projects_select_public ON public.portfolio_projects;
CREATE POLICY portfolio_projects_select_public
  ON public.portfolio_projects
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS portfolio_projects_insert_public ON public.portfolio_projects;
CREATE POLICY portfolio_projects_insert_public
  ON public.portfolio_projects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS portfolio_projects_update_public ON public.portfolio_projects;
CREATE POLICY portfolio_projects_update_public
  ON public.portfolio_projects
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS portfolio_projects_delete_public ON public.portfolio_projects;
CREATE POLICY portfolio_projects_delete_public
  ON public.portfolio_projects
  FOR DELETE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS social_links_select_public ON public.social_links;
CREATE POLICY social_links_select_public
  ON public.social_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS social_links_insert_public ON public.social_links;
CREATE POLICY social_links_insert_public
  ON public.social_links
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS social_links_update_public ON public.social_links;
CREATE POLICY social_links_update_public
  ON public.social_links
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS social_links_delete_public ON public.social_links;
CREATE POLICY social_links_delete_public
  ON public.social_links
  FOR DELETE
  TO anon, authenticated
  USING (true);
