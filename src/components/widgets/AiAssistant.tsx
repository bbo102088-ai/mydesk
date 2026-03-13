"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AiMessage } from "@/types";
import { Send, Zap } from "lucide-react";

type Tab = "groq" | "chatgpt" | "gemini";

const TAB_LABELS: Record<Tab, string> = {
  groq: "Groq (Llama)",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
};

const INACTIVE_TABS: Tab[] = ["chatgpt", "gemini"];

export function AiAssistant() {
  const [activeTab, setActiveTab] = useState<Tab>("groq");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading || activeTab !== "groq") return;

    const userMsg: AiMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      let data: { content?: string; error?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error("서버 응답을 읽을 수 없습니다. 잠시 후 다시 시도해 주세요.");
      }

      if (!res.ok) {
        throw new Error(data.error ?? "알 수 없는 오류가 발생했습니다.");
      }

      const assistantMsg: AiMessage = {
        role: "assistant",
        content: data.content,
        model: "llama-3.3-70b-versatile",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "응답을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isInactiveTab = INACTIVE_TABS.includes(activeTab);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">AI 어시스턴트 허브</CardTitle>
          {activeTab === "groq" && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" />
              <span>Groq · 실시간</span>
            </div>
          )}
        </div>
        <div className="flex gap-0.5 mt-2 bg-white/5 rounded-lg p-0.5">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                activeTab === tab
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/45 hover:text-white/80"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div ref={scrollRef} className="h-52 overflow-y-auto space-y-3 mb-3 pr-1">
          {isInactiveTab ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-white/30 text-center">
                {TAB_LABELS[activeTab]} 연동은 준비 중입니다.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-white/25 text-center pt-20">
              Llama 3.3에게 무엇이든 물어보세요
            </p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={`${msg.timestamp}-${i}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-indigo-600/70 text-white"
                      : "bg-white/10 text-white/85"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl px-4 py-2 text-sm text-white/40 flex gap-1 items-center">
                <span className="animate-bounce [animation-delay:0ms]">·</span>
                <span className="animate-bounce [animation-delay:150ms]">·</span>
                <span className="animate-bounce [animation-delay:300ms]">·</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-3 py-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20">
                {error}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && sendMessage()}
            placeholder={
              isInactiveTab
                ? `${TAB_LABELS[activeTab]}은 준비 중입니다`
                : "메시지를 입력하세요 (Enter)"
            }
            disabled={isLoading || isInactiveTab}
            className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-500/80 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || isInactiveTab}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
