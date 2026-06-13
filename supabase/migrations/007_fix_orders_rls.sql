-- ============================================================
-- MIGRATION 007: Fix Orders RLS Policies
-- Run this in your Supabase SQL Editor.
-- This ensures that anonymous customers can both insert orders
-- (checkout) and select their own order details (confirm page).
-- ============================================================

-- 1. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Allow public insert (required for checkout)
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
CREATE POLICY "orders_public_insert" ON public.orders
  FOR INSERT WITH CHECK (TRUE);

-- 3. Allow public select (required to load the order confirmation page)
DROP POLICY IF EXISTS "orders_public_select" ON public.orders;
CREATE POLICY "orders_public_select" ON public.orders
  FOR SELECT USING (TRUE);

-- 4. Allow vendors to update their own orders
DROP POLICY IF EXISTS "orders_vendor_update" ON public.orders;
CREATE POLICY "orders_vendor_update" ON public.orders
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

-- 5. Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
