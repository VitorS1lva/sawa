"use client";

import dynamic from "next/dynamic";

/**
 * Carrega a cena 3D apenas no navegador.
 * O WebGL não existe no servidor, então a renderização no servidor é desativada.
 */
const RubyCanvas = dynamic(() => import("./RubyCanvas").then((mod) => mod.RubyCanvas), {
  ssr: false,
  loading: () => null,
});

export function RubyViewer() {
  return <RubyCanvas />;
}
