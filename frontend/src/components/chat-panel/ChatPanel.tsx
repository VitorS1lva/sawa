"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { useSendChatMessage } from "@/lib/api/queries";
import type { ChatMessage } from "@/lib/api/types";
import { chatPanelConfig as config } from "./ChatPanel.config";
import styles from "./ChatPanel.module.css";

type ChatPanelProps = {
  /** Ações marcadas, enviadas como contexto para o agente. */
  tickers: string[];
};

const welcomeMessage: ChatMessage = { id: "welcome", role: "assistant", content: config.welcome };

/** Chat com o agente de IA da plataforma. */
export function ChatPanel({ tickers }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const send = useSendChatMessage();
  const listRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Mantém a última mensagem visível.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, send.isPending]);

  function submit() {
    const content = draft.trim();
    if (!content || send.isPending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const history = [...messages.filter((m) => m !== welcomeMessage), userMessage];
    setMessages((current) => [...current, userMessage]);
    setDraft("");

    send.mutate(
      { messages: history.map(({ role, content }) => ({ role, content })), tickers },
      { onSuccess: (reply) => setMessages((current) => [...current, reply]) },
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  // Enter envia; Shift+Enter quebra a linha.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {config.title}
      </h2>

      <div ref={listRef} className={styles.messages} role="log" aria-live="polite">
        {messages.map((message) => (
          <p key={message.id} className={styles.message} data-role={message.role}>
            {message.content}
          </p>
        ))}
        {send.isPending && (
          <p className={styles.message} data-role="assistant" data-pending="true">
            {config.thinking}
          </p>
        )}
        {send.isError && (
          <p className={styles.error} role="alert">
            {config.errorMessage}
          </p>
        )}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          className={styles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={config.placeholder}
          aria-label={config.placeholder}
          rows={2}
        />
        <button
          type="submit"
          className={styles.send}
          disabled={!draft.trim() || send.isPending}
          aria-label={config.sendLabel}
        >
          <SendHorizontal aria-hidden="true" />
        </button>
      </form>
      <p className={styles.disclaimer}>{config.disclaimer}</p>
    </section>
  );
}
