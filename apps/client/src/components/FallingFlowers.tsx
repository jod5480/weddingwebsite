import { useEffect, useState } from "react";

const FLOWER_COUNT = 12;

interface FlowerProp {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  swayDuration: number;
}

export const FallingFlowers = () => {
  const [flowers, setFlowers] = useState<FlowerProp[]>([]);

  useEffect(() => {
    const newFlowers = Array.from({ length: FLOWER_COUNT }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position (%)
      animationDuration: 10 + Math.random() * 15, // Fall between 10s and 25s
      animationDelay: -(Math.random() * 20), // Start at different times so screen isn't empty initially
      size: 40 + Math.random() * 60, // Size between 40px and 100px
      swayDuration: 3 + Math.random() * 4, // Sway left/right duration
    }));
    setFlowers(newFlowers);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 mix-blend-plus-lighter opacity-60">
      {flowers.map((flower) => (
        <div
          key={flower.id}
          className="absolute -top-32 will-change-transform falling-flower"
          style={{
            left: `${flower.left}%`,
            width: `${flower.size}px`,
            height: `${flower.size}px`,
            animationDuration: `${flower.animationDuration}s`,
            animationDelay: `${flower.animationDelay}s`,
          }}
        >
          <img
            src="/assets/flower3.png"
            alt=""
            className="w-full h-full object-contain swaying-flower"
            style={{
              animationDuration: `${flower.swayDuration}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
};
