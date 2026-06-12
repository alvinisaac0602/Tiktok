-- ============================================================
-- MIGRATION 001: Analytics, COD, Dispatched + Vendor phone
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- 1. Add payment_method to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'online'
    CHECK (payment_method IN ('online', 'cod'));

-- 2. Expand order status CHECK to include pending_cod, dispatched
-- Drop the existing inline check constraint (Postgres auto-names it)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname  = 'orders'
      AND con.contype  = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
    CHECK (status IN (
      'pending_payment',
      'pending_cod',
      'paid',
      'processing',
      'dispatched',
      'cancelled',
      'failed'
    ));

-- 3. Add store contact + description to vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS store_phone       TEXT,
  ADD COLUMN IF NOT EXISTS store_whatsapp    TEXT,
  ADD COLUMN IF NOT EXISTS store_description TEXT;

-- 4. Analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type   TEXT NOT NULL,
    -- 'link_click'|'page_view'|'checkout_start'|'order_placed'|'payment_success'|'dispatched'
  product_id   UUID REFERENCES public.products(id) ON DELETE SET NULL,
  vendor_id    UUID REFERENCES public.vendors(id)  ON DELETE SET NULL,
  creator_ref  TEXT,
  order_id     UUID REFERENCES public.orders(id)   ON DELETE SET NULL,
  session_id   TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ae_vendor_idx    ON public.analytics_events(vendor_id);
CREATE INDEX IF NOT EXISTS ae_product_idx   ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS ae_creator_idx   ON public.analytics_events(creator_ref);
CREATE INDEX IF NOT EXISTS ae_type_idx      ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS ae_created_idx   ON public.analytics_events(created_at DESC);

-- 5. RLS for analytics
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_public_insert" ON public.analytics_events;
CREATE POLICY "analytics_public_insert" ON public.analytics_events
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "analytics_vendor_select" ON public.analytics_events;
CREATE POLICY "analytics_vendor_select" ON public.analytics_events
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

-- 6. Admin can see all orders, vendors, products
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "vendors_admin_all" ON public.vendors;
CREATE POLICY "vendors_admin_all" ON public.vendors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "users_admin_all" ON public.users;
CREATE POLICY "users_admin_all" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u2 WHERE u2.id = auth.uid() AND u2.role = 'admin')
  );

DROP POLICY IF EXISTS "analytics_admin_all" ON public.analytics_events;
CREATE POLICY "analytics_admin_all" ON public.analytics_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Update commission trigger to also handle dispatched COD orders
CREATE OR REPLACE FUNCTION public.handle_order_paid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Fire when: online → paid, or COD → dispatched (treated as completed)
  IF (NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.creator_id IS NOT NULL)
  OR (NEW.status = 'dispatched' AND OLD.status = 'pending_cod' AND NEW.creator_id IS NOT NULL)
  THEN
    INSERT INTO public.commissions (creator_id, order_id, amount, rate)
    VALUES (
      NEW.creator_id,
      NEW.id,
      NEW.total_amount * 0.05,
      0.05
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 8. Realtime for analytics
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
