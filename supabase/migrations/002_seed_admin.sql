-- Migration: seed an admin profile
-- USAGE: Replace <AUTH_USER_UUID> with the auth user's UUID (create the auth user first)

INSERT INTO public.users (id, email, name, role)
VALUES ('<AUTH_USER_UUID>', 'admin@gmail.com', 'Admin', 'admin')
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name  = EXCLUDED.name,
      role  = 'admin';

-- Notes:
-- 1) Create the auth user first (Supabase Dashboard → Authentication → Users → Create new user)
-- 2) Copy the created user's id (UUID) and replace <AUTH_USER_UUID> above
-- 3) Run this SQL in the Supabase SQL Editor (it runs with elevated privileges and will create the profile)
