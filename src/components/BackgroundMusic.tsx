import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startOnInteraction = () => {
      if (audioRef.current && !started) {
        audioRef.current.volume = 0.3;
        audioRef.current.play().then(() => {
          setPlaying(true);
          setStarted(true);
        }).catch(() => {});
      }
      document.removeEventListener("click", startOnInteraction);
    };
    document.addEventListener("click", startOnInteraction);
    return () => document.removeEventListener("click", startOnInteraction);
  }, [started]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <>
      <audio ref={audioRef} loop>
        <source src="https://cdn.pixabay.com/audio/2024/11/29/audio_d4ec38f027.mp3" type="audio/mpeg" />
      </audio>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={toggle}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
        aria-label={playing ? "Mute music" : "Play music"}
      >
        {playing ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </motion.button>
    </>
  );
};

export default BackgroundMusic;
