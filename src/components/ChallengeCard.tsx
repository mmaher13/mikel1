import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Lock, Unlock, Sparkles } from "lucide-react";

interface ChallengeCardProps {
  number: number;
  challenge: string;
  letter: string;
  isUnlocked: boolean;
  isActive: boolean;
  onUnlock: (password: string) => boolean;
}

const ChallengeCard = ({ number, challenge, letter, isUnlocked, isActive, onUnlock }: ChallengeCardProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onUnlock(password);
    if (!success) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={`glass-card rounded-2xl p-6 md:p-8 transition-all duration-500 ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
      style={shake ? { animation: "shake 0.4s ease-in-out" } : {}}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          {isUnlocked ? (
            <Unlock className="w-5 h-5 text-primary" />
          ) : (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <h3 className="font-display text-xl md:text-2xl text-foreground">
          Challenge #{number}
        </h3>
        {isUnlocked && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto text-2xl font-display font-bold text-primary"
          >
            {letter}
          </motion.span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isUnlocked ? (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-lg font-body text-foreground/90 leading-relaxed pl-[52px]">
              {challenge}
            </p>
            <div className="mt-3 pl-[52px]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                <Sparkles className="w-3.5 h-3.5" /> Unlocked
              </span>
            </div>
          </motion.div>
        ) : isActive ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="pl-[52px]"
          >
            <p className="text-muted-foreground mb-3 font-body italic">
              Please enter the password for challenge #{number}...
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="flex-1 px-4 py-2.5 rounded-xl bg-background/80 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 font-body transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body font-medium hover:opacity-90 transition-opacity"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm mt-2 font-body"
              >
                Wrong password, try again! 💔
              </motion.p>
            )}
          </motion.form>
        ) : (
          <motion.p
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground pl-[52px] font-body italic"
          >
            Complete the previous challenge first...
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChallengeCard;
