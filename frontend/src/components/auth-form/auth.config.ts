export type FormField = {
  name: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  /** Nome de outro campo que precisa ter o mesmo valor (ex.: confirmar senha). */
  mustMatch?: string;
};

export type AuthFormConfig = {
  title: string;
  fields: FormField[];
  submitLabel: string;
  successMessage: string;
  mismatchMessage?: string;
  /** Link no rodapé do balão para trocar de formulário (opcional). */
  switchText?: string;
  switchLabel?: string;
};

export const loginConfig: AuthFormConfig = {
  title: "Entrar",
  fields: [
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
      label: "Senha",
      type: "password",
      placeholder: "••••••••",
      autoComplete: "current-password",
      required: true,
    },
  ],
  submitLabel: "Entrar",
  successMessage: "Login disponível em breve.",
  switchText: "Ainda não tem conta?",
  switchLabel: "Criar conta",
};

export const signupConfig: AuthFormConfig = {
  title: "Criar conta",
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
      label: "Senha",
      type: "password",
      placeholder: "Mínimo de 8 caracteres",
      autoComplete: "new-password",
      required: true,
      minLength: 8,
    },
    {
      name: "passwordConfirm",
      label: "Confirmar senha",
      type: "password",
      placeholder: "Repita a senha",
      autoComplete: "new-password",
      required: true,
      mustMatch: "password",
    },
  ],
  submitLabel: "Criar conta",
  successMessage: "Cadastro disponível em breve.",
  mismatchMessage: "As senhas não coincidem.",
  switchText: "Já tem conta?",
  switchLabel: "Entrar",
};
