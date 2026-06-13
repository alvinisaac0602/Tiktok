-- ============================================================
-- MIGRATION 004: Fix Vendor RLS Policy for Public Access
-- Run this in your Supabase SQL Editor to allow customers
-- to view vendor stores and products.
-- ============================================================

-- Allow public (anonymous and authenticated customers) to view non-suspended vendors
CREATE POLICY "vendors_public_read" ON public.vendors
  FOR SELECT
  USING (suspended = FALSE);
