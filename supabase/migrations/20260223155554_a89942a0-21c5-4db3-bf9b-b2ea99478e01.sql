
-- Remove public SELECT policies that expose sensitive data
DROP POLICY IF EXISTS "Anyone can read active challenges" ON public.challenges;
DROP POLICY IF EXISTS "Public can read players by code" ON public.players;
DROP POLICY IF EXISTS "Anon can read progress" ON public.player_progress;

-- Challenges: only admins can access (players use edge function)
-- Admin policy already exists as ALL

-- Players: only admins can access (login goes through edge function)
-- Admin policy already exists as ALL

-- Player progress: only admins can access (players use edge function)
-- Admin policy already exists as ALL
