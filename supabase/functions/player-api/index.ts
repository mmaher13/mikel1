import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
        return new Response(JSON.stringify({ error: "Invalid code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: player, error } = await supabase
        .from("players")
        .select("id, name, code, is_active")
        .eq("code", code.trim().toUpperCase())
        .single();

      if (error || !player || !player.is_active) {
        return new Response(JSON.stringify({ error: "Invalid code" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ player: { id: player.id, name: player.name } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "track-location") {
      const { player_id, latitude, longitude } = data;
      if (!player_id || typeof latitude !== "number" || typeof longitude !== "number") {
        return new Response(JSON.stringify({ error: "Invalid data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase.from("player_locations").insert({
        player_id,
        latitude,
        longitude,
      });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Cleanup locations older than 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      await supabase
        .from("player_locations")
        .delete()
        .lt("recorded_at", weekAgo.toISOString());

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "attempt-challenge") {
      const { player_id, challenge_id, password, latitude, longitude } = data;
      if (!player_id || !challenge_id || !password) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get challenge
      const { data: challenge, error: cErr } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challenge_id)
        .single();

      if (cErr || !challenge) {
        return new Response(JSON.stringify({ error: "Challenge not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check proximity
      if (typeof latitude === "number" && typeof longitude === "number") {
        const dist = haversine(latitude, longitude, challenge.latitude, challenge.longitude);
        if (dist > challenge.radius_meters) {
          return new Response(
            JSON.stringify({ error: "Too far from challenge location", distance: Math.round(dist) }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(JSON.stringify({ error: "Location required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check password
      if (password.toLowerCase().trim() !== challenge.password.toLowerCase().trim()) {
        return new Response(JSON.stringify({ error: "Wrong password" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

      return new Response(
        JSON.stringify({
          success: true,
          letter: challenge.letter,
          gift: challenge.gift_description,
          challenge_title: challenge.title,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
