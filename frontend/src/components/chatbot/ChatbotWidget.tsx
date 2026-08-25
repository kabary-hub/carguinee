/**
 * ChatbotWidget — Widget de chatbot FAQ flottant avec dark mode.
 *
 * Affiche un bouton flottant en bas à droite.
 * Ouvre un panneau de chat avec recherche dans les FAQs.
 */

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

interface ChatMessage {
  role: string;
  content: string;
  faqEntryId?: string;
  createdAt: string;
}

interface ChatResponse {
  message: string;
  faqEntryId?: string;
  category?: string;
  confidence: number;
  suggestions?: string[];
}

export function ChatbotWidget() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialiser la session
  const initMutation = useMutation({
    mutationFn: (existingId?: string) =>
      apiFetch("/api/chatbot/session", {
        method: "POST",
        body: JSON.stringify({ sessionId: existingId }),
      }),
    onSuccess: (resp: { status: string; data: { sessionId: string } }) => {
      setSessionId(resp.data.sessionId);
    },
  });

  useEffect(() => {
    if (isOpen && !sessionId) {
      initMutation.mutate();
    }
  }, [isOpen, sessionId]);

  // Historique
  useQuery<ChatMessage[]>({
    queryKey: ["chat-history", sessionId],
    queryFn: () => apiFetch<{ status: string; data: ChatMessage[] }>(`/api/chatbot/history?sessionId=${sessionId}`),
    enabled: !!sessionId,
    onSuccess: (resp) => setMessages(resp.data),
  });

  // Envoyer un message
  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      apiFetch("/api/chatbot/message", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          message,
          lang: i18n.language?.startsWith("fr") ? "fr" : "en",
        }),
      }),
    onSuccess: (resp: { status: string; data: ChatResponse }) => {
      const data = resp.data;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, faqEntryId: data.faqEntryId, createdAt: new Date().toISOString() },
      ]);
    },
  });

  // Noter une réponse
  const rateMutation = useMutation({
    mutationFn: ({ faqEntryId, helpful }: { faqEntryId: string; helpful: boolean }) =>
      apiFetch("/api/chatbot/rate", {
        method: "POST",
        body: JSON.stringify({ faqEntryId, helpful }),
      }),
  });

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, createdAt: new Date().toISOString() },
    ]);
    sendMutation.mutate(userMsg);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: suggestion, createdAt: new Date().toISOString() },
    ]);
    sendMutation.mutate(suggestion);
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant" && m.faqEntryId);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg transition-all hover:scale-110 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        aria-label={t("chatbot.open", "Ouvrir le chatbot")}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Panneau de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-96 max-h-[calc(100vh-8rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center gap-3 bg-blue-600 p-4 text-white dark:bg-blue-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">
              🤖
            </div>
            <div>
              <h3 className="font-semibold">{t("chatbot.title", "Assistant Carguinee")}</h3>
              <p className="text-xs opacity-80">{t("chatbot.subtitle", "FAQ & Assistance")}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                <p className="mb-2 text-3xl">👋</p>
                <p className="font-medium">{t("chatbot.welcome", "Bonjour ! Comment puis-je vous aider ?")}</p>
                <p className="mt-1 text-sm">{t("chatbot.welcomeSub", "Posez-moi vos questions sur Carguinee.")}</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-blue-600 text-white dark:bg-blue-500"
                      : "rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}

            {sendMutation.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2 dark:bg-slate-800">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500 [animation-delay:0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500 [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Rating */}
          {lastAssistantMsg?.faqEntryId && (
            <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{t("chatbot.helpful", "Utile ?")}</span>
              <button
                onClick={() =>
                  rateMutation.mutate({ faqEntryId: lastAssistantMsg.faqEntryId!, helpful: true })
                }
                className="rounded px-2 py-1 transition hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
              >
                👍
              </button>
              <button
                onClick={() =>
                  rateMutation.mutate({ faqEntryId: lastAssistantMsg.faqEntryId!, helpful: false })
                }
                className="rounded px-2 py-1 transition hover:bg-rose-100 dark:hover:bg-rose-500/20"
              >
                👎
              </button>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-200 p-3 dark:border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t("chatbot.placeholder", "Tapez votre question...")}
                className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-blue-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMutation.isPending}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
