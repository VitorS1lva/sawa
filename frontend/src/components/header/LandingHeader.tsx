"use client";

import { useRouter } from "next/navigation";
import { AboutPanel } from "@/components/about-panel/AboutPanel";
import { aboutPanel } from "@/components/about-panel/AboutPanel.configs";
import { AuthForm } from "@/components/auth-form/AuthForm";
import { loginConfig, signupConfig } from "@/components/auth-form/auth.config";
import { DisclaimerPanel } from "@/components/disclaimer-panel/DisclaimerPanel";
import { disclaimerPanel } from "@/components/disclaimer-panel/DisclaimerPanel.configs";
import { FeaturesAtuaisPanel } from "@/components/features-atuais-panel/FeaturesAtuaisPanel";
import { featuresAtuaisPanel } from "@/components/features-atuais-panel/FeaturesAtuaisPanel.configs";
import { FeaturesFuturasPanel } from "@/components/features-futuras-panel/FeaturesFuturasPanel";
import { featuresFuturasPanel } from "@/components/features-futuras-panel/FeaturesFuturasPanel.configs";
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
        about: { title: aboutPanel.title, content: <AboutPanel /> },
        "features-atuais": { title: featuresAtuaisPanel.title, content: <FeaturesAtuaisPanel /> },
        "features-futuras": { title: featuresFuturasPanel.title, content: <FeaturesFuturasPanel /> },
        disclaimer: { title: disclaimerPanel.title, content: <DisclaimerPanel /> },
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
