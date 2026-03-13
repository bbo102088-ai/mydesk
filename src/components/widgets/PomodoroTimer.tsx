"use client";

import { useMemo } from "react";

import { usePomodoro } from "@/hooks/usePomodoro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function PomodoroTimer() {
  const { state, start, pause, reset } = usePomodoro();

  const sessionDots = useMemo(() => {
    const maxDots = 4;
    const completed = Math.min(state.completedSessions, maxDots);
    return Array.from({ length: maxDots }, (_, index) => index < completed);
  }, [state.completedSessions]);

  const isFocus = state.mode === "focus";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-card-foreground">
            뽀모도로 타이머
          </CardTitle>
          <span className="rounded-full bg-[rgba(255,255,255,0.08)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-200">
            {isFocus ? "집중 모드" : "휴식 중"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="font-mono text-4xl tracking-[0.2em] text-slate-50">
            {formatTime(state.remainingSeconds)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isFocus ? "25분 집중 후 5분 휴식" : "잠깐 숨 고르기 시간입니다"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {state.isRunning ? (
            <Button
              size="sm"
              onClick={pause}
              className="px-4 text-xs font-semibold [background:linear-gradient(135deg,#7c3aed,#2563eb)] shadow-[0_0_18px_rgba(124,58,237,0.4)]"
            >
              일시정지
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={start}
              className="px-4 text-xs font-semibold [background:linear-gradient(135deg,#7c3aed,#2563eb)] shadow-[0_0_18px_rgba(124,58,237,0.4)]"
            >
              {state.mode === "focus" ? "시작" : "계속"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={reset}
            className="border-[rgba(148,163,184,0.7)] bg-transparent px-3 text-[11px] text-slate-200 hover:bg-[rgba(15,23,42,0.85)]"
          >
            리셋
          </Button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>오늘 완료 세션</span>
          <div className="flex items-center gap-1">
            {sessionDots.map((filled, index) => (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className={
                  filled
                    ? "size-1.5 rounded-full bg-gradient-to-tr from-orange-400 to-indigo-400 shadow-[0_0_8px_rgba(249,115,22,0.9)]"
                    : "size-1.5 rounded-full bg-slate-600"
                }
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

