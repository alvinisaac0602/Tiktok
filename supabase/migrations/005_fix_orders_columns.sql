-- ============================================================
-- MIGRATION 005: Fix Orders Columns and Database Synchronization
-- Run this in your Supabase SQL Editor.
-- This renames old columns (phone, amount, location) to match
-- the new React frontend model, adds missing fields, and updates
-- triggers/RLS policies.
-- ============================================================

-- 1. Rename existing old columns safely if they exist
DO $$
BEGIN
  -- Rename phone to customer_phone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='phone'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN phone TO customer_phone;
  END IF;

  -- Rename amount to total_amount
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='amount'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN amount TO total_amount;
  END IF;

  -- Rename location to customer_location_zone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='location'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN location TO customer_location_zone;
  END IF;
END $$;

-- 2. Add new columns if they do not already exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS creator_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_location_detail TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_lat DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_lng DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Set not-null constraints if needed (but allow transition of existing null values)
ALTER TABLE public.orders ALTER COLUMN customer_phone SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN total_amount SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN customer_location_zone SET NOT NULL;

-- 4. Re-create triggers and functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Re-create RLS policies for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_vendor_select" ON public.orders;
CREATE POLICY "orders_vendor_select" ON public.orders
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
CREATE POLICY "orders_public_insert" ON public.orders
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "orders_vendor_update" ON public.orders;
CREATE POLICY "orders_vendor_update" ON public.orders
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
