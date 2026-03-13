"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, RefreshCw, Moon } from "lucide-react";

// ─── AI 조언 탭 ───────────────────────────────────────────────────────────────

const TIPS = [
  "진료화면 리뉴얼 기획서 마감이 이틀 남았어요. 오늘 집중해보는 건 어떨까요?",
  "읽지 않은 메시지 2건이 있어요. QA팀 메시지를 먼저 확인해보세요.",
  "오늘 뽀모도로 0세션 완료! 첫 세션을 시작해볼까요?",
  "어제 미완료 항목이 2건 있어요. 데일리 노트에서 확인해보세요.",
  "스프린트 회고 자료 준비가 오늘 마감이에요. 잊지 마세요!",
  "EMR 대시보드 사용자 인터뷰 일정을 캘린더에서 한 번 더 확인해보세요.",
  "보안팀 검토 요청이 보류 중이에요. 오늘 팔로업해보는 건 어떨까요?",
];

const FORTUNE_FALLBACKS = [
  "오늘은 기획 문서에 영감이 쏟아지는 날! 피그마를 열면 좋은 일이 생길 거예요 ✨",
  "점심 후 회의에서 좋은 피드백을 받을 수 있어요. 자신감을 가지세요 💪",
  "오늘의 럭키 도구: Claude. AI한테 물어보면 답이 나올 거예요 🤖",
  "오늘은 꼼꼼하게 검토할수록 빛나는 날이에요. 디테일이 완성도를 만들어요 🌟",
  "동료의 작은 한마디가 오늘 하루를 바꿀 수 있어요. 먼저 말 걸어보세요 ☕",
];

function pickRandom<T>(arr: T[], exclude?: T): T {
  let item = arr[Math.floor(Math.random() * arr.length)];
  if (exclude !== undefined && arr.length > 1) {
    while (item === exclude) item = arr[Math.floor(Math.random() * arr.length)];
  }
  return item;
}

function todayKey(): string {
  return `mydesk:fortune:${new Date().toISOString().slice(0, 10)}`;
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

// ─── 운세 훅 ──────────────────────────────────────────────────────────────────

type FortuneState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string }
  | { status: "error"; text: string };

function useFortune() {
  const [state, setState] = useState<FortuneState>({ status: "idle" });

  const load = async () => {
    // 캐시 확인
    try {
      const cached = localStorage.getItem(todayKey());
      if (cached) {
        setState({ status: "done", text: cached });
        return;
      }
    } catch {}

    setState({ status: "loading" });

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `오늘은 ${getTodayLabel()}입니다. EMR 업계 기획자에게 재미있고 따뜻한 오늘의 업무 운세를 2~3줄로 짧게 만들어줘. 이모지도 넣어줘.`,
            },
          ],
        }),
      });

      const data: { content?: string; error?: string } = await res.json();

      if (!res.ok || !data.content) throw new Error(data.error ?? "");

      try {
        localStorage.setItem(todayKey(), data.content);
      } catch {}

      setState({ status: "done", text: data.content });
    } catch {
      const fallback = pickRandom(FORTUNE_FALLBACKS);
      setState({ status: "done", text: fallback });
    }
  };

  return { state, load };
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

type Tab = "advice" | "fortune";

