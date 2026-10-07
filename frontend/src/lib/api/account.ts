import { api, setAccessToken } from "./client";
import { endpoints, USE_MOCKS } from "./config";

/** Exclui a conta do usuário logado e descarta o token da sessão. */
export async function deleteAccount(): Promise<void> {
  if (USE_MOCKS) await (await import("./mocks")).mockDeleteAccount();
  else await api.delete(endpoints.account);
  setAccessToken(null);
}
