-- Migration: Vendor invitation system for controlled signup
-- Admin generates unique invite links → vendors can only sign up with that link

CREATE TABLE IF NOT EXISTS public.vendor_invites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,  -- short/random code for URL
  used        BOOLEAN DEFAULT FALSE,
  used_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_by_admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS vendor_invites_token_idx ON public.vendor_invites(token);
CREATE INDEX IF NOT EXISTS vendor_invites_email_idx ON public.vendor_invites(email);
CREATE INDEX IF NOT EXISTS vendor_invites_used_idx ON public.vendor_invites(used);

-- RLS: Allow public to check if invite is valid (no auth needed for signup flow)
ALTER TABLE public.vendor_invites ENABLE ROW LEVEL SECURITY;

-- Public: SELECT valid (unused, not-expired) invites
CREATE POLICY "vendor_invites_public_select_valid" ON public.vendor_invites
  FOR SELECT USING (used = FALSE AND expires_at > NOW());

-- Admin: INSERT new invites
CREATE POLICY "vendor_invites_admin_insert" ON public.vendor_invites
  FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin: UPDATE own invites
CREATE POLICY "vendor_invites_admin_update" ON public.vendor_invites
  FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin: DELETE own invites
CREATE POLICY "vendor_invites_admin_delete" ON public.vendor_invites
  FOR DELETE USING (
    EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
