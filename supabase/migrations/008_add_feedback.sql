-- ============================================================
-- MIGRATION 008: Add Feedback Table
-- Run this in your Supabase SQL Editor.
-- This creates a feedback table where customers/users can submit
-- feedback from the landing page and vendor store pages.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source      TEXT NOT NULL, -- 'landing_page' | 'store_page'
  store_slug  TEXT,          -- optional, if submitted from a store page
  name        TEXT,
  email       TEXT,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 2. Allow anyone (public/anonymous) to insert feedback
DROP POLICY IF EXISTS "feedback_insert_public" ON public.feedback;
CREATE POLICY "feedback_insert_public" ON public.feedback
  FOR INSERT WITH CHECK (true);

-- 3. Allow admins to select and view feedback
DROP POLICY IF EXISTS "feedback_select_admin" ON public.feedback;
CREATE POLICY "feedback_select_admin" ON public.feedback
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- 4. Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
