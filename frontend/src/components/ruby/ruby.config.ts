type Vector3 = [number, number, number];

export const rubyConfig = {
  /** Caminho do .glb dentro de public/. Use null para o rubi provisório. */
  src: "/models/ruby.glb" as string | null,
  scale: 2.2,
  /** Velocidade de giro em torno do eixo vertical (radianos por segundo). */
  rotationSpeed: 0.5,
  /**
   * Deixa o modelo em pé, com a ponta para baixo.
   * O "- 0.2387" desfaz a inclinação de 13,7° que veio no arquivo ruby.glb.
   */
  modelRotation: [Math.PI / 2 - 0.2387, 0, 0] as Vector3,
  camera: { position: [0, 0, 5] as Vector3, fov: 40 },
  lights: { ambient: 0.05, key: 0.3, rim: 3 },
  /** Reflexos do ambiente: "city", "studio", "night"... ou null para desativar. */
  environment: null as "city" | "studio" | "night" | "sunset" | "warehouse" | null,
};