export function AiBanner() {
  const [visible, setVisible] = useState(true);
  const [tab, setTab] = useState<Tab>("advice");
  const [tip, setTip] = useState(() => pickRandom(TIPS));
  const [spinning, setSpinning] = useState(false);
  const { state: fortune, load: loadFortune } = useFortune();

  useEffect(() => {
    if (tab === "fortune" && fortune.status === "idle") {
      loadFortune();
    }
  }, [tab]);

  if (!visible) return null;

  const refreshTip = () => {
    setSpinning(true);
    setTimeout(() => {
      setTip((prev) => pickRandom(TIPS, prev));
      setSpinning(false);
    }, 380);
  };

  const isAdvice = tab === "advice";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[rgba(8,8,24,0.65)] backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.10)]">

      {/* 탭별 배경 ambient glow */}
      <div
        className={`pointer-events-none absolute inset-0 transition-all duration-700 ${
          isAdvice
            ? "bg-[radial-gradient(ellipse_60%_100%_at_0%_50%,rgba(99,102,241,0.22),transparent),radial-gradient(ellipse_40%_80%_at_100%_50%,rgba(37,99,235,0.10),transparent)]"
            : "bg-[radial-gradient(ellipse_60%_100%_at_0%_50%,rgba(168,85,247,0.25),transparent),radial-gradient(ellipse_40%_80%_at_100%_50%,rgba(236,72,153,0.12),transparent)]"
        }`}
      />

      {/* 왼쪽 액센트 바 */}
      <div
        className={`absolute left-0 top-0 h-full w-[3px] rounded-l-2xl transition-all duration-500 ${
          isAdvice
            ? "bg-[linear-gradient(to_bottom,#818cf8,#3b82f6)]"
            : "bg-[linear-gradient(to_bottom,#c084fc,#f472b6)]"
        }`}
      />

      <div className="relative flex items-center gap-3 pl-4 pr-3 py-3 sm:gap-4 sm:pl-6 sm:py-4">

        {/* 아이콘 — 모바일 숨김 */}
        <div
          className={`hidden sm:flex shrink-0 h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-500 ${
            isAdvice
              ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.35),rgba(37,99,235,0.25))] border-indigo-400/30 shadow-[0_0_24px_rgba(99,102,241,0.30)]"
              : "bg-[linear-gradient(135deg,rgba(168,85,247,0.35),rgba(236,72,153,0.25))] border-purple-400/30 shadow-[0_0_24px_rgba(168,85,247,0.30)]"
          }`}
        >
          {isAdvice
            ? <Sparkles className="h-5 w-5 text-indigo-200" />
            : <Moon className="h-5 w-5 text-purple-200" />
          }
        </div>

        {/* 텍스트 영역 */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* 탭 pill */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.06] p-0.5">
              <button
                onClick={() => setTab("advice")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold transition-all ${
                  isAdvice
                    ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.6),rgba(37,99,235,0.6))] text-white shadow-sm"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                <Sparkles className="h-2.5 w-2.5" />
                AI 조언
              </button>
              <button
                onClick={() => setTab("fortune")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold transition-all ${
                  !isAdvice
                    ? "bg-[linear-gradient(135deg,rgba(168,85,247,0.6),rgba(236,72,153,0.6))] text-white shadow-sm"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                <Moon className="h-2.5 w-2.5" />
                오늘의 운세
              </button>
            </div>
          </div>

          {/* 메시지 */}
          {isAdvice && (
            <p className="text-sm font-medium text-white/90 leading-relaxed line-clamp-3 sm:line-clamp-none">
              {tip}
            </p>
          )}
          {!isAdvice && (
            <div>
              {fortune.status === "idle" && (
                <p className="text-sm text-white/40">운세를 불러오는 중...</p>
              )}
              {fortune.status === "loading" && (
                <span className="flex items-center gap-2 text-sm text-white/50">
                  <span className="animate-bounce [animation-delay:0ms]">✦</span>
                  <span className="animate-bounce [animation-delay:150ms]">✦</span>
                  <span className="animate-bounce [animation-delay:300ms]">✦</span>
                  <span className="ml-0.5">오늘의 운세를 읽는 중...</span>
                </span>
              )}
              {fortune.status === "done" && (
                <p className="text-sm font-medium text-white/90 leading-relaxed line-clamp-2">
                  {fortune.text}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex shrink-0 items-center gap-0.5">
          {isAdvice && (
            <button
              onClick={refreshTip}
              aria-label="다른 조언 보기"
              className="p-2 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`} />
            </button>
          )}
          <button
            onClick={() => setVisible(false)}
            aria-label="배너 닫기"
            className="p-2 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
