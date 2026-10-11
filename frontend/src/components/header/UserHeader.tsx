"use client";

import { useRouter } from "next/navigation";
import { AccountPanel } from "@/components/account-panel/AccountPanel";
import { accountPanel } from "@/components/account-panel/AccountPanel.configs";
import { useAuth } from "@/lib/auth/AuthProvider";
import { routes } from "@/lib/routes";
import { Header } from "./Header";
import { userHeaderItems } from "./header.config";

/**
 * Menu da área logada: "Minha conta" abre o balão de edição, o ícone de usuário
 * leva às configurações da conta e "Sair" volta para o início.
 */
export function UserHeader() {
  const router = useRouter();
  const auth = useAuth();

  async function handleAction(id: string) {
    if (id === "settings") {
      router.push(routes.accountSettings);
    } else if (id === "logout") {
      router.replace(routes.home);
      await auth.signOut();
    }
  }

  return (
    <Header
      items={userHeaderItems}
      brandHref={routes.userPage}
      onAction={handleAction}
      panels={() => ({
        account: { title: accountPanel.title, content: <AccountPanel /> },
      })}
    />
  );
}
