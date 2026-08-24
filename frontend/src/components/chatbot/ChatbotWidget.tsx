/**
 * ChatbotWidget — Widget de chatbot FAQ flottant.
 *
 * Affiche un bouton flottant en bas à droite.
 * Ouvre un panneau de chat avec recherche dans les FAQs.
 */

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
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
    onSuccess: (data: { sessionId: string }) => {
      setSessionId(data.sessionId);
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
    queryFn: () => apiFetch(`/api/chatbot/history?sessionId=${sessionId}`),
    enabled: !!sessionId,
    onSuccess: (data) => setMessages(data),
  });

  // Envoyer un message
  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      apiFetch("/api/chatbot/message", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          message,
          lang: i18n.language === "fr" ? "fr" : "en",
        }),
      }),
    onSuccess: (data: ChatResponse) => {
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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110"
        aria-label={t("chatbot.open", "Ouvrir le chatbot")}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Panneau de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col border overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
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
              <div className="text-center text-gray-500 py-8">
                <p className="text-3xl mb-2">👋</p>
                <p className="font-medium">{t("chatbot.welcome", "Bonjour ! Comment puis-je vous aider ?")}</p>
                <p className="text-sm mt-1">{t("chatbot.welcomeSub", "Posez-moi vos questions sur Carguinee.")}</p>
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
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {sendMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2 rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Rating */}
          {lastAssistantMsg?.faqEntryId && (
            <div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-2 text-sm">
              <span className="text-gray-500">{t("chatbot.helpful", "Utile ?")}</span>
              <button
                onClick={() =>
                  rateMutation.mutate({ faqEntryId: lastAssistantMsg.faqEntryId!, helpful: true })
                }
                className="hover:bg-green-100 rounded px-2 py-1"
              >
                👍
              </button>
              <button
                onClick={() =>
                  rateMutation.mutate({ faqEntryId: lastAssistantMsg.faqEntryId!, helpful: false })
                }
                className="hover:bg-red-100 rounded px-2 py-1"
              >
                👎
              </button>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t("chatbot.placeholder", "Tapez votre question...")}
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50"
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
