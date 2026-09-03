import { useCallback, useEffect, useRef, useState } from "react";
import { VolumeX } from "lucide-react";

declare global {
  interface Window {
    __playWeddingMusic?: () => Promise<boolean>;
  }
}

export const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const startMusic = useCallback(async (): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      // 1. Resume / Unlock Web Audio Context if present (unlocks iOS/Android audio subsystem)
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === "suspended") {
          await audioCtxRef.current.resume();
        }
      }

      // 2. Ensure volume is audible (0.75 for Android / desktop)
      try {
        audio.volume = 0.75;
      } catch {
        // iOS Safari uses hardware buttons only
      }

      // 3. Load if needed
      if (audio.readyState === 0) {
        audio.load();
      }

      await audio.play();
      setIsPlaying(true);
      return true;
    } catch (err) {
      console.warn("Mobile audio waiting for user interaction:", err);
      setIsPlaying(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = true;
      audio.preload = "metadata";
    }

    window.__playWeddingMusic = startMusic;

    // 1. Attempt immediate playback
    startMusic();

    // 2. Also attempt on window load
    const onWindowLoad = () => {
      startMusic();
    };
    if (document.readyState === "complete") {
      startMusic();
    } else {
      window.addEventListener("load", onWindowLoad, { once: true });
    }

    // 3. Listen for first user touch/click to unlock and start audio
    const handleFirstInteraction = async () => {
      const ok = await startMusic();
      if (ok) {
        removeInteractionListeners();
      }
    };

    const removeInteractionListeners = () => {
      const opts = { capture: true };
      window.removeEventListener("touchstart", handleFirstInteraction, opts);
      window.removeEventListener("touchend", handleFirstInteraction, opts);
      window.removeEventListener("pointerdown", handleFirstInteraction, opts);
      window.removeEventListener("mousedown", handleFirstInteraction, opts);
      window.removeEventListener("click", handleFirstInteraction, opts);
      window.removeEventListener("keydown", handleFirstInteraction, opts);
      window.removeEventListener("scroll", handleFirstInteraction, opts);
    };

    const opts = { capture: true };
    window.addEventListener("touchstart", handleFirstInteraction, opts);
    window.addEventListener("touchend", handleFirstInteraction, opts);
    window.addEventListener("pointerdown", handleFirstInteraction, opts);
    window.addEventListener("mousedown", handleFirstInteraction, opts);
    window.addEventListener("click", handleFirstInteraction, opts);
    window.addEventListener("keydown", handleFirstInteraction, opts);
    window.addEventListener("scroll", handleFirstInteraction, opts);

    return () => {
      removeInteractionListeners();
      window.removeEventListener("load", onWindowLoad);
      if (audio) {
        audio.pause();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [startMusic]);

  const toggleMusic = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      await startMusic();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
      <audio
        ref={audioRef}
        src="/assets/music.mp3?v=2"
        loop
        preload="metadata"
        playsInline
      />
      <button
        onClick={toggleMusic}
        aria-label={isPlaying ? "Pause background music" : "Play background music"}
        className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg border ${
          isPlaying
            ? "bg-[#4A0E17]/85 border-[#D4AF37]/50 text-[#F5CE65] shadow-[0_4px_20px_rgba(74,14,23,0.35)]"
            : "bg-[#231818]/85 border-[#D4AF37]/40 text-[#F5CE65] hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] animate-pulse"
        }`}
        style={{ cursor: "pointer" }}
      >
        {/* Animated equalizer waves when playing */}
        {isPlaying ? (
          <div className="flex items-end gap-[3px] h-3.5 w-3.5 justify-center">
            <span className="w-[2px] bg-[#F5CE65] rounded-full animate-[music-bar_0.8s_ease-in-out_infinite]" />
            <span className="w-[2px] bg-[#F5CE65] rounded-full animate-[music-bar_1.2s_ease-in-out_infinite_0.2s]" />
            <span className="w-[2px] bg-[#F5CE65] rounded-full animate-[music-bar_0.9s_ease-in-out_infinite_0.4s]" />
          </div>
        ) : (
          <VolumeX size={15} className="transition-transform group-hover:scale-110 text-[#F5CE65]" />
        )}

        <span className="text-[10px] font-sans uppercase tracking-[0.16em] pr-0.5 select-none font-medium">
          {isPlaying ? "Music" : "Play Music"}
        </span>

        {/* Pulse glow dot */}
        {isPlaying ? (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F5CE65]" />
          </span>
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F5CE65]" />
          </span>
        )}
      </button>
    </div>
  );
};

export default BackgroundMusic;
