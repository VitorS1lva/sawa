"use client";

import { Component, Suspense, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Environment, useGLTF } from "@react-three/drei";
import type { Group } from "three";
import { rubyConfig } from "./ruby.config";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const ACCENT = "#8f1d2c";

/* ---------- Proteção contra falhas no carregamento ---------- */

type BoundaryProps = { fallback: ReactNode; children: ReactNode };

/** Se o .glb falhar ao carregar, exibe o `fallback` em vez de quebrar a página. */
class LoadErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[sawa] Falha ao carregar um recurso 3D. Usando alternativa.", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ---------- Giro em torno do eixo vertical (como um pião) ---------- */

function Spinner({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useFrame((_, delta) => {
    if (!ref.current || prefersReducedMotion) return;
    ref.current.rotation.y += rubyConfig.rotationSpeed * delta;
  });

  return <group ref={ref}>{children}</group>;
}

/* ---------- Modelos ---------- */

function GlbModel({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  // Cada lugar onde o rubi aparece precisa da sua própria cópia do modelo.
  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <Center>
      <primitive object={model} />
    </Center>
  );
}

function GemMaterial() {
  return (
    <meshPhysicalMaterial
      color={ACCENT}
      roughness={0.12}
      metalness={0.15}
      clearcoat={1}
      clearcoatRoughness={0.05}
      flatShading
    />
  );
}

/** Rubi provisório gerado por código (usado se não houver .glb). */
function PlaceholderGem() {
  return (
    <Center>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.55, 1, 0.4, 8]} />
          <GemMaterial />
        </mesh>
        <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[1, 1.2, 8]} />
          <GemMaterial />
        </mesh>
      </group>
    </Center>
  );
}

/* ---------- Cena ---------- */

export function RubyCanvas() {
  const { src, scale, modelRotation, camera, lights, environment } = rubyConfig;

  return (
    <Canvas
      camera={{ position: camera.position, fov: camera.fov }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={lights.ambient} />
      <directionalLight position={[3, 5, 4]} intensity={lights.key} />
      <pointLight position={[-3, -2, 3]} intensity={lights.rim} color={ACCENT} decay={0} />

      {environment && (
        <LoadErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <Environment preset={environment} />
          </Suspense>
        </LoadErrorBoundary>
      )}

      <Spinner>
        <group scale={scale} rotation={modelRotation}>
          {src ? (
            <LoadErrorBoundary fallback={<PlaceholderGem />}>
              <Suspense fallback={null}>
                <GlbModel src={src} />
              </Suspense>
            </LoadErrorBoundary>
          ) : (
            <PlaceholderGem />
          )}
        </group>
      </Spinner>
    </Canvas>
  );
}
