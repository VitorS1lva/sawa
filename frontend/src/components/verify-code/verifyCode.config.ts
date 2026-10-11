export const verifyCodeConfig = {
  title: "Confirme seu WhatsApp",
  /** Texto antes do número (mascarado) do usuário. */
  intro: "Enviamos um código de 6 dígitos pelo WhatsApp para",
  validity: "Ele vale por 10 minutos.",
  label: "Código de confirmação",
  submitLabel: "Confirmar",
  pendingLabel: "Confirmando...",
  resendLabel: "Reenviar código",
  /** Ex.: "Reenviar código em 42 s". */
  resendCountdown: (seconds: number) => `Reenviar código em ${seconds} s`,
  resentMessage: "Enviamos um novo código.",
  changePhoneLabel: "Corrigir número",
};
