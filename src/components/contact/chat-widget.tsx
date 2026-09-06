"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget({ configured }: { configured: boolean }) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  if (!configured) {
    return <p className="text-sm text-ink-soft">{t("notConfigured")}</p>;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { reply: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border border-line bg-cream">
      <div className="max-h-96 min-h-[10rem] space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-ink-soft">{t("intro")}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] bg-ink px-3 py-2 text-sm text-white"
                : "mr-auto max-w-[85%] bg-cream-deep px-3 py-2 text-sm"
            }
          >
            {m.content}
          </div>
        ))}
        {sending && <p className="text-xs text-ink-soft">{t("thinking")}</p>}
        {error && <p className="text-xs text-red-600">{t("error")}</p>}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-line p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          className="w-full min-w-0 border border-line bg-cream px-3 py-2 text-sm placeholder:text-ink-soft focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="shrink-0 bg-ink px-5 py-2 text-xs uppercase tracking-[0.1em] text-white transition-colors hover:bg-accent disabled:opacity-50"
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}
