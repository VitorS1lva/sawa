# Modelos 3D

Coloque aqui o arquivo do rubi, por exemplo `ruby.glb`, e aponte para ele em `src/components/ruby/ruby.config.ts`:

```ts
src: "/models/ruby.glb",
```

Enquanto `src` for `null` (ou se o arquivo não for encontrado), o site exibe um rubi provisório gerado por código.

## Antes de trocar o modelo, comprima

O rubi aparece com no máximo 380px, então texturas acima de 1024px só pesam. O `ruby.glb` original tinha 9,3 MB (três texturas PNG 2048×2048); com os comandos abaixo ficou com 137 KB sem diferença visível:

```bash
npx @gltf-transform/cli resize ruby.glb ruby.glb --width 1024 --height 1024
npx @gltf-transform/cli webp ruby.glb ruby.glb --quality 90
```

O ícone do menu (`public/images/ruby-icon.webp`) é uma foto estática do rubi; se o modelo mudar, gere a foto de novo.
