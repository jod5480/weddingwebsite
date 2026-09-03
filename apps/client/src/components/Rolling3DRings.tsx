import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// =========================================================================
// ⚙️ 3D RINGS MANUAL CONFIGURATION
// You can edit any value below to customize size, angles, speed, and colors!
// =========================================================================
export const RING_CONFIG = {
  // 📍 Start Section Trigger
  startSectionId: "guestbook", // Section where animation begins: "guestbook" (03), "rsvp" (04)

  // 📏 Sizing (Scales down smoothly from start to end)
  startScale: 2.0,           // Scale when entering at start section (Big)
  endScale: 0.58,            // Scale when joined at closing section (Small)

  // ↔️ Horizontal Positioning
  startXDistance: 3.8,       // Distance off-screen (Left: -3.8, Right: +3.8)
  endInterlockX: 0.045,      // Overlap offset so rings thread through each other

  // 🔄 Rolling & Idle Speeds
  rollSpeed: 7,             // Wheel rotation speed while scrolling
  idleSpinSpeed: 0.2,        // Idle floating sway speed

  // 📐 Interlocking 3D Angles at the Closing Section (True Intertwined Knot)
  groomRing: {
    tiltX: 0.62,             // Forward slant
    tiltY: 0.48,             // Horizontal rotation
    tiltZ: 0.35,             // Z tilt
  },
  brideRing: {
    tiltX: -0.62,            // Opposing backward slant (loops through groom ring)
    tiltY: -0.48,            // Opposing horizontal rotation
    tiltZ: -0.35,            // Opposing Z tilt
  },

  // 🎨 Gold Colors & Reflections
  goldColor: 0xf5ce65,       // 18K Yellow gold tint
  roseGoldColor: 0xf5bca6,   // Rose gold tint
  metalness: 0.96,           // Metallic reflection (0.0 to 1.0)
  roughness: 0.14,           // Surface roughness (0.0 = mirror, 1.0 = matte)
  exposure: 1.6,             // Overall scene brightness
};

