"use client";

import { useEffect, useState, type FormEvent } from "react";
import { resendCode, verifyCode } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import type { Session } from "@/lib/api/types";
// Mesmo visual do formulário de login e cadastro.
import formStyles from "@/components/auth-form/AuthForm.module.css";
import { verifyCodeConfig as config } from "./verifyCode.config";
import styles from "./VerifyCodeForm.module.css";

const CODE_LENGTH = 6;

type VerifyCodeFormProps = {
  /** Identifica o cadastro na API. */
  email: string;
  /** WhatsApp mascarado, só para mostrar ("+55 11 •••••-8888"). */
  phone: string;
  /** Segundos até poder pedir outro código (o back-end informa no cadastro). */
  resendIn: number;
  onVerified: (session: Session) => void;
  /** Volta ao formulário de cadastro, para corrigir o número. */
  onChangePhone: () => void;
};

/** Último passo do cadastro: o código de 6 dígitos enviado pelo WhatsApp. */
export function VerifyCodeForm({ email, phone, resendIn, onVerified, onChangePhone }: VerifyCodeFormProps) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [resendAt, setResendAt] = useState(() => Date.now() + resendIn * 1000);
  const [now, setNow] = useState(() => Date.now());

  // Contagem regressiva do botão "Reenviar código".
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

  async function submit(value: string) {
    if (pending || value.length !== CODE_LENGTH) return;
    setPending(true);
    setFeedback(null);
    try {
      onVerified(await verifyCode(email, value));
    } catch (error) {
      setFeedback({ status: "error", message: toApiError(error).message });
      setCode("");
    } finally {
      setPending(false);
    }
  }

  function handleChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    // Envia sozinho ao completar os 6 dígitos (inclusive ao colar o código).
    if (digits.length === CODE_LENGTH) submit(digits);
  }

  async function handleResend() {
    setFeedback(null);
    try {
      const { resend_available_in } = await resendCode(email);
      setResendAt(Date.now() + resend_available_in * 1000);
      setNow(Date.now());
      setFeedback({ status: "success", message: config.resentMessage });
    } catch (error) {
      setFeedback({ status: "error", message: toApiError(error).message });
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit(code);
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit}>
      <p className={styles.intro}>
        {config.intro} <strong className={styles.phone}>{phone}</strong>. {config.validity}
      </p>

      <label className={formStyles.field}>
        <span className={formStyles.label}>{config.label}</span>
        <input
          className={`${formStyles.input} ${styles.code}`}
          value={code}
          onChange={(event) => handleChange(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={CODE_LENGTH}
          placeholder="000000"
          required
          autoFocus
          disabled={pending}
        />
      </label>

      {feedback && (
        <p
          role={feedback.status === "error" ? "alert" : "status"}
          className={formStyles.feedback}
          data-status={feedback.status}
        >
          {feedback.message}
        </p>
      )}

      <button type="submit" className={formStyles.submit} disabled={pending || code.length !== CODE_LENGTH}>
        {pending ? config.pendingLabel : config.submitLabel}
      </button>

      <div className={styles.actions}>
        <button type="button" className={formStyles.link} onClick={handleResend} disabled={secondsLeft > 0}>
          {secondsLeft > 0 ? config.resendCountdown(secondsLeft) : config.resendLabel}
        </button>
        <button type="button" className={formStyles.link} onClick={onChangePhone}>
          {config.changePhoneLabel}
        </button>
      </div>
    </form>
  );
}
