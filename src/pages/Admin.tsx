import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, LogOut, Plus, MapPin, Users, Gamepad2, Trash2, Edit } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import FloatingHearts from "@/components/FloatingHearts";
import LocationDayMap from "@/components/LocationDayMap";

type Challenge = Tables<"challenges">;
type Player = Tables<"players">;

interface PlayerLocation {
  id: string;
  player_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  players: { name: string } | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"challenges" | "players" | "locations">("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [locations, setLocations] = useState<PlayerLocation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    password: "",
    gift_description: "",
    letter: "",
    latitude: "",
    longitude: "",
    radius_meters: "100",
    sort_order: "0",
  });
  const [playerForm, setPlayerForm] = useState({ name: "", code: "" });
  const [showPlayerForm, setShowPlayerForm] = useState(false);

  useEffect(() => {
    checkAdmin();
    loadAll();

    // Realtime location updates
    const channel = supabase
      .channel("admin-locations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "player_locations" }, () => {
        loadLocations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/admin/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roles?.length) { navigate("/admin/login"); }
  };

  const loadAll = () => {
    loadChallenges();
    loadPlayers();
    loadLocations();
  };

  const loadChallenges = async () => {
    const { data } = await supabase.from("challenges").select("*").order("sort_order");
    if (data) setChallenges(data);
  };

  const loadPlayers = async () => {
    const { data } = await supabase.from("players").select("*").order("created_at", { ascending: false });
    if (data) setPlayers(data);
  };

  const loadLocations = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data } = await supabase
      .from("player_locations")
      .select("id, player_id, latitude, longitude, recorded_at, players(name)")
      .gte("recorded_at", weekAgo.toISOString())
      .order("recorded_at", { ascending: false });
    if (data) setLocations(data as unknown as PlayerLocation[]);
  };

  // Group locations by day for maps
  const locationsByDay = useMemo(() => {
    const days: Record<string, Array<{ id: string; player_id: string; latitude: number; longitude: number; recorded_at: string; player_name: string }>> = {};
    // Generate last 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = [];
    }
    locations.forEach((l) => {
      const key = l.recorded_at.slice(0, 10);
      if (days[key]) {
        days[key].push({
          id: l.id,
          player_id: l.player_id,
          latitude: l.latitude,
          longitude: l.longitude,
          recorded_at: l.recorded_at,
          player_name: l.players?.name || "Unknown",
        });
      }
    });
    return Object.entries(days).sort(([a], [b]) => b.localeCompare(a));
  }, [locations]);

  const parseDMS = (input: string): number | null => {
    const cleaned = input.trim();
    // Try decimal first
    const decimal = parseFloat(cleaned);
    if (!isNaN(decimal) && /^-?\d+(\.\d+)?$/.test(cleaned)) return decimal;
    // Try DMS: 9°54'53.0"N or 84°16'13.4"W
    const match = cleaned.match(/(\d+)[°]\s*(\d+)[′']\s*([\d.]+)[″"]\s*([NSEWnsew])/);
    if (match) {
      const deg = parseFloat(match[1]) + parseFloat(match[2]) / 60 + parseFloat(match[3]) / 3600;
      return (match[4].toUpperCase() === 'S' || match[4].toUpperCase() === 'W') ? -deg : deg;
    }
    return null;
  };

  const saveChallenge = async () => {
    const lat = parseDMS(form.latitude);
    const lng = parseDMS(form.longitude);
    if (lat === null || lng === null) {
      alert("Invalid coordinates. Use decimal (9.9147) or DMS (9°54'53.0\"N) format.");
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      password: form.password,
      gift_description: form.gift_description || null,
      letter: form.letter,
      latitude: lat,
      longitude: lng,
      radius_meters: parseInt(form.radius_meters) || 100,
      sort_order: parseInt(form.sort_order) || 0,
    };

    if (editingId) {
      await supabase.from("challenges").update(payload).eq("id", editingId);
    } else {
      await supabase.from("challenges").insert(payload);
    }
    resetForm();
    loadChallenges();
  };

  const editChallenge = (c: Challenge) => {
    setForm({
      title: c.title,
      description: c.description || "",
      password: c.password,
      gift_description: c.gift_description || "",
      letter: c.letter,
      latitude: String(c.latitude),
      longitude: String(c.longitude),
      radius_meters: String(c.radius_meters),
      sort_order: String(c.sort_order),
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const deleteChallenge = async (id: string) => {
    if (!confirm("Delete this challenge?")) return;
    await supabase.from("challenges").delete().eq("id", id);
    loadChallenges();
  };

  const resetForm = () => {
    setForm({ title: "", description: "", password: "", gift_description: "", letter: "", latitude: "", longitude: "", radius_meters: "100", sort_order: "0" });
    setEditingId(null);
    setShowForm(false);
  };

  const addPlayer = async () => {
    if (!playerForm.name || !playerForm.code) return;
    await supabase.from("players").insert({ name: playerForm.name, code: playerForm.code.toUpperCase() });
    setPlayerForm({ name: "", code: "" });
    setShowPlayerForm(false);
    loadPlayers();
  };

  const deletePlayer = async (id: string) => {
    if (!confirm("Delete this player?")) return;
    await supabase.from("players").delete().eq("id", id);
    loadPlayers();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const tabs = [
    { key: "challenges" as const, label: "Challenges", icon: Gamepad2 },
    { key: "players" as const, label: "Players", icon: Users },
    { key: "locations" as const, label: "Locations", icon: MapPin },
  ];

  return (
    <div className="min-h-screen romantic-gradient relative overflow-hidden">
      <FloatingHearts />
      <header className="relative z-10 glass-card rounded-none px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary fill-primary/30" />
          <h1 className="font-display text-lg font-bold text-romantic">Admin Console</h1>
        </div>
        <button onClick={logout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="relative z-10 flex glass-card rounded-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-body flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* CHALLENGES TAB */}
        {tab === "challenges" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl font-bold text-romantic">Challenges</h2>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-body flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {showForm && (
              <div className="glass-card rounded-2xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                  <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                  <input placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                  <input placeholder="Letter" value={form.letter} maxLength={3} onChange={(e) => setForm({ ...form, letter: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                  <input placeholder="Gift description" value={form.gift_description} onChange={(e) => setForm({ ...form, gift_description: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                  <input placeholder="Lat (e.g. 9°54'53.0&quot;N or 9.9147)" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                  <input placeholder="Lng (e.g. 84°16'13.4&quot;W or -84.2704)" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                  <input placeholder="Radius (m)" type="number" value={form.radius_meters} onChange={(e) => setForm({ ...form, radius_meters: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                  <input placeholder="Sort order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveChallenge} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-body">
                    {editingId ? "Update" : "Create"}
                  </button>
                  <button onClick={resetForm} className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-body">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {challenges.map((c) => (
                <div key={c.id} className="glass-card rounded-2xl p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-body">#{c.sort_order}</span>
                      <span className="font-display font-bold text-foreground">{c.title}</span>
                      <span className="text-primary font-bold font-display">[{c.letter}]</span>
                    </div>
                    <p className="text-muted-foreground text-sm font-body mt-1">{c.description}</p>
                    <p className="text-muted-foreground/60 text-xs font-body mt-1">
                      📍 {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)} • {c.radius_meters}m radius • pw: {c.password}
                    </p>
                    {c.gift_description && (
                      <p className="text-accent text-xs font-body mt-1">🎁 {c.gift_description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => editChallenge(c)} className="p-2 text-muted-foreground hover:text-foreground"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteChallenge(c.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {challenges.length === 0 && (
                <p className="text-muted-foreground text-center py-8 font-body">No challenges yet. Add one!</p>
              )}
            </div>
          </div>
        )}

        {/* PLAYERS TAB */}
        {tab === "players" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl font-bold text-romantic">Players</h2>
              <button
                onClick={() => setShowPlayerForm(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-body flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Player
              </button>
            </div>

            {showPlayerForm && (
              <div className="glass-card rounded-2xl p-4 mb-4 space-y-3">
                <input placeholder="Player name" value={playerForm.name} onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                <input placeholder="Access code (e.g. LOVE2024)" value={playerForm.code} onChange={(e) => setPlayerForm({ ...playerForm, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-body" />
                <div className="flex gap-2">
                  <button onClick={addPlayer} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-body">Create</button>
                  <button onClick={() => setShowPlayerForm(false)} className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-body">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {players.map((p) => (
                <div key={p.id} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-body font-medium text-foreground">{p.name}</p>
                    <p className="text-muted-foreground text-sm font-body">Code: <span className="font-mono text-primary">{p.code}</span></p>
                  </div>
                  <button onClick={() => deletePlayer(p.id)} className="p-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-muted-foreground text-center py-8 font-body">No players yet.</p>
              )}
            </div>
          </div>
        )}

        {/* LOCATIONS TAB */}
        {tab === "locations" && (
          <div>
            <h2 className="font-display text-xl font-bold text-romantic mb-2">Player Locations</h2>
            <p className="text-muted-foreground text-sm font-body mb-4">Last 7 days of GPS tracking (updates every 15 min)</p>
            <div className="space-y-4">
              {locationsByDay.map(([date, locs]) => (
                <LocationDayMap key={date} date={date} locations={locs} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
