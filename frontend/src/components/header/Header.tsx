"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, Menu, X } from "lucide-react";
import { aboutPanel } from "@/components/about-panel/AboutPanel.configs";
import { featuresAtuaisPanel } from "@/components/features-atuais-panel/FeaturesAtuaisPanel.configs";
import { featuresFuturasPanel } from "@/components/features-futuras-panel/FeaturesFuturasPanel.configs";
import { disclaimerPanel } from "@/components/disclaimer-panel/DisclaimerPanel.configs";
import { AuthForm } from "@/components/auth-form/AuthForm";
import { loginConfig, signupConfig } from "@/components/auth-form/auth.config";
import { Popover } from "@/components/popover/Popover";
import { headerConfig, type PanelId } from "./header.config";
import { RubyViewer } from "@/components/ruby/RubyViewer";
import { useMediaQuery } from "@/lib/useMediaQuery";
import styles from "./Header.module.css";
import { AboutPanel } from "../about-panel/AboutPanel";
import { DisclaimerPanel } from "../disclaimer-panel/DisclaimerPanel";
import { FeaturesAtuaisPanel } from "../features-atuais-panel/FeaturesAtuaisPanel";
import { FeaturesFuturasPanel } from "../features-futuras-panel/FeaturesFuturasPanel";

/**
 * Menu principal suspenso.
 * Cada botão abre um balão em vez de navegar para outra página.
 * Apenas um balão fica aberto por vez; clicar fora ou apertar Esc fecha.
 *
 * No celular e no tablet em pé, os botões ficam numa gaveta aberta pelo botão hambúrguer.
 * Tocar num item mostra o conteúdo do balão dentro da própria gaveta, com um botão de voltar.
 */
export function Header() {
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMediaQuery(headerConfig.mobileQuery);
  const barRef = useRef<HTMLDivElement>(null);

  const sheetOpen = isMobile && menuOpen;

  function closeAll() {
    setOpenPanel(null);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!openPanel && !menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
        setMenuOpen(false);
      }
    }

    // Na gaveta, o Esc primeiro volta para a lista; no desktop, fecha o balão.
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (menuOpen && openPanel) setOpenPanel(null);
      else {
        setOpenPanel(null);
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPanel, menuOpen]);

  // Título e conteúdo de cada balão.
  const panels: Record<PanelId, { title: string; content: ReactNode }> = {
    about: { title: aboutPanel.title, content: <AboutPanel /> },
    "features-atuais": { title: featuresAtuaisPanel.title, content: <FeaturesAtuaisPanel /> },
    "features-futuras": { title: featuresFuturasPanel.title, content: <FeaturesFuturasPanel /> },
    disclaimer: { title: disclaimerPanel.title, content: <DisclaimerPanel /> },
    login: {
      title: loginConfig.title,
      content: <AuthForm config={loginConfig} onSwitch={() => setOpenPanel("signup")} />,
    },
    signup: {
      title: signupConfig.title,
      content: <AuthForm config={signupConfig} onSwitch={() => setOpenPanel("login")} />,
    },
  };

  return (
    <header className={styles.header}>
      <div ref={barRef} className={styles.bar}>
        <a href="#" className={styles.brand} aria-label={headerConfig.brand}>
          <span className={styles.brandIcon} aria-hidden="true">
            <RubyViewer />
          </span>
          <span className={styles.brandName}>{headerConfig.brand}</span>
        </a>

        <nav className={styles.nav} aria-label="Menu principal">
          {headerConfig.items.map((item) => {
            const isOpen = openPanel === item.id;
            const popoverId = `popover-${item.id}`;

            return (
              <div key={item.id} className={styles.item}>
                <button
                  type="button"
                  className={styles.button}
                  data-accent={item.accent}
                  aria-expanded={isOpen}
                  aria-controls={popoverId}
                  onClick={() => setOpenPanel(isOpen ? null : item.id)}
                >
                  {item.label}
                </button>

                {isOpen && !isMobile && (
                  <Popover id={popoverId} title={panels[item.id].title}>
                    {panels[item.id].content}
                  </Popover>
                )}
              </div>
            );
          })}
        </nav>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={sheetOpen}
          aria-controls="menu-mobile"
          aria-label={sheetOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => (sheetOpen ? closeAll() : setMenuOpen(true))}
        >
          {sheetOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        {sheetOpen && (
          <div id="menu-mobile" className={styles.sheet}>
            {openPanel ? (
              <>
                <button type="button" className={styles.back} onClick={() => setOpenPanel(null)}>
                  <ChevronLeft aria-hidden="true" />
                  Menu
                </button>
                <Popover id={`popover-${openPanel}`} title={panels[openPanel].title} inline>
                  {panels[openPanel].content}
                </Popover>
              </>
            ) : (
              <nav className={styles.sheetNav} aria-label="Menu principal">
                {headerConfig.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.sheetItem}
                    data-accent={item.accent}
                    onClick={() => setOpenPanel(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
