"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form/AuthForm";
import { loginConfig, signupConfig } from "@/components/auth-form/auth.config";
import { ListPanel, TextPanel } from "@/components/menu-panels/MenuPanels";
import {
  aboutPanel,
  disclaimerPanel,
  featuresAtuaisPanel,
  featuresFuturasPanel,
} from "@/components/menu-panels/menuPanels.config";
import { routes } from "@/lib/routes";
import { Header } from "./Header";
import { landingHeaderItems } from "./header.config";

/** Menu da página inicial: informações sobre o sawa, login e cadastro. */
export function LandingHeader() {
  const router = useRouter();

  return (
    <Header
      items={landingHeaderItems}
      panels={(openPanel) => ({
        about: { title: aboutPanel.title, content: <TextPanel {...aboutPanel} /> },
        "features-atuais": { title: featuresAtuaisPanel.title, content: <ListPanel {...featuresAtuaisPanel} /> },
        "features-futuras": { title: featuresFuturasPanel.title, content: <ListPanel {...featuresFuturasPanel} /> },
        disclaimer: { title: disclaimerPanel.title, content: <TextPanel {...disclaimerPanel} /> },
        login: {
          title: loginConfig.title,
          content: (
            <AuthForm
              config={loginConfig}
              onSwitch={() => openPanel("signup")}
              onSuccess={() => router.push(routes.userPage)}
            />
          ),
        },
        signup: {
          title: signupConfig.title,
          content: <AuthForm config={signupConfig} onSwitch={() => openPanel("login")} />,
        },
      })}
    />
  );
}
