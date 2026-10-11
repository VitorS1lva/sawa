import { createLogger } from "@/lib/log/logger";
import { api } from "./client";
import { endpoints, mocked } from "./config";
import { toApiError } from "./errors";
import type { AuthTokens, AuthUser, PendingSignup, Session, SignupInput } from "./types";

/*
 * Cadastro, confirmação de e-mail e login (veja backend/README.md).
 * Todas as funções lançam ApiError em caso de erro.
 */

async function post<T>(url: string, body: unknown): Promise<T> {
  try {
    const { data } = await api.post<T>(url, body);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

const mocks = () => import("./mocks");

const log = createLogger("api.auth");

/** De onde vem a resposta: do Django ou dos dados de exemplo (sem NEXT_PUBLIC_API_URL). */
const source = () => (mocked("auth") ? "dados de exemplo (mock)" : "API Django");

/** Cria a conta (ainda não confirmada) e envia o código de 6 dígitos pelo WhatsApp. */
export async function signup(input: SignupInput): Promise<PendingSignup> {
  log.info("signup", `Enviando cadastro de ${input.email} → ${source()}`);
  if (mocked("auth")) return (await mocks()).mockSignup(input);
  return post(endpoints.auth.signup, input);
}

/** Confere o código recebido no WhatsApp; se certo, a conta é confirmada e o usuário já entra. */
export async function verifyCode(email: string, code: string): Promise<Session> {
  log.info("verifyCode", `Conferindo o código de ${email} → ${source()}`);
  if (mocked("auth")) return (await mocks()).mockVerifyCode(email, code);
  return post(endpoints.auth.verifyCode, { email, code });
}

export async function resendCode(email: string): Promise<{ resend_available_in: number }> {
  log.info("resendCode", `Pedindo um novo código para ${email} → ${source()}`);
  if (mocked("auth")) return (await mocks()).mockResendCode();
  return post(endpoints.auth.resendCode, { email });
}

/** Lança ApiError com code "phone_not_verified" se a senha estiver certa mas o WhatsApp não confirmado. */
export async function login(email: string, password: string): Promise<Session> {
  log.info("login", `Login de ${email} → ${source()}`);
  if (mocked("auth")) return (await mocks()).mockLogin(email);
  return post(endpoints.auth.login, { email, password });
}

/** Troca o refresh por tokens novos (o refresh antigo deixa de valer). */
export async function refreshTokens(refresh: string): Promise<AuthTokens> {
  log.debug("refreshTokens", `Trocando o refresh token por um par novo → ${source()}`);
  if (mocked("auth")) return (await mocks()).mockRefresh(refresh);
  return post(endpoints.auth.refresh, { refresh });
}

/** Invalida o refresh token no servidor. */
export async function logout(refresh: string): Promise<void> {
  log.info("logout", `Invalidando o refresh token no servidor → ${source()}`);
  if (mocked("auth")) return;
  await post(endpoints.auth.logout, { refresh });
}

export async function fetchMe(): Promise<AuthUser> {
  log.debug("fetchMe", `Buscando os dados do usuário logado → ${source()}`);
  if (mocked("auth")) return (await mocks()).mockMe();
  try {
    const { data } = await api.get<AuthUser>(endpoints.auth.me);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}
