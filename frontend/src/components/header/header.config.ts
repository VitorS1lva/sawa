/** Identificadores dos balões do menu. */
export type PanelId = "about" | "features-atuais" | "features-futuras" | "disclaimer" | "login" | "signup";

export const headerConfig = {
  brand: "sawa",
  items: [
    { id: "about", label: "Sobre", accent: false },
    { id: "features-atuais", label: "Features atuais", accent: false },
    { id: "features-futuras", label: "Features futuras", accent: false },
    { id: "disclaimer", label: "Disclaimer", accent: false },
    { id: "login", label: "Login", accent: false },
    { id: "signup", label: "Sign up", accent: true },
  ] satisfies { id: PanelId; label: string; accent: boolean }[],
};
