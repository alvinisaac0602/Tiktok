-- ============================================================
-- MIGRATION 006: Add Missing Foreign Key Relationships
-- Run this in your Supabase SQL Editor.
-- This ensures that the relationships between products -> vendors,
-- orders -> products, and orders -> vendors are registered in the
-- database schema cache so that React joins can query them successfully.
-- ============================================================

-- 1. Add vendor_id constraint to products
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_vendor_id_fkey;
ALTER TABLE public.products
  ADD CONSTRAINT products_vendor_id_fkey
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

-- 2. Add product_id constraint to orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- 3. Add vendor_id constraint to orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_vendor_id_fkey;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_vendor_id_fkey
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

-- 4. Add order_id constraint to payments
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_order_id_fkey;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- 5. Add order_id constraint to commissions
ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_order_id_fkey;
ALTER TABLE public.commissions
  ADD CONSTRAINT commissions_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- 6. Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
