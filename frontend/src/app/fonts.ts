import { Lora, Poppins } from "next/font/google";

/** Fonte dos títulos. */
export const titleFont = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-title",
  display: "swap",
});

/** Fonte dos demais textos. */
export const bodyFont = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});
