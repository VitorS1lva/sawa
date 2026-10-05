/** Um botão do menu. Se não tiver balão, o Header chama `onAction` com o `id`. */
export type HeaderItem = { id: string; label: string; accent: boolean };

export const headerConfig = {
  brand: "sawa",
  /** Abaixo desta largura (celulares e iPads em pé) o menu vira um botão hambúrguer. Igual ao Header.module.css. */
  mobileQuery: "(max-width: 1024px)",
};

/** Menu da página inicial (visitante). */
export const landingHeaderItems: HeaderItem[] = [
  { id: "about", label: "Sobre", accent: false },
  { id: "features-atuais", label: "Features atuais", accent: false },
  { id: "features-futuras", label: "Features futuras", accent: false },
  { id: "disclaimer", label: "Disclaimer", accent: false },
  { id: "login", label: "Login", accent: false },
  { id: "signup", label: "Sign up", accent: true },
];

/** Menu da área logada (/user-page). */
export const userHeaderItems: HeaderItem[] = [
  { id: "account", label: "Minha conta", accent: false },
  { id: "logout", label: "Sair", accent: true },
];
