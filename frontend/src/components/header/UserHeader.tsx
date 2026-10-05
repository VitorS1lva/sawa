"use client";

import { useRouter } from "next/navigation";
import { AccountPanel } from "@/components/account-panel/AccountPanel";
import { accountPanel } from "@/components/account-panel/AccountPanel.configs";
import { routes } from "@/lib/routes";
import { Header } from "./Header";
import { userHeaderItems } from "./header.config";

/** Menu da área logada: "Minha conta" abre o balão de edição e "Sair" volta para o início. */
export function UserHeader() {
  const router = useRouter();

  function handleAction(id: string) {
    if (id === "logout") {
      // TODO: encerrar a sessão na API Django quando o back-end estiver pronto.
      router.replace(routes.home);
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
