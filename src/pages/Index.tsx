import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, PartyPopper } from "lucide-react";
import ChallengeCard from "@/components/ChallengeCard";
import FloatingHearts from "@/components/FloatingHearts";
import BackgroundMusic from "@/components/BackgroundMusic";

const CHALLENGES = [
  { challenge: "Kiss like the first time", letter: "G", password: "kiss" },
  { challenge: "Must get a stunning red dress for Valentine's dinner & a black dress for Rakele Alessandra Duval", letter: "I", password: "dress" },
  { challenge: "Upload 3 viral posts", letter: "R", password: "viral" },
  { challenge: "Train like a champion", letter: "L", password: "train" },
  { challenge: "Romantic dinner with a view", letter: "F", password: "dinner" },
  { challenge: "Swim naked in a freezing pool", letter: "R", password: "swim" },
  { challenge: "Must make a spectacular tea", letter: "I", password: "tea" },
  { challenge: "Elegant brunch", letter: "E", password: "brunch" },
  { challenge: "Get fruits, cheese, deserts, chocolate, champagne and Sweats", letter: "N", password: "sweets" },
  { challenge: "Pic nic under a magical tree", letter: "D", password: "picnic" },
];

const Index = () => {
  const [unlockedCount, setUnlockedCount] = useState(0);
  const allDone = unlockedCount === CHALLENGES.length;

  useEffect(() => {
    if (allDone) {
      import("canvas-confetti").then((mod) => {
        const confetti = mod.default;
        const duration = 3000;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      });
    }
  }, [allDone]);

  const handleUnlock = useCallback(
    (index: number) => (password: string) => {
      if (password.toLowerCase().trim() === CHALLENGES[index].password) {
        setUnlockedCount((prev) => Math.max(prev, index + 1));
        return true;
      }
      return false;
    },
    []
  );

  const revealedWord = CHALLENGES.slice(0, unlockedCount)
    .map((c) => c.letter)
    .join("");

  return (
    <div className="min-h-screen romantic-gradient relative overflow-hidden">
      <FloatingHearts />
      <BackgroundMusic />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="flex justify-center mb-4">
            <Heart className="w-10 h-10 text-primary heart-float fill-primary/30" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-romantic leading-tight mb-3">
            Mikel's First Year
            <br />
            Anniversary
          </h1>
          <p className="text-muted-foreground font-body text-lg italic">
            Complete each challenge to reveal the secret message...
          </p>

          {/* Revealed letters */}
          {unlockedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 flex justify-center gap-1.5"
            >
              {CHALLENGES.map((c, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={
                    i < unlockedCount
                      ? { opacity: 1, rotateY: 0 }
                      : { opacity: 0.2, rotateY: 0 }
                  }
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`w-9 h-11 md:w-11 md:h-13 rounded-lg flex items-center justify-center text-lg md:text-xl font-display font-bold ${
                    i < unlockedCount
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground/30"
                  }`}
                >
                  {i < unlockedCount ? c.letter : "?"}
                </motion.span>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Challenges */}
        <div className="space-y-4">
          {CHALLENGES.map((c, i) => (
            <ChallengeCard
              key={i}
              number={i + 1}
              challenge={c.challenge}
              letter={c.letter}
              isUnlocked={i < unlockedCount}
              isActive={i === unlockedCount}
              onUnlock={handleUnlock(i)}
            />
          ))}
        </div>

        {/* Completion message */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="mt-10 glass-card rounded-3xl p-8 md:p-12 text-center"
            >
              <PartyPopper className="w-12 h-12 text-accent mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold text-romantic mb-3">
                {revealedWord}
              </h2>
              <p className="text-foreground/80 font-body text-lg leading-relaxed">
                You did it! Happy first year anniversary, my love 💕
                <br />
                Here's to many more adventures together.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                {["💖", "🥂", "🌹", "✨", "💍"].map((emoji, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="text-2xl"
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-muted-foreground/50 text-sm mt-10 font-body">
          Made with ♥
        </p>
      </div>
    </div>
  );
};

export default Index;
