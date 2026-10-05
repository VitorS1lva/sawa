import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./theme.css";
import { bodyFont, titleFont } from "./fonts";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "sawa",
  description: "Previsões de ações da B3 e dos EUA com inteligência artificial.",
};

export const viewport: Viewport = {
  themeColor: "#2a2a2e",
  // Ocupa a tela toda no iPhone; o notch e a barra de gestos são tratados com env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${titleFont.variable} ${bodyFont.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
