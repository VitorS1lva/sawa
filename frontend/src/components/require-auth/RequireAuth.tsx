"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { routes } from "@/lib/routes";
import styles from "./RequireAuth.module.css";

/** Só mostra o conteúdo para quem está logado; os demais voltam para a página inicial. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace(routes.home);
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        {status === "loading" ? "Carregando..." : "Redirecionando..."}
      </div>
    );
  }
  return children;
}
