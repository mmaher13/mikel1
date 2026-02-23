import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignup) {
      const { data: signupData, error: signupError } = await supabase.auth.signUp({ email, password });
      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }
      setError("Check your email to confirm, then sign in.");
      setIsSignup(false);
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Authentication failed");
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      setError("Not authorized as admin. Ask an existing admin to grant you access.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg"
      >
        <div className="text-center mb-8">
          <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Console</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 font-body"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 font-body"
          />
          {error && <p className="text-destructive text-sm text-center font-body">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? (isSignup ? "Creating..." : "Signing in...") : (isSignup ? "Create Account" : "Sign In")}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button onClick={() => { setIsSignup(!isSignup); setError(""); }} className="text-primary text-sm font-body hover:underline">
            {isSignup ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
          <br />
          <button onClick={() => navigate("/")} className="text-muted-foreground text-sm font-body hover:text-foreground">
            ← Back to player login
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
