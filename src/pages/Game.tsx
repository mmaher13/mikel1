import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, PartyPopper, MapPin, LogOut, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPlayer, clearPlayer } from "@/lib/playerStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import FloatingHearts from "@/components/FloatingHearts";
import BackgroundMusic from "@/components/BackgroundMusic";
import ChallengeMapPreview from "@/components/ChallengeMapPreview";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  letter: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  sort_order: number;
  gift_description: string | null;
}

interface CompletedChallenge {
  challenge_id: string;
}

const Game = () => {
  const navigate = useNavigate();
  const player = getPlayer();
  const { position, error: geoError } = useGeolocation();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [password, setPassword] = useState("");
  const [attemptError, setAttemptError] = useState("");
  const [attemptingId, setAttemptingId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const trackIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!player) {
      navigate("/");
      return;
    }
    loadData();
  }, []);

  // Track location every 15 minutes
  useEffect(() => {
    if (!player || !position) return;

    const trackLocation = async () => {
      await supabase.functions.invoke("player-api", {
        body: {
          action: "track-location",
          player_id: player.id,
          latitude: position.latitude,
          longitude: position.longitude,
        },
      });
    };

    trackLocation(); // Track immediately
    trackIntervalRef.current = window.setInterval(trackLocation, 15 * 60 * 1000);

    return () => {
      if (trackIntervalRef.current) clearInterval(trackIntervalRef.current);
    };
  }, [player?.id, !!position]);

  const loadData = async () => {
    const [challengesRes, progressRes] = await Promise.all([
      supabase
        .from("challenges")
        .select("id, title, description, letter, latitude, longitude, radius_meters, sort_order, gift_description")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("player_progress")
        .select("challenge_id")
        .eq("player_id", player!.id),
    ]);

    if (challengesRes.data) setChallenges(challengesRes.data);
    if (progressRes.data) {
      setCompleted(new Set(progressRes.data.map((p: CompletedChallenge) => p.challenge_id)));
    }
  };

  const handleAttempt = async (challengeId: string) => {
    if (!player || !position) return;
    setLoading(true);
    setAttemptError("");

    try {
      const { data, error } = await supabase.functions.invoke("player-api", {
        body: {
          action: "attempt-challenge",
          player_id: player.id,
          challenge_id: challengeId,
          password,
          latitude: position.latitude,
          longitude: position.longitude,
        },
      });

      if (error || data?.error) {
        setAttemptError(data?.error || "Failed");
      } else {
        setCompleted((prev) => new Set([...prev, challengeId]));
        setPassword("");
        setAttemptingId(null);
        if (data.gift) {
          setGiftMessage(data.gift);
          setTimeout(() => setGiftMessage(null), 5000);
        }
      }
    } catch {
      setAttemptError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const distanceTo = (lat: number, lon: number): number | null => {
    if (!position) return null;
    const R = 6371000;
    const dLat = ((lat - position.latitude) * Math.PI) / 180;
    const dLon = ((lon - position.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((position.latitude * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const logout = () => {
    clearPlayer();
    navigate("/");
  };

  if (!player) return null;

  const allDone = challenges.length > 0 && challenges.every((c) => completed.has(c.id));
  const revealedWord = challenges
    .filter((c) => completed.has(c.id))
    .map((c) => c.letter)
    .join("");

  return (
    <div className="min-h-screen romantic-gradient relative overflow-hidden">
      <FloatingHearts />
      <BackgroundMusic />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 md:py-16">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-muted-foreground font-body text-sm">Welcome back,</p>
            <p className="font-display text-xl text-foreground font-bold">{player.name}</p>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Heart className="w-10 h-10 text-primary mx-auto mb-4 heart-float fill-primary/30" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-romantic mb-2">
            Adventure Challenges
          </h1>


          {/* Revealed letters */}
          <div className="mt-6 flex justify-center gap-1.5 flex-wrap">
            {challenges.map((c, i) => (
              <motion.span
                key={c.id}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={
                  completed.has(c.id)
                    ? { opacity: 1, rotateY: 0 }
                    : { opacity: 0.2, rotateY: 0 }
                }
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`w-9 h-11 md:w-11 md:h-13 rounded-lg flex items-center justify-center text-lg md:text-xl font-display font-bold ${
                  completed.has(c.id)
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground/30"
                }`}
              >
                {completed.has(c.id) ? c.letter : "?"}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Gift toast */}
        <AnimatePresence>
          {giftMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card rounded-2xl p-4 mb-4 flex items-center gap-3 border-2 border-accent/30"
            >
              <Gift className="w-6 h-6 text-accent flex-shrink-0" />
              <p className="font-body text-foreground">{giftMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Challenges */}
        <div className="space-y-4">
          {challenges.map((c) => {
            const dist = distanceTo(c.latitude, c.longitude);
            const isNear = dist !== null && dist <= c.radius_meters;
            const isDone = completed.has(c.id);

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDone ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    {isDone ? (
                      <Heart className="w-5 h-5 text-primary fill-primary/50" />
                    ) : (
                      <MapPin className={`w-5 h-5 ${isNear ? "text-accent" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-foreground">{c.title}</h3>
                    {dist !== null && !isDone && (
                      <p className={`text-xs font-body ${isNear ? "text-accent" : "text-muted-foreground"}`}>
                        {isNear ? "📍 You're here!" : `${dist > 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`} away`}
                      </p>
                    )}
                  </div>
                  {isDone && (
                    <span className="text-2xl font-display font-bold text-primary">{c.letter}</span>
                  )}
                </div>

                {isDone && (
                  <div className="pl-[52px]">
                    <p className="font-body text-foreground/90">{c.description || c.title}</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mt-2">
                      ✓ Completed
                    </span>
                  </div>
                )}

                {!isDone && isNear && (
                  <div className="pl-[52px] mt-2">
                    <p className="text-muted-foreground mb-3 font-body italic text-sm">
                      You're at the location! Enter the password...
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={attemptingId === c.id ? password : ""}
                        onChange={(e) => {
                          setAttemptingId(c.id);
                          setPassword(e.target.value);
                        }}
                        onFocus={() => setAttemptingId(c.id)}
                        placeholder="Password"
                        maxLength={50}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-background/80 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 font-body"
                      />
                      <button
                        onClick={() => handleAttempt(c.id)}
                        disabled={loading || !password.trim()}
                        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                    {attemptError && attemptingId === c.id && (
                      <p className="text-destructive text-sm mt-2 font-body">{attemptError}</p>
                    )}
                  </div>
                )}

                {!isDone && (
                  <div className="pl-[52px]">
                    {!isNear && (
                      <p className="text-muted-foreground font-body italic text-sm mb-2">
                        Get closer to this location to unlock...
                      </p>
                    )}
                    <ChallengeMapPreview
                      latitude={c.latitude}
                      longitude={c.longitude}
                      radiusMeters={c.radius_meters}
                      hasGps={!!position}
                      title={c.title}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Completion */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="mt-10 glass-card rounded-3xl p-8 md:p-12 text-center"
            >
              <PartyPopper className="w-12 h-12 text-accent mx-auto mb-4" />
              <h2 className="font-display text-3xl font-bold text-romantic mb-3">{revealedWord}</h2>
              <p className="text-foreground/80 font-body text-lg">
                You completed all challenges! 💕
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-muted-foreground/50 text-sm mt-10 font-body">Made with ♥</p>
      </div>
    </div>
  );
};

export default Game;
