import { api } from "./client";
import { endpoints, USE_MOCKS } from "./config";
import type { ChatMessage, ChatRequest } from "./types";

/** Envia a conversa ao agente de IA e devolve a resposta dele. */
export async function sendChatMessage(request: ChatRequest): Promise<ChatMessage> {
  if (USE_MOCKS) return (await import("./mocks")).mockChatReply(request);
  const { data } = await api.post<ChatMessage>(endpoints.chat, request);
  return data;
}
