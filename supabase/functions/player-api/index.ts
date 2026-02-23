import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

function isValidCoord(lat: unknown, lon: unknown): boolean {
  return (
    typeof lat === "number" && typeof lon === "number" &&
    lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 &&
    isFinite(lat) && isFinite(lon)
  );
}

function errorResponse(status: number, msg = "Request failed") {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { action, ...data } = await req.json();

    if (action === "login") {
      const { code } = data;
      if (!code || typeof code !== "string" || code.length > 50) {
        return errorResponse(400);
      }
      const { data: player, error } = await supabase
        .from("players")
        .select("id, name, code, is_active")
        .eq("code", code.trim().toUpperCase())
        .single();

      if (error || !player || !player.is_active) {
        return errorResponse(401, "Invalid code");
      }
      return jsonResponse({ player: { id: player.id, name: player.name } });
    }

    if (action === "get-challenges") {
      const { data: challengeList, error: clErr } = await supabase
        .from("challenges")
        .select("id, title, description, letter, latitude, longitude, radius_meters, sort_order, gift_description")
        .eq("is_active", true)
        .order("sort_order");

      if (clErr) {
        console.error("get-challenges error:", clErr.message);
        return errorResponse(500);
      }
      return jsonResponse({ challenges: challengeList });
    }

    if (action === "get-progress") {
      const { player_id } = data;
      if (!isValidUUID(player_id)) {
        return errorResponse(400);
      }
      const { data: progressList, error: plErr } = await supabase
        .from("player_progress")
        .select("challenge_id")
        .eq("player_id", player_id);

      if (plErr) {
        console.error("get-progress error:", plErr.message);
        return errorResponse(500);
      }
      return jsonResponse({ progress: progressList });
    }

    if (action === "track-location") {
      const { player_id, latitude, longitude } = data;
      if (!isValidUUID(player_id) || !isValidCoord(latitude, longitude)) {
        return errorResponse(400);
      }

      // Verify player exists
      const { data: playerCheck } = await supabase
        .from("players")
        .select("id")
        .eq("id", player_id)
        .eq("is_active", true)
        .single();

      if (!playerCheck) {
        return errorResponse(401);
      }

      const { error } = await supabase.from("player_locations").insert({
        player_id,
        latitude,
        longitude,
      });
      if (error) {
        console.error("track-location error:", error.message);
        return errorResponse(500);
      }

      // Cleanup locations older than 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      await supabase
        .from("player_locations")
        .delete()
        .lt("recorded_at", weekAgo.toISOString());

      return jsonResponse({ success: true });
    }

    if (action === "attempt-challenge") {
      const { player_id, challenge_id, password, latitude, longitude } = data;
      if (!isValidUUID(player_id) || !isValidUUID(challenge_id)) {
        return errorResponse(400);
      }
      if (!password || typeof password !== "string" || password.length > 100) {
        return errorResponse(400);
      }
      if (!isValidCoord(latitude, longitude)) {
        return errorResponse(400, "Location required");
      }

      // Verify player exists
      const { data: playerCheck } = await supabase
        .from("players")
        .select("id")
        .eq("id", player_id)
        .eq("is_active", true)
        .single();

      if (!playerCheck) {
        return errorResponse(401);
      }

      // Get challenge
      const { data: challenge, error: cErr } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challenge_id)
        .single();

      if (cErr || !challenge) {
        return errorResponse(400);
      }

      // Check proximity
      const dist = haversine(latitude, longitude, challenge.latitude, challenge.longitude);
      if (dist > challenge.radius_meters) {
        return errorResponse(403, "Too far from challenge location");
      }

      // Check password
      if (password.toLowerCase().trim() !== challenge.password.toLowerCase().trim()) {
        return errorResponse(401, "Wrong password");
      }

      // Check if already completed
      const { data: existing } = await supabase
        .from("player_progress")
        .select("id")
        .eq("player_id", player_id)
        .eq("challenge_id", challenge_id)
        .single();

      if (!existing) {
        await supabase.from("player_progress").insert({
          player_id,
          challenge_id,
        });
      }

      return jsonResponse({
        success: true,
        letter: challenge.letter,
        gift: challenge.gift_description,
        challenge_title: challenge.title,
      });
    }

    return errorResponse(400);
  } catch (e) {
    console.error("Server error:", e);
    return errorResponse(500);
  }
});

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
