import { api } from "./client";
import { endpoints, mocked } from "./config";
import { toApiError } from "./errors";

/** Exclui a conta do usuário logado. Quem chama encerra a sessão em seguida. */
export async function deleteAccount(): Promise<void> {
  if (mocked("account")) return (await import("./mocks")).mockDeleteAccount();
  try {
    await api.delete(endpoints.auth.me);
  } catch (error) {
    throw toApiError(error);
  }
}
