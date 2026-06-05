-- ============================================================
-- INSTANT TIKTOK COMMERCE SYSTEM — SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor (in order)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS (mirrors Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name      TEXT,
  phone     TEXT,
  email     TEXT,
  role      TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. VENDORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_name  TEXT NOT NULL,
  store_slug  TEXT NOT NULL UNIQUE,
  suspended   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendors_user_id_idx ON public.vendors(user_id);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id   UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(12, 2) NOT NULL,
  images      TEXT[] DEFAULT '{}',
  stock       INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_vendor_id_idx ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS products_is_active_idx ON public.products(is_active);

-- ============================================================
-- 4. ORDERS (Core Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id                UUID REFERENCES public.products(id) ON DELETE SET NULL,
  vendor_id                 UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  creator_id                TEXT,          -- creator ref string e.g. "creator123"
  customer_name             TEXT,
  customer_phone            TEXT NOT NULL,
  quantity                  INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_amount              NUMERIC(12, 2) NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'pending_payment'
                              CHECK (status IN ('pending_payment','paid','processing','cancelled','failed')),
  customer_location_zone    TEXT NOT NULL,
  customer_location_detail  TEXT,
  customer_lat              DOUBLE PRECISION,
  customer_lng              DOUBLE PRECISION,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_vendor_id_idx   ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS orders_status_idx      ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx  ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_product_id_idx  ON public.orders(product_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  flw_ref    TEXT,
  tx_ref     TEXT,
  amount     NUMERIC(12, 2),
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','success','failed')),
  raw_data   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_order_id_idx ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS payments_flw_ref_idx  ON public.payments(flw_ref);

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. COMMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.commissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id  TEXT NOT NULL,
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  rate        NUMERIC(5, 4) NOT NULL DEFAULT 0.05, -- 5% default
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','paid','cancelled')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS commissions_creator_id_idx ON public.commissions(creator_id);
CREATE INDEX IF NOT EXISTS commissions_order_id_idx   ON public.commissions(order_id);

-- Auto-create commission when order becomes paid
CREATE OR REPLACE FUNCTION public.handle_order_paid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.creator_id IS NOT NULL THEN
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

DROP TRIGGER IF EXISTS on_order_paid ON public.orders;
CREATE TRIGGER on_order_paid
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_paid();

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- VENDORS — vendors see own record; public can read (for product pages)
CREATE POLICY "vendors_select_own" ON public.vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vendors_insert_own" ON public.vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vendors_update_own" ON public.vendors FOR UPDATE USING (auth.uid() = user_id);

-- PRODUCTS — public read for active products; vendors manage own
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "products_vendor_all" ON public.products
  FOR ALL USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

-- ORDERS — vendors see only their orders; insert allowed for all (customers)
CREATE POLICY "orders_vendor_select" ON public.orders
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );
CREATE POLICY "orders_public_insert" ON public.orders
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "orders_vendor_update" ON public.orders
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

-- PAYMENTS — vendor can see payments for their orders; webhook uses service role
CREATE POLICY "payments_vendor_select" ON public.payments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "payments_public_insert" ON public.payments
  FOR INSERT WITH CHECK (TRUE);

-- COMMISSIONS — creators tracked via creator_id string (no auth needed for read)
CREATE POLICY "commissions_vendor_select" ON public.commissions
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    )
  );

-- ============================================================
-- 8. REALTIME — enable for orders table
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- ============================================================
-- 9. DEMO DATA (optional — remove in production)
-- ============================================================

-- Demo vendor user (requires a real auth user to be created first)
-- INSERT INTO public.vendors (user_id, store_name, store_slug)
-- VALUES ('<your-auth-user-id>', 'TechZone UG', 'techzone-ug');

-- Demo product
-- INSERT INTO public.products (vendor_id, title, description, price, images, stock)
-- VALUES (
--   '<vendor-id>',
--   'Premium Wireless Earbuds Pro',
--   'Crystal-clear sound, 30hr battery, IPX5 waterproof.',
--   85000,
--   ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80'],
--   47
-- );
