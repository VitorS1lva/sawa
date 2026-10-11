"use client";

import { useId, useState, type FormEvent } from "react";
import { toApiError } from "@/lib/api/errors";
import type { AuthFormConfig } from "./auth.config";
import styles from "./AuthForm.module.css";

export type FormValues = Record<string, string>;

type AuthFormProps = {
  config: AuthFormConfig;
  /**
   * Envia os dados. Se lançar um erro, a mensagem aparece no formulário
   * (erros por campo, vindos da API, aparecem embaixo do campo).
   */
  onSubmit?: (values: FormValues) => Promise<void>;
  /** Chamado ao clicar no link de troca (ex.: do login para o cadastro). */
  onSwitch?: () => void;
};

type Feedback = { status: "success" | "error"; message: string } | null;

/** Formulário de login, cadastro ou dados da conta, montado a partir de um AuthFormConfig. */
export function AuthForm({ config, onSubmit, onSwitch }: AuthFormProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const idPrefix = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const values = Object.fromEntries(
      [...new FormData(event.currentTarget)].map(([key, value]) => [key, String(value)]),
    );

    const mismatch = config.fields.some((field) => field.mustMatch && values[field.name] !== values[field.mustMatch]);
    if (mismatch) {
      setFeedback({ status: "error", message: config.mismatchMessage ?? "" });
      return;
    }

    setFeedback(null);
    setFieldErrors({});
    setPending(true);
    try {
      await onSubmit?.(values);
      if (config.successMessage) setFeedback({ status: "success", message: config.successMessage });
    } catch (error) {
      const apiError = toApiError(error);
      // Erros de campos que existem no formulário vão embaixo deles; o resto, no rodapé.
      const known = Object.fromEntries(
        Object.entries(apiError.fields).filter(([name]) => config.fields.some((field) => field.name === name)),
      );
      setFieldErrors(known);
      if (Object.keys(known).length === 0) setFeedback({ status: "error", message: apiError.message });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {config.fields.map((field) => {
        const errors = fieldErrors[field.name];
        const inputId = `${idPrefix}-${field.name}`;
        const errorId = `${inputId}-erro`;

        // O erro fica fora do <label>, para não virar parte do nome do campo nos leitores de tela.
        return (
          <div key={field.name} className={styles.field}>
            <label htmlFor={inputId} className={styles.label}>
              {field.label}
            </label>
            <input
              id={inputId}
              className={styles.input}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              required={field.required}
              minLength={field.minLength}
              aria-invalid={errors ? true : undefined}
              aria-describedby={errors ? errorId : undefined}
            />
            {errors && (
              <span id={errorId} className={styles.fieldError}>
                {errors.join(" ")}
              </span>
            )}
          </div>
        );
      })}

      {feedback && (
        <p role={feedback.status === "error" ? "alert" : "status"} className={styles.feedback} data-status={feedback.status}>
          {feedback.message}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending && config.pendingLabel ? config.pendingLabel : config.submitLabel}
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
