"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AiMessage } from "@/types";
import { logEvent } from "@/lib/analytics";
import { Send, Zap, Cpu, ChevronDown, ChevronUp } from "lucide-react";

// ── 타입 ─────────────────────────────────────────────────────────────────────

type Tab = "groq" | "chatgpt" | "gemini";

type TaskStatus = "todo" | "doing" | "done" | "hold";

type Task = {
  id: string;
  task: string;
  status: TaskStatus;
  dueDate?: string;
  priority: "high" | "medium" | "low";
};

// ── 상수 ─────────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<Tab, string> = {
  groq: "Groq (Llama)",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
};

const INACTIVE_TABS: Tab[] = ["chatgpt", "gemini"];

// EMR 기획 특화 원클릭 프롬프트 템플릿
const QUICK_PROMPTS = [
  {
    label: "기능 요구사항 정리",
    prompt: "현재 진행 중인 태스크를 기반으로 기능 요구사항을 체계적으로 정리해줘. 기능명 / 사용자 스토리 / 수용 기준 형식으로.",
  },
  {
    label: "UX 개선안",
    prompt: "EMR 진료화면의 UX 개선 아이디어를 3가지 제안해줘. 실제 의료진(의사, 간호사) 사용 패턴을 고려해서.",
  },
  {
    label: "인터뷰 질문",
    prompt: "EMR 사용자(의사, 간호사) 대상 UX 인터뷰 질문 5개를 만들어줘. 현재 불편함과 개선 니즈를 파악하는 데 초점을 맞춰서.",
  },
  {
    label: "경쟁사 분석",
    prompt: "국내외 주요 EMR 소프트웨어(차트, 이지케어텍, Epic, Cerner 등)의 UX 특징을 비교 분석해줘.",
  },
];

// ── 태스크 컨텍스트 읽기 ────────────────────────────────────────────────────

function loadActiveTasks(): Task[] {
  try {
    const raw = localStorage.getItem("mydesk:tasks");
    if (!raw) return [];
    const all: Task[] = JSON.parse(raw);
    return all.filter((t) => t.status === "doing" || t.status === "todo");
  } catch {
    return [];
  }
}

function buildSystemPrompt(tasks: Task[]): string {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  const doing = tasks.filter((t) => t.status === "doing");
  const todo  = tasks.filter((t) => t.status === "todo");

  let prompt =
    "당신은 EMR(전자의무기록) 업계 서비스 기획자의 전문 AI 어시스턴트입니다.\n" +
    "의료 소프트웨어 기획, UX 설계, 요구사항 분석에 특화된 조언을 제공합니다.\n" +
    `오늘 날짜: ${today}\n\n`;

  if (doing.length > 0) {
    prompt += "【현재 진행 중인 태스크】\n";
    doing.forEach((t) => {
      prompt += `• ${t.task}`;
      if (t.dueDate) prompt += ` (마감: ${t.dueDate})`;
      prompt += ` [${t.priority === "high" ? "높음" : t.priority === "medium" ? "보통" : "낮음"}]\n`;
    });
    prompt += "\n";
  }

  if (todo.length > 0) {
    prompt += "【대기 중인 태스크】\n";
    todo.forEach((t) => {
      prompt += `• ${t.task}`;
      if (t.dueDate) prompt += ` (마감: ${t.dueDate})`;
      prompt += "\n";
    });
    prompt += "\n";
  }

  prompt += "위 컨텍스트를 참고하여 기획자의 질문에 실질적이고 구체적으로 답변해주세요.";
  return prompt;
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export function AiAssistant() {
  const [activeTab, setActiveTab] = useState<Tab>("groq");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [contextOpen, setContextOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 컴포넌트 마운트 시 태스크 로드
  useEffect(() => {
    setActiveTasks(loadActiveTasks());
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading || activeTab !== "groq") return;

    const isTemplate = QUICK_PROMPTS.some((qp) => qp.prompt === content);
    if (isTemplate) {
      const qp = QUICK_PROMPTS.find((q) => q.prompt === content)!;
      logEvent("ai_template_used", { template: qp.label });
    } else {
      logEvent("ai_message_sent");
    }

    const userMsg: AiMessage = {
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    // 시스템 프롬프트에 태스크 컨텍스트 주입
    const systemPrompt = buildSystemPrompt(activeTasks);
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...nextMessages.map(({ role, content: c }) => ({ role, content: c })),
    ];

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      let data: { content?: string; error?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error("서버 응답을 읽을 수 없습니다. 잠시 후 다시 시도해 주세요.");
      }

      if (!res.ok) throw new Error(data.error ?? "알 수 없는 오류가 발생했습니다.");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content ?? "",
          model: "llama-3.3-70b-versatile",
          timestamp: Date.now(),
        },
      ]);
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
  const doingTasks = activeTasks.filter((t) => t.status === "doing");

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
              aria-selected={activeTab === tab}
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

      <CardContent className="space-y-2">

        {/* ── 컨텍스트 배너 ── */}
        {!isInactiveTab && activeTasks.length > 0 && (
          <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/10">
            <button
              onClick={() => setContextOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-left"
              aria-expanded={contextOpen}
            >
              <div className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-indigo-400" />
                <span className="text-[10px] font-semibold text-indigo-300">
                  업무 컨텍스트 주입됨
                </span>
                <span className="text-[10px] text-indigo-400/70">
                  · 태스크 {activeTasks.length}개
                </span>
              </div>
              {contextOpen
                ? <ChevronUp className="h-3 w-3 text-indigo-400/60" />
                : <ChevronDown className="h-3 w-3 text-indigo-400/60" />
              }
            </button>

            {contextOpen && (
              <div className="border-t border-indigo-500/15 px-3 pb-2 pt-1.5 space-y-0.5">
                {doingTasks.length > 0 && (
                  <>
                    <p className="text-[9px] font-medium text-indigo-300/60 uppercase tracking-wide mb-1">진행 중</p>
                    {doingTasks.map((t) => (
                      <p key={t.id} className="text-xs text-white/55 truncate">
                        · {t.task}
                        {t.dueDate && (
                          <span className="ml-1 text-white/30">{t.dueDate}</span>
                        )}
                      </p>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 원클릭 템플릿 버튼 ── */}
        {!isInactiveTab && messages.length === 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => sendMessage(qp.prompt)}
                disabled={isLoading}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left text-[11px] text-white/55 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white/80 disabled:opacity-40"
              >
                {qp.label}
              </button>
            ))}
          </div>
        )}

        {/* ── 메시지 영역 ── */}
        <div ref={scrollRef} className="h-44 overflow-y-auto space-y-3 pr-1">
          {isInactiveTab ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-white/30 text-center">
                {TAB_LABELS[activeTab]} 연동은 준비 중입니다.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-white/20 text-center pt-16">
              위 템플릿을 클릭하거나 직접 입력하세요
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

        {/* ── 입력창 ── */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.nativeEvent.isComposing && sendMessage()
            }
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
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim() || isInactiveTab}
            aria-label="메시지 전송"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
