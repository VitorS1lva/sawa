"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm, type FormValues } from "@/components/auth-form/AuthForm";
import { loginConfig, signupConfig } from "@/components/auth-form/auth.config";
import { ListPanel, TextPanel } from "@/components/menu-panels/MenuPanels";
import {
  aboutPanel,
  disclaimerPanel,
  featuresAtuaisPanel,
  featuresFuturasPanel,
} from "@/components/menu-panels/menuPanels.config";
import { VerifyCodeForm } from "@/components/verify-code/VerifyCodeForm";
import { verifyCodeConfig } from "@/components/verify-code/verifyCode.config";
import { login, signup } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import type { Session } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { routes } from "@/lib/routes";
import { Header } from "./Header";
import { landingHeaderItems, loggedInLandingItems } from "./header.config";

/** Cadastro esperando o código enviado pelo WhatsApp (`phone` vem mascarado da API). */
type PendingVerification = { email: string; phone: string; resendIn: number };

/**
 * Menu da página inicial: informações sobre o sawa, login e cadastro.
 * O cadastro termina no balão "Sign up", com o código de 6 dígitos enviado pelo WhatsApp.
 */
export function LandingHeader() {
  const router = useRouter();
  const auth = useAuth();
  const [pending, setPending] = useState<PendingVerification | null>(null);

  function enter(session: Session) {
    auth.signIn(session);
    setPending(null);
    router.push(routes.userPage);
  }

  async function handleSignup(values: FormValues) {
    const result = await signup({
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
    });
    setPending({ email: result.email, phone: result.phone, resendIn: result.resend_available_in });
  }

  async function handleLogin(values: FormValues, openPanel: (id: string) => void) {
    try {
      enter(await login(values.email, values.password));
    } catch (error) {
      // Senha certa, mas o WhatsApp ainda não foi confirmado: leva ao passo do código.
      if (error instanceof ApiError && error.code === "phone_not_verified") {
        const phone = typeof error.body.phone === "string" ? error.body.phone : "seu WhatsApp";
        setPending({ email: values.email.trim().toLowerCase(), phone, resendIn: 60 });
        openPanel("signup");
        return;
      }
      throw error;
    }
  }

  return (
    <Header
      items={auth.status === "authenticated" ? loggedInLandingItems : landingHeaderItems}
      onAction={(id) => id === "user-area" && router.push(routes.userPage)}
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
              onSubmit={(values) => handleLogin(values, openPanel)}
              onSwitch={() => openPanel("signup")}
            />
          ),
        },
        signup: pending
          ? {
              title: verifyCodeConfig.title,
              content: (
                <VerifyCodeForm
                  email={pending.email}
                  phone={pending.phone}
                  resendIn={pending.resendIn}
                  onVerified={enter}
                  onChangePhone={() => setPending(null)}
                />
              ),
            }
          : {
              title: signupConfig.title,
              content: <AuthForm config={signupConfig} onSubmit={handleSignup} onSwitch={() => openPanel("login")} />,
            },
      })}
    />
  );
}
