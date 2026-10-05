import type { AuthFormConfig } from "@/components/auth-form/auth.config";

/** Formulário de "Minha conta": o usuário edita os próprios dados. */
export const accountPanel: AuthFormConfig = {
  title: "Minha conta",
  fields: [
    {
      name: "name",
      label: "Nome",
      type: "text",
      placeholder: "Seu nome",
      autoComplete: "name",
      required: true,
    },
    {
      name: "email",
      label: "E-mail",
      type: "email",
      placeholder: "voce@exemplo.com",
      autoComplete: "email",
      required: true,
    },
    {
      name: "password",
      label: "Nova senha",
      type: "password",
      placeholder: "Deixe em branco para manter",
      autoComplete: "new-password",
      minLength: 8,
    },
    {
      name: "passwordConfirm",
      label: "Confirmar nova senha",
      type: "password",
      placeholder: "Repita a nova senha",
      autoComplete: "new-password",
      mustMatch: "password",
    },
  ],
  submitLabel: "Salvar alterações",
  successMessage: "Edição de conta disponível em breve.",
  mismatchMessage: "As senhas não coincidem.",
};
