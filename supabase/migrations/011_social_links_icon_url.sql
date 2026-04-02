-- Migration: Add custom icon URL support for social links

ALTER TABLE IF EXISTS public.social_links
ADD COLUMN IF NOT EXISTS icon_url text;
