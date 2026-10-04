# Modelos 3D

Coloque aqui o arquivo do rubi, por exemplo `ruby.glb`.

Depois, em `src/config/site.ts`, aponte para ele:

```ts
model: {
  src: "/models/ruby.glb",
  ...
}
```

Enquanto `src` for `null` (ou se o arquivo não for encontrado), o site exibe um rubi provisório gerado por código.

Dica: modelos leves carregam mais rápido. Comprima o .glb com `npx gltf-transform optimize ruby.glb ruby.glb`.
