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
  const fadeIntervalRef = useRef<number | null>(null);

  const fadeInAudio = useCallback((audio: HTMLAudioElement, targetVolume = 0.4, duration = 1200) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    audio.volume = 0.05;
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = (targetVolume - 0.05) / steps;

    fadeIntervalRef.current = window.setInterval(() => {
      if (audio.volume + volumeStep >= targetVolume) {
        audio.volume = targetVolume;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      } else {
        audio.volume = Math.min(targetVolume, audio.volume + volumeStep);
      }
    }, stepTime);
  }, []);

  const startMusic = useCallback(async (): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      if (audio.paused) {
        fadeInAudio(audio, 0.4, 1200);
        await audio.play();
        setIsPlaying(true);
        return true;
      }
      return true;
    } catch {
      setIsPlaying(false);
      return false;
    }
  }, [fadeInAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = true;
      audio.preload = "auto";
    }

    window.__playWeddingMusic = startMusic;

    // 1. Attempt immediate autoplay as soon as component mounts
    startMusic();

    // 2. Also attempt autoplay on window load
    const onWindowLoad = () => {
      startMusic();
    };
    if (document.readyState === "complete") {
      startMusic();
    } else {
      window.addEventListener("load", onWindowLoad, { once: true });
    }

    // 3. Guarantee playback on very first user interaction anywhere on the document
    const handleFirstInteraction = () => {
      startMusic();
      removeInteractionListeners();
    };

    const removeInteractionListeners = () => {
      const opts = { capture: true };
      window.removeEventListener("pointerdown", handleFirstInteraction, opts);
      window.removeEventListener("touchstart", handleFirstInteraction, opts);
      window.removeEventListener("touchend", handleFirstInteraction, opts);
      window.removeEventListener("mousedown", handleFirstInteraction, opts);
      window.removeEventListener("click", handleFirstInteraction, opts);
      window.removeEventListener("keydown", handleFirstInteraction, opts);
      window.removeEventListener("scroll", handleFirstInteraction, opts);
    };

    const opts = { capture: true, once: true };
    window.addEventListener("pointerdown", handleFirstInteraction, opts);
    window.addEventListener("touchstart", handleFirstInteraction, opts);
    window.addEventListener("touchend", handleFirstInteraction, opts);
    window.addEventListener("mousedown", handleFirstInteraction, opts);
    window.addEventListener("click", handleFirstInteraction, opts);
    window.addEventListener("keydown", handleFirstInteraction, opts);
    window.addEventListener("scroll", handleFirstInteraction, opts);

    return () => {
      removeInteractionListeners();
      window.removeEventListener("load", onWindowLoad);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (audio) {
        audio.pause();
      }
    };
  }, [startMusic]);

  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audio.pause();
      setIsPlaying(false);
    } else {
      startMusic();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
      <audio
        ref={audioRef}
        src="/assets/music.mp3"
        loop
        preload="auto"
        autoPlay
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
