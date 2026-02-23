
-- Enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table (for admin auth via Supabase Auth)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles: only admins can read
CREATE POLICY "Admins can read roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Players table (code-based login, no Supabase auth)
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Admins can manage players
CREATE POLICY "Admins can manage players" ON public.players
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Players can read their own record (via edge function, but allow select for flexibility)
CREATE POLICY "Public can read players by code" ON public.players
  FOR SELECT TO anon
  USING (true);

-- Challenges table (admin-managed, location-based)
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  password TEXT NOT NULL,
  gift_description TEXT,
  letter TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Admins can manage challenges
CREATE POLICY "Admins can manage challenges" ON public.challenges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can read active challenges (players need to see them)
CREATE POLICY "Anyone can read active challenges" ON public.challenges
  FOR SELECT TO anon
  USING (is_active = true);

-- Player progress
CREATE TABLE public.player_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, challenge_id)
);
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage progress" ON public.player_progress
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anon can read progress" ON public.player_progress
  FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert progress" ON public.player_progress
  FOR INSERT TO anon WITH CHECK (true);

-- Player locations (GPS tracking)
CREATE TABLE public.player_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.player_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read locations" ON public.player_locations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anon can insert locations" ON public.player_locations
  FOR INSERT TO anon WITH CHECK (true);

-- Enable realtime for player_locations so admin can see live
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_locations;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
