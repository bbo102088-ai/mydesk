"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Settings, CalendarDays, ExternalLink } from "lucide-react";

type ViewMode = "week" | "month" | "agenda";

const MODE_LABELS: Record<ViewMode, string> = {
  week: "주간",
  month: "월간",
  agenda: "일정",
};

const MODE_VALUES: Record<ViewMode, string> = {
  week: "WEEK",
  month: "MONTH",
  agenda: "AGENDA",
};

function buildEmbedUrl(calendarId: string, mode: ViewMode): string {
  const params = new URLSearchParams({
    src: calendarId,
    ctz: "Asia/Seoul",
    mode: MODE_VALUES[mode],
    hl: "ko",
    showTitle: "0",
    showNav: "1",
    showDate: "1",
    showPrint: "0",
    showTabs: "0",
    showCalendars: "0",
    showTz: "0",
    bgcolor: "%23000000",
  });
  return `https://calendar.google.com/calendar/embed?${params.toString()}`;
}

// ─── 설정 화면 ────────────────────────────────────────────────────────────────

function SetupScreen({ onSave }: { onSave: (id: string) => void }) {
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/25">
        <CalendarDays className="h-6 w-6 text-indigo-300" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/80">Google 캘린더 연결</p>
        <p className="mt-1 text-xs text-white/40 leading-relaxed">
          Google 계정 이메일을 입력하면<br />
          브라우저 로그인 세션으로 캘린더를 표시합니다
        </p>
      </div>
      <div className="w-full space-y-2">
        <input
          type="email"
          placeholder="example@gmail.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && input.trim() && onSave(input.trim())}
          className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-500/70 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
        />
        <Button
          onClick={() => input.trim() && onSave(input.trim())}
          disabled={!input.trim()}
          className="w-full [background:linear-gradient(135deg,#7c3aed,#2563eb)] disabled:opacity-40"
        >
          연결하기
        </Button>
      </div>
      <p className="text-[11px] text-white/25">
        Google 계정 로그인이 되어 있어야 표시됩니다
      </p>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function CalendarView() {
  const [calendarId, setCalendarId] = useLocalStorage<string>(
    "mydesk:calendar-id",
    "",
  );
  const [mode, setMode] = useLocalStorage<ViewMode>("mydesk:calendar-mode", "week");
  const [showSettings, setShowSettings] = useState(false);

  const isConnected = calendarId.trim().length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Google 캘린더</CardTitle>
            {isConnected && (
              <span className="truncate max-w-[140px] text-[10px] text-white/30">
                {calendarId}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* 모드 토글 */}
            {isConnected && (
              <div className="flex rounded-lg bg-white/[0.06] p-0.5">
                {(Object.keys(MODE_LABELS) as ViewMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-md px-2 py-0.5 text-[11px] transition-colors ${
                      mode === m
                        ? "bg-white/15 text-white font-medium"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {MODE_LABELS[m]}
                  </button>
                ))}
              </div>
            )}
            {/* 설정 / 외부 링크 */}
            {isConnected && (
              <>
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-colors"
                  aria-label="Google 캘린더 열기"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-colors"
                  aria-label="설정"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 설정 오버레이 */}
        {showSettings && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-2 text-xs font-medium text-white/50">캘린더 계정 변경</p>
            <div className="flex gap-2">
              <input
                type="email"
                defaultValue={calendarId}
                id="cal-input"
                placeholder="example@gmail.com"
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/70"
              />
              <Button
                size="sm"
                onClick={() => {
                  const val = (document.getElementById("cal-input") as HTMLInputElement).value.trim();
                  if (val) { setCalendarId(val); setShowSettings(false); }
                }}
              >
                저장
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSettings(false)} className="text-white/50">
                취소
              </Button>
            </div>
            <button
              onClick={() => { setCalendarId(""); setShowSettings(false); }}
              className="mt-2 text-xs text-red-400/70 hover:text-red-400 transition-colors"
            >
              연결 해제
            </button>
          </div>
        )}

        {!isConnected ? (
          <SetupScreen onSave={(id) => setCalendarId(id)} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <iframe
              src={buildEmbedUrl(calendarId, mode)}
              style={{ border: 0 }}
              width="100%"
              height="480"
              title="Google 캘린더"
              className="block"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
