"use client";

import { useState, type FormEvent } from "react";
import type { AuthFormConfig } from "./auth.config";
import styles from "./AuthForm.module.css";

type AuthFormProps = {
  config: AuthFormConfig;
  /** Chamado ao clicar no link de troca (ex.: do login para o cadastro). */
  onSwitch?: () => void;
  /** Chamado quando o envio dá certo (ex.: levar para a área do usuário após o login). */
  onSuccess?: () => void;
};

type Feedback = { status: "success" | "error"; message: string } | null;

/** Formulário de login, cadastro ou dados da conta, montado a partir de um AuthFormConfig. */
export function AuthForm({ config, onSwitch, onSuccess }: AuthFormProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const mismatch = config.fields.some(
      (field) => field.mustMatch && data.get(field.name) !== data.get(field.mustMatch),
    );

    if (mismatch) {
      setFeedback({ status: "error", message: config.mismatchMessage ?? "" });
      return;
    }

    // TODO: enviar para a API Django quando o back-end estiver pronto.
    if (onSuccess) {
      onSuccess();
      return;
    }
    setFeedback({ status: "success", message: config.successMessage });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {config.fields.map((field) => (
        <label key={field.name} className={styles.field}>
          <span className={styles.label}>{field.label}</span>
          <input
            className={styles.input}
            name={field.name}
            type={field.type}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            required={field.required}
            minLength={field.minLength}
          />
        </label>
      ))}

      {feedback && (
        <p role="status" className={styles.feedback} data-status={feedback.status}>
          {feedback.message}
        </p>
      )}

      <button type="submit" className={styles.submit}>
        {config.submitLabel}
      </button>

      {config.switchLabel && onSwitch && (
        <p className={styles.switch}>
          {config.switchText}{" "}
          <button type="button" className={styles.link} onClick={onSwitch}>
            {config.switchLabel}
          </button>
        </p>
      )}
    </form>
  );
}
