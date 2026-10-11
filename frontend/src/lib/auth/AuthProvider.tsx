"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchMe, logout } from "@/lib/api/auth";
import type { AuthUser, Session } from "@/lib/api/types";
import { createLogger } from "@/lib/log/logger";
import {
  clearSession,
  getRefreshToken,
  hasStoredSession,
  onSessionExpired,
  renewSession,
  startSession,
} from "./session";

type AuthState = { status: "loading"; user: null } | { status: "authenticated"; user: AuthUser } | { status: "anonymous"; user: null };

type AuthContextValue = AuthState & {
  /** Começa a sessão com os tokens do login ou da confirmação de e-mail. */
  signIn: (session: Session) => void;
  /** "Sair": invalida o refresh no servidor e limpa tudo. */
  signOut: () => Promise<void>;
  /** Limpa a sessão sem avisar o servidor (ex.: depois de excluir a conta). */
  endSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const log = createLogger("auth.AuthProvider");

/** Restaura a sessão ao abrir o site e mantém o estado de login para o app inteiro. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });
  const queryClient = useQueryClient();

  // Ao abrir o site: se há um refresh guardado, renova os tokens e busca o usuário.
  useEffect(() => {
    let cancelled = false;

    async function restore(): Promise<AuthUser | null> {
      log.debug("restore", "Site aberto: procurando uma sessão salva");
      if (!hasStoredSession() || !(await renewSession())) return null;
      try {
        return await fetchMe();
      } catch {
        return null;
      }
    }

    restore().then((user) => {
      if (cancelled) return;
      if (user) log.info("restore", `Sessão restaurada para ${user.email}`);
      else log.info("restore", "Nenhuma sessão ativa; usuário anônimo");
      setState(user ? { status: "authenticated", user } : { status: "anonymous", user: null });
    });

    const unsubscribe = onSessionExpired(() => {
      queryClient.clear();
      setState({ status: "anonymous", user: null });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    function endSession() {
      clearSession();
      // Nada do usuário anterior deve continuar em cache.
      queryClient.clear();
      setState({ status: "anonymous", user: null });
    }

    return {
      ...state,
      signIn(session) {
        log.info("signIn", `${session.user.email} entrou`);
        startSession(session);
        setState({ status: "authenticated", user: session.user });
      },
      async signOut() {
        log.info("signOut", "Usuário pediu para sair");
        const refresh = getRefreshToken();
        endSession();
        if (refresh) await logout(refresh).catch(() => {});
      },
      endSession,
    };
  }, [state, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro do <AuthProvider>.");
  return context;
}
