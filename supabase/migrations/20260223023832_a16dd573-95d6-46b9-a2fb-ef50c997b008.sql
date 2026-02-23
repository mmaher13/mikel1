
-- Remove overly permissive anon INSERT policies
DROP POLICY "Anon can insert progress" ON public.player_progress;
DROP POLICY "Anon can insert locations" ON public.player_locations;
