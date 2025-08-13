import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  Html,
  MeshTransmissionMaterial,
  Sparkles,
  useProgress,
  Stars,
} from "@react-three/drei";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import * as THREE from "three";

/*
  ⚡️ Three.js × Framer Motion Loading Page
  - Fullscreen radiant gradient background
  - Glassy TorusKnot + floating reflective orb
  - Sparkles + subtle camera parallax via mouse
  - Framer Motion micro-interactions and reveal
  - Loading progress from drei's useProgress

  Drop this file into your React app and render <LoadingPage3D />
  Requires: react, framer-motion, @react-three/fiber, @react-three/drei, tailwindcss
*/

function useMouseParallax(strength = 0.15) {
  const ref = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => {
      const { innerWidth: w, innerHeight: h } = window;
      const x = (e.clientX / w - 0.5) * 2;
      const y = (e.clientY / h - 0.5) * 2;
      ref.current.x = THREE.MathUtils.lerp(ref.current.x, x * strength, 0.2);
      ref.current.y = THREE.MathUtils.lerp(ref.current.y, y * strength, 0.2);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [strength]);
  return ref;
}

function LoaderOverlay({ onDone }) {
  const { progress, active } = useProgress();
  const controls = useAnimation();

  useEffect(() => {
    if (!active && progress >= 100) {
      controls.start({ opacity: 0, transition: { duration: 0.6 } }).then(() => {
        onDone?.();
      });
    }
  }, [active, progress, controls, onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={controls}
      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-transparent"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl border border-white/20 backdrop-blur-xl bg-white/5 shadow-2xl shadow-black/30" />
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            style={{
              boxShadow:
                "0 0 40px 4px rgba(255,255,255,0.12), inset 0 0 40px 6px rgba(255,255,255,0.06)",
            }}
          />
        </div>
        <div className="w-56 h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-white/80"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(progress)}%` }}
            transition={{ ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <motion.p
          className="text-white/80 text-xs tracking-widest uppercase"
          key={Math.round(progress)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          Loading {Math.round(progress)}%
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

function GlassKnot() {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.x = t * 0.25;
      ref.current.rotation.y = t * 0.15;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.4}>
      <mesh ref={ref} castShadow receiveShadow>
        <torusKnotGeometry args={[1.3, 0.4, 220, 28]} />
        <MeshTransmissionMaterial
          anisotropy={0.3}
          chromaticAberration={0.06}
          distortion={0.15}
          distortionScale={0.6}
          iridescence={1}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[200, 800]}
          thickness={0.7}
          roughness={0.15}
          ior={1.3}
          samples={8}
          resolution={256}
          background={new THREE.Color("#000000")}
        />
      </mesh>
    </Float>
  );
}

function ShimmerOrb() {
  const ref = useRef();
  const shader = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          vUv = uv;
          vec3 transformed = position;
          transformed += normal * (sin(uTime + position.y * 8.0) * 0.05);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main(){
          float r = 0.5 + 0.5 * sin(uTime + vUv.x * 6.2831);
          float g = 0.5 + 0.5 * sin(uTime * 1.2 + vUv.y * 6.2831 + 2.0);
          float b = 0.5 + 0.5 * sin(uTime * 1.4 + (vUv.x+vUv.y) * 6.2831 + 4.0);
          vec3 col = vec3(r,g,b);
          float vignette = smoothstep(1.0, 0.2, distance(vUv, vec2(0.5)));
          gl_FragColor = vec4(mix(col, vec3(0.9), 0.2) * vignette, 0.9);
        }
      `,
    };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <Float speed={1.2} floatIntensity={1.8}>
      <mesh ref={ref} position={[0, 0, -0.5]}>
        <icosahedronGeometry args={[1.1, 3]} />
        {/* @ts-ignore */}
        <shaderMaterial transparent {...shader} />
      </mesh>
    </Float>
  );
}

function GroundGlow() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial
        color={new THREE.Color("#0a0a0a")}
        metalness={0.6}
        roughness={0.8}
      />
    </mesh>
  );
}

function Scene({ parallax }) {
  const group = useRef();
  useFrame(() => {
    if (group.current) {
      group.current.rotation.y = parallax.current.x * 0.3;
      group.current.rotation.x = -parallax.current.y * 0.2;
    }
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Stars radius={60} depth={40} count={900} factor={2.5} saturation={0} fade speed={0.7} />
      <Sparkles count={140} scale={[12, 6, 12]} size={2.5} speed={0.7} noise={0.2} />
      <GlassKnot />
      <ShimmerOrb />
      <GroundGlow />
      <Environment preset="city" />
    </group>
  );
}

function OverlayBrand({ hidden }) {
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 top-0 flex items-center justify-between p-6 text-white/90"
        >
          <motion.div className="flex items-center gap-3">
            <motion.div
              className="h-9 w-9 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="font-semibold tracking-wide">Aether Engine</span>
          </motion.div>
          <motion.span
            className="text-xs tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full border border-white/15"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          >
            Initializing
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LoadingPage3D() {
  const [ready, setReady] = useState(false);
  const parallax = useMouseParallax(0.3);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* Animated radiant background */}
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
        <div className="absolute -inset-64 blur-3xl" style={{
          background:
            "radial-gradient(60% 60% at 30% 20%, #4f46e5 0%, rgba(79,70,229,0.0) 60%)," +
            "radial-gradient(50% 50% at 70% 70%, #06b6d4 0%, rgba(6,182,212,0.0) 60%)," +
            "radial-gradient(40% 40% at 80% 20%, #22d3ee 0%, rgba(34,211,238,0.0) 60%)",
          animation: "floatBG 14s ease-in-out infinite alternate",
        }} />
      </div>

      {/* Header / Brand Overlay */}
      <OverlayBrand hidden={ready} />

      {/* Three.js Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.2, 5], fov: 42 }}
        gl={{ antialias: true, preserveDrawingBuffer: false }}
      >
        <Suspense fallback={<Html center>Booting renderer…</Html>}>
          <Scene parallax={parallax} />
        </Suspense>
        <Html fullscreen>
          <LoaderOverlay onDone={() => setReady(true)} />
        </Html>
      </Canvas>

      {/* Bottom CTA that appears when ready */}
      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 p-6"
          >
            <motion.h1
              className="text-2xl sm:text-3xl font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Welcome aboard
            </motion.h1>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-2xl px-5 py-3 text-sm tracking-wide bg-white text-black/90 shadow-xl shadow-black/30 border border-white/40"
              onClick={() => {
                // Replace with your app navigation
                console.log("Enter app");
              }}
            >
              Enter App
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local styles for the animated background */}
      <style>{`
        @keyframes floatBG {
          0% { transform: translate3d(0px, 0px, 0) scale(1); filter: hue-rotate(0deg) saturate(1.3); }
          50% { transform: translate3d(-20px, 10px, 0) scale(1.05); filter: hue-rotate(20deg) saturate(1.4); }
          100% { transform: translate3d(10px, -10px, 0) scale(1.03); filter: hue-rotate(-20deg) saturate(1.35); }
        }
      `}</style>
    </div>
  );
}