export const Rolling3DRings = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = RING_CONFIG.exposure;

    // 3. Studio Environment Map for Metallic Gold Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 2.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 4.5);
    keyLight.position.set(6, 6, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 3.0);
    fillLight.position.set(-6, 3, 5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xd4af37, 3.5);
    rimLight.position.set(0, -6, -4);
    scene.add(rimLight);

    const sparkleLight = new THREE.PointLight(0xffffff, 6.0, 15);
    sparkleLight.position.set(0, 2, 4);
    scene.add(sparkleLight);

    // 5. Materials
    const luxuryGoldMaterial = new THREE.MeshStandardMaterial({
      color: RING_CONFIG.goldColor,
      metalness: RING_CONFIG.metalness,
      roughness: RING_CONFIG.roughness,
      envMapIntensity: 2.2,
    });

    const roseGoldMaterial = new THREE.MeshStandardMaterial({
      color: RING_CONFIG.roseGoldColor,
      metalness: RING_CONFIG.metalness - 0.02,
      roughness: RING_CONFIG.roughness + 0.02,
      envMapIntensity: 2.0,
    });

    const diamondMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.02,
      transmission: 0.9,
      ior: 2.42,
      reflectivity: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.96,
      envMapIntensity: 2.5,
    });

    // 6. Ring Pivot Groups
    const ringGroup1 = new THREE.Group();
    const ringGroup2 = new THREE.Group();
    scene.add(ringGroup1);
    scene.add(ringGroup2);

    let ring1Obj: THREE.Object3D | null = null;
    let ring2Obj: THREE.Object3D | null = null;
    let baseNormalizedScale = 1.0;
    let isModelLoaded = false;

    // 7. Load 3D Model
    const loader = new GLTFLoader();
    loader.load(
      "/assets/models/weddingring.glb",
      (gltf) => {
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        baseNormalizedScale = 1.0 / maxDim;

        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const name = (mesh.name || "").toLowerCase();
            const matName = (mesh.material && "name" in mesh.material ? (mesh.material.name as string) : "").toLowerCase();

            if (name.includes("diamond") || name.includes("gem") || name.includes("stone") || matName.includes("diamond") || matName.includes("gem")) {
              mesh.material = diamondMaterial;
            } else {
              mesh.material = luxuryGoldMaterial;
            }
          }
        });

        // Clone BEFORE shifting the position!
        const ring1 = gltf.scene;
        const ring2 = gltf.scene.clone(true);

        // Center both rings exactly to their geometric center
        ring1.position.sub(center);
        ring2.position.sub(center);

        // Add Groom's Ring
        ringGroup1.add(ring1);
        ring1Obj = ring1;

        // Configure Bride's Ring
        ring2.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const name = (mesh.name || "").toLowerCase();
            if (!name.includes("diamond") && !name.includes("gem")) {
              mesh.material = roseGoldMaterial;
            }
          }
        });
        ringGroup2.add(ring2);
        ring2Obj = ring2;

        isModelLoaded = true;
      },
      undefined,
      (error) => {
        console.error("Error loading /assets/models/weddingring.glb:", error);
      }
    );

    // 8. Scroll Tracking (Reaches 100% when closing section is in view)
    let targetProgress = 0;
    let currentProgress = 0;

    const calculateScroll = () => {
      const startSection = document.getElementById(RING_CONFIG.startSectionId);
      const closingSection = document.getElementById("closing");
      if (!startSection || !closingSection) {
        targetProgress = 0;
        return;
      }

      const startTop = startSection.offsetTop - window.innerHeight * 0.35;
      // Reaches 100% when the closing section is in full view on screen
      const closingTop = closingSection.offsetTop - window.innerHeight * 0.25;
      const totalDistance = Math.max(closingTop - startTop, 1);
      const scrollY = window.scrollY;

      if (scrollY < startTop) {
        targetProgress = 0;
      } else {
        targetProgress = Math.min(Math.max((scrollY - startTop) / totalDistance, 0), 1);
      }
    };

    window.addEventListener("scroll", calculateScroll, { passive: true });
    window.addEventListener("resize", calculateScroll, { passive: true });
    calculateScroll();

    // 9. Animation Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth lerp
      currentProgress += (targetProgress - currentProgress) * 0.08;

      // Container Opacity
      if (container) {
        const opacity = currentProgress > 0.005 ? Math.min(currentProgress * 4.0, 1) : 0;
        container.style.opacity = opacity.toFixed(3);
        container.style.pointerEvents = "none";
      }

      if (isModelLoaded && ring1Obj && ring2Obj) {
        // Continuous Dynamic Scaling: startScale -> endScale
        const currentScaleFactor = RING_CONFIG.startScale + (RING_CONFIG.endScale - RING_CONFIG.startScale) * currentProgress;

        ring1Obj.scale.setScalar(baseNormalizedScale * currentScaleFactor);
        ring2Obj.scale.setScalar(baseNormalizedScale * currentScaleFactor * 0.94);

        // Horizontal rolling coordinates (meeting with overlapping center)
        const startXLeft = -RING_CONFIG.startXDistance;
        const endXLeft = -0.035;
        const startXRight = RING_CONFIG.startXDistance;
        const endXRight = 0.035;

        const currentXLeft = startXLeft + (endXLeft - startXLeft) * currentProgress;
        const currentXRight = startXRight + (endXRight - startXRight) * currentProgress;

        // Dynamic Landing Y Coordinate
        let endY = -0.72;
        const thanksEl = document.querySelector(".closing-thanks");
        const footerEl = document.querySelector(".closing-section footer");
        if (thanksEl && footerEl) {
          const thanksRect = thanksEl.getBoundingClientRect();
          const footerRect = footerEl.getBoundingClientRect();
          const midYPx = (thanksRect.bottom + footerRect.top) / 2;
          const vFOV = (38 * Math.PI) / 180;
          const visibleHeight = 2 * Math.tan(vFOV / 2) * 5.5;
          endY = -((midYPx / window.innerHeight) - 0.5) * visibleHeight;
        }

        // Stay centered in viewport (Y = 0) until reaching the last page
        const startY = 0.0;
        const landingProgress = Math.max((currentProgress - 0.70) / 0.30, 0); // 0 until 70% scroll, then 0 -> 1 on last page
        const currentY = startY + (endY - startY) * Math.pow(landingProgress, 1.4);

        const interlockFactor = Math.pow(currentProgress, 2.0);

        // Position with interwoven depth so one ring threads through the other
        ringGroup1.position.set(currentXLeft, currentY, 0.015 * interlockFactor);
        ringGroup2.position.set(currentXRight, currentY, -0.015 * interlockFactor);

        // Rolling Rotations
        const rollRotLeft = -currentXLeft * RING_CONFIG.rollSpeed;
        const rollRotRight = -currentXRight * RING_CONFIG.rollSpeed;

        // Groom Ring Rotations (Forward right tilt)
        ringGroup1.rotation.z = rollRotLeft * (1 - interlockFactor) + 0.32 * interlockFactor;
        ringGroup1.rotation.y = 0.6 * (1 - interlockFactor) + (0.50 + Math.sin(time * RING_CONFIG.idleSpinSpeed) * 0.05) * interlockFactor;
        ringGroup1.rotation.x = 0.38 * interlockFactor;

        // Bride Ring Rotations (Opposing backward left tilt looping through Groom ring)
        ringGroup2.rotation.z = rollRotRight * (1 - interlockFactor) + -0.32 * interlockFactor;
        ringGroup2.rotation.y = -0.6 * (1 - interlockFactor) + (-0.50 + Math.sin(time * RING_CONFIG.idleSpinSpeed + 0.5) * 0.05) * interlockFactor;
        ringGroup2.rotation.x = -0.38 * interlockFactor;

        // Sparkle Light
        sparkleLight.position.x = Math.sin(time * 2) * 3;
        sparkleLight.position.y = Math.cos(time * 1.5) * 3;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize Handling
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", calculateScroll);
      window.removeEventListener("resize", calculateScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      pmremGenerator.dispose();
      renderer.dispose();
      luxuryGoldMaterial.dispose();
      roseGoldMaterial.dispose();
      diamondMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-300"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default Rolling3DRings;
