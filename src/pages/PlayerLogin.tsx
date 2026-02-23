import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setPlayer, getPlayer } from "@/lib/playerStore";
import FloatingHearts from "@/components/FloatingHearts";

const PlayerLogin = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (getPlayer()) {
      navigate("/game", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("player-api", {
        body: { action: "login", code: code.trim() },
      });
      if (fnError || data?.error) {
        setError(data?.error || "Invalid code");
      } else {
        setPlayer(data.player);
        navigate("/game");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen romantic-gradient relative overflow-hidden flex items-center justify-center">
      <FloatingHearts />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 glass-card rounded-3xl p-8 md:p-12 max-w-md w-full mx-4"
      >
        <div className="text-center mb-8">
          <Heart className="w-10 h-10 text-primary mx-auto mb-4 heart-float fill-primary/30" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-romantic mb-2">
            Adventure Awaits
          </h1>
          <p className="text-muted-foreground font-body italic">Enter your code to begin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter your code"
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl bg-background/80 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 font-body text-center text-lg tracking-widest"
          />
          {error && <p className="text-destructive text-sm text-center font-body">{error}</p>}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Joining..." : "Join Adventure"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/admin/login")}
            className="text-muted-foreground/50 text-xs font-body hover:text-muted-foreground transition-colors"
          >
            Admin access →
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerLogin;
