-- ============================================================
-- MIGRATION 002: Auto-create Vendor Profiles via Auth Trigger
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Upgrade handle_new_user() trigger to automatically create
--    both the public.users record and the public.vendors record
--    using metadata sent from the client.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  store_slug_val TEXT;
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'store_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      role = EXCLUDED.role;

  -- If the role is vendor, auto-create their vendor profile
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'vendor' THEN
    -- Generate a clean slug
    store_slug_val := lower(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Store'), '[^a-zA-Z0-9]+', '-', 'g'));
    store_slug_val := trim(both '-' from store_slug_val);
    
    -- Ensure uniqueness of slug by appending random string if conflict occurs
    IF EXISTS (SELECT 1 FROM public.vendors WHERE store_slug = store_slug_val) THEN
      store_slug_val := store_slug_val || '-' || substr(md5(random()::text), 1, 4);
    END IF;

    BEGIN
      INSERT INTO public.vendors (user_id, store_name, store_slug, store_phone, store_whatsapp)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Store'),
        store_slug_val,
        NEW.raw_user_meta_data->>'store_phone',
        COALESCE(NEW.raw_user_meta_data->>'store_whatsapp', NEW.raw_user_meta_data->>'store_whatsapp', NEW.raw_user_meta_data->>'store_phone')
      );
    EXCEPTION WHEN OTHERS THEN
      -- Safety exception handler so auth signup is never blocked
      RAISE WARNING 'Auto-creation of vendor profile failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;
