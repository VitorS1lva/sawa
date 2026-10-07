"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/card/Card";
import { useDeleteAccount } from "@/lib/api/queries";
import { routes } from "@/lib/routes";
import { deleteAccountConfig as config } from "./deleteAccount.config";
import styles from "./DeleteAccount.module.css";

/**
 * Exclusão da conta em dois passos: o botão abre a confirmação,
 * que só libera a exclusão depois de o usuário digitar a palavra de confirmação.
 */
export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const remove = useDeleteAccount();
  const queryClient = useQueryClient();
  const router = useRouter();

  const canSubmit = typed.trim().toUpperCase() === config.confirmWord && !remove.isPending;

  function cancel() {
    setConfirming(false);
    setTyped("");
    remove.reset();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    remove.mutate(undefined, {
      onSuccess: () => {
        // Nada do usuário excluído deve continuar em cache.
        queryClient.clear();
        router.replace(routes.home);
      },
    });
  }

  return (
    <Card title={config.title} className={styles.card}>
      <p className={styles.description}>{config.description}</p>

      {!confirming ? (
        <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>
          {config.startLabel}
        </button>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>{config.confirmLabel}</span>
            <input
              className={styles.input}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={config.confirmWord}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus
            />
          </label>

          {remove.isError && (
            <p className={styles.error} role="alert">
              {config.errorMessage}
            </p>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={cancel} disabled={remove.isPending}>
              {config.cancelLabel}
            </button>
            <button type="submit" className={styles.danger} disabled={!canSubmit}>
              {remove.isPending ? config.pendingLabel : config.submitLabel}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
