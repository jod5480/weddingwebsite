import React, { useRef, useEffect, useCallback } from "react";

interface Parallax3DCoupleProps {
  backgroundSrc?: string;
  coupleSrc?: string;
  alt?: string;
  className?: string;
}

export const Parallax3DCouple: React.FC<Parallax3DCoupleProps> = ({
  backgroundSrc = "/assets/slots/background.jpg",
  coupleSrc = "/assets/slots/couplepng.png",
  alt = "Anandhu & Vishnupriya",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Target values (-1 to 1)
  const targetRef = useRef({ x: 0, y: 0, isHovering: false });
  // Current interpolated values
  const currentRef = useRef({ x: 0, y: 0 });

  // Flags for mobile gyro and viewport visibility
  const isVisibleRef = useRef(false);
  const isMobileGyroActiveRef = useRef(false);

  // DOM node references for 60fps hardware-accelerated transforms
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const coupleRef = useRef<HTMLImageElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  // Viewport visibility observer: gyro only runs when card is in view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        // If scrolled out of view on mobile, gently reset to center
        if (!entry.isIntersecting && !targetRef.current.isHovering) {
          targetRef.current.x = 0;
          targetRef.current.y = 0;
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 60FPS Animation Loop
  useEffect(() => {
    const updateMotion = () => {
      const isHovering = targetRef.current.isHovering;
      const isGyro = isMobileGyroActiveRef.current && isVisibleRef.current;
      const isActive = isHovering || isGyro;

      const targetX = isActive ? targetRef.current.x : 0;
      const targetY = isActive ? targetRef.current.y : 0;

      // Smooth interpolation (ease in / ease out)
      const ease = isHovering ? 0.1 : 0.075;
      currentRef.current.x += (targetX - currentRef.current.x) * ease;
      currentRef.current.y += (targetY - currentRef.current.y) * ease;

      // Snap to exact 0 when resting to prevent any micro-jitter on desktop
      if (!isActive && Math.abs(currentRef.current.x) < 0.001 && Math.abs(currentRef.current.y) < 0.001) {
        currentRef.current.x = 0;
        currentRef.current.y = 0;
      }

      const curX = currentRef.current.x;
      const curY = currentRef.current.y;

      // 1. Card 3D Tilt
      if (cardRef.current) {
        const rotX = -curY * 11; // Tilt up / down
        const rotY = curX * 11;  // Tilt left / right
        cardRef.current.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      }

      // 2. Background Layer (recedes in depth)
      if (bgRef.current) {
        const bgMoveX = -curX * 11;
        const bgMoveY = -curY * 9;
        bgRef.current.style.transform = `scale(1.07) translate3d(${bgMoveX.toFixed(1)}px, ${bgMoveY.toFixed(1)}px, -12px)`;
      }

      // 3. Couple Foreground Layer (pops forward at +45px Z-depth with directional shadow)
      if (coupleRef.current) {
        const fgMoveX = curX * 15;
        const fgMoveY = curY * 13;
        const shadowX = -curX * 22;
        const shadowY = -curY * 16 + 19;
        coupleRef.current.style.transform = `scale(1.02) translate3d(${fgMoveX.toFixed(1)}px, ${fgMoveY.toFixed(1)}px, 45px)`;
        coupleRef.current.style.filter = `drop-shadow(${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px 22px rgba(25, 12, 8, 0.42)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.2))`;
      }

      // 4. Glare Layer (visible during interaction/gyro)
      if (glareRef.current) {
        const glareX = 50 + curX * 40;
        const glareY = 50 + curY * 40;
        glareRef.current.style.opacity = isActive ? "1" : "0";
        glareRef.current.style.background = `radial-gradient(circle at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)`;
      }

      animFrameRef.current = requestAnimationFrame(updateMotion);
    };

    animFrameRef.current = requestAnimationFrame(updateMotion);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Mouse event listeners (for desktop hover)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    targetRef.current.x = Math.max(-1, Math.min(1, mouseX));
    targetRef.current.y = Math.max(-1, Math.min(1, mouseY));
    targetRef.current.isHovering = true;
  }, []);

  const handleMouseEnter = useCallback(() => {
    targetRef.current.isHovering = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    targetRef.current.x = 0;
    targetRef.current.y = 0;
    targetRef.current.isHovering = false;
  }, []);

  // Touch event listeners for mobile swipe / tilt
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const touchY = ((touch.clientY - rect.top) / rect.height) * 2 - 1;

    targetRef.current.x = Math.max(-1, Math.min(1, touchX));
    targetRef.current.y = Math.max(-1, Math.min(1, touchY));
    targetRef.current.isHovering = true;
  }, []);

  const handleTouchEnd = useCallback(() => {
    targetRef.current.isHovering = false;
  }, []);

  // Mobile Gyroscope Tilt Handler
  useEffect(() => {
    // Only activate on handheld mobile/touch devices
    const isMobileDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0) &&
      window.matchMedia("(max-width: 900px)").matches;

    if (!isMobileDevice) return;

    let baselineBeta = 48; // natural handheld angle
    let baselineGamma = 0;
    let hasCalibrated = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Only process when card is visible on screen and not being directly touched
      if (!isVisibleRef.current || targetRef.current.isHovering) return;
      if (e.beta === null || e.gamma === null) return;

      // Calibrate to how user is currently holding their phone on first reading
      if (!hasCalibrated) {
        if (Math.abs(e.beta) > 15 && Math.abs(e.beta) < 75) {
          baselineBeta = e.beta;
        }
        if (Math.abs(e.gamma) < 35) {
          baselineGamma = e.gamma;
        }
        hasCalibrated = true;
        isMobileGyroActiveRef.current = true;
      }

      const deltaBeta = e.beta - baselineBeta;
      const deltaGamma = e.gamma - baselineGamma;

      // Small deadband to eliminate sensor noise / trembling hands
      const cleanBeta = Math.abs(deltaBeta) < 0.8 ? 0 : deltaBeta;
      const cleanGamma = Math.abs(deltaGamma) < 0.8 ? 0 : deltaGamma;

      // Normalize: +/- 18 degrees roll, +/- 20 degrees pitch maps to -1 to +1
      const normX = Math.max(-1, Math.min(1, cleanGamma / 18));
      const normY = Math.max(-1, Math.min(1, cleanBeta / 20));

      targetRef.current.x = normX;
      targetRef.current.y = normY;
    };

    // iOS 13+ permission request trigger on user touch
    const requestiOSPermission = async () => {
      const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
      if (typeof DeviceOrientationEventAny?.requestPermission === "function") {
        try {
          const state = await DeviceOrientationEventAny.requestPermission();
          if (state === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        } catch {
          // Ignore if permission denied
        }
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("touchend", requestiOSPermission, { once: true });

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("touchend", requestiOSPermission);
      isMobileGyroActiveRef.current = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`parallax-3d-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleTouchEnd}
      aria-label={`${alt} 3D Portrait`}
    >
      <div ref={cardRef} className="parallax-3d-card">
        {/* Layer 1: Background */}
        <div className="parallax-3d-layer parallax-3d-bg">
          <img
            ref={bgRef}
            src={backgroundSrc}
            alt="Traditional Kerala Backdrop"
            className="parallax-3d-image"
            loading="lazy"
          />
        </div>

        {/* Layer 2: Couple Cutout PNG */}
        <div className="parallax-3d-layer parallax-3d-fg">
          <img
            ref={coupleRef}
            src={coupleSrc}
            alt={alt}
            className="parallax-3d-image parallax-3d-couple"
            loading="lazy"
          />
        </div>

        {/* Layer 3: Dynamic Specular Reflection / Glare */}
        <div ref={glareRef} className="parallax-3d-glare" />
      </div>
    </div>
  );
};
