"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, LogOut, RefreshCw, Loader2, X } from "lucide-react";
import type { CalendarEvent } from "@/types";

// ── Google Calendar 색상 팔레트 ───────────────────────────────────────────────

const GOOGLE_COLORS: Record<string, string> = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
  "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
  "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};

// ── 유틸 함수 ─────────────────────────────────────────────────────────────────

function isAllDay(event: CalendarEvent): boolean {
  return !!event.start.date && !event.start.dateTime;
}

function getEventDate(event: CalendarEvent): string {
  return (event.start.dateTime ?? event.start.date ?? "").slice(0, 10);
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const label = `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
  if (dateStr === todayStr) return `오늘, ${label}`;
  if (dateStr === tomorrowStr) return `내일, ${label}`;
  return label;
}

function groupEventsByDate(events: CalendarEvent[]): [string, CalendarEvent[]][] {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const d = getEventDate(ev);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(ev);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function getUserEmail(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/mydesk_user_email=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

// ── 일정 추가 폼 ──────────────────────────────────────────────────────────────

type NewEventForm = {
  summary: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
};

function CreateEventForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<NewEventForm>({
    summary: "",
    date: today,
    startTime: "09:00",
    endTime: "10:00",
    allDay: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof NewEventForm>(key: K, val: NewEventForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.summary.trim()) { setError("제목을 입력해주세요."); return; }
    setSubmitting(true);
    setError("");

    // 종일 이벤트: Google Calendar API의 end.date는 exclusive (다음 날)
    const endDate = new Date(new Date(form.date).getTime() + 86400000)
      .toISOString()
      .slice(0, 10);

    const body = form.allDay
      ? { summary: form.summary.trim(), start: { date: form.date }, end: { date: endDate } }
      : {
          summary: form.summary.trim(),
          start: { dateTime: `${form.date}T${form.startTime}:00`, timeZone: "Asia/Seoul" },
          end: { dateTime: `${form.date}T${form.endTime}:00`, timeZone: "Asia/Seoul" },
        };

    const res = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);
    if (res.ok) {
      onCreated();
      onClose();
    } else {
      setError("일정 생성에 실패했습니다.");
    }
  };

  const inputCls =
    "rounded-lg border border-white/10 bg-white/[0.07] px-3 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/70 [color-scheme:dark]";

  return (
    <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.05] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-white/60">새 일정 추가</p>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <input
        type="text"
        placeholder="제목 (필수)"
        value={form.summary}
        onChange={(e) => update("summary", e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        autoFocus
        className={`w-full ${inputCls}`}
      />

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="date"
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
          className={inputCls}
        />
        <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.allDay}
            onChange={(e) => update("allDay", e.target.checked)}
            className="rounded accent-indigo-500"
          />
          종일
        </label>
      </div>

      {!form.allDay && (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => update("startTime", e.target.value)}
            className={inputCls}
          />
          <span className="text-white/30 text-xs">~</span>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => update("endTime", e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="sm"
          className="[background:linear-gradient(135deg,#7c3aed,#2563eb)] disabled:opacity-40"
        >
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "추가"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} className="text-white/50">
          취소
        </Button>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

type AuthState = "checking" | "unauthenticated" | "authenticated";

export function CalendarView() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar/events?days=14");
      if (res.status === 401) {
        setAuthState("unauthenticated");
        return;
      }
      if (!res.ok) {
        setError("일정을 불러오는 데 실패했습니다.");
        return;
      }
      const data: { events: CalendarEvent[] } = await res.json();
      setEvents(data.events);
      setAuthState("authenticated");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    setUserEmail(getUserEmail());
  }, [fetchEvents]);

  const grouped = groupEventsByDate(events);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-base shrink-0">Google 캘린더</CardTitle>
            {authState === "authenticated" && userEmail && (
              <span className="truncate max-w-[100px] text-[10px] text-white/30">
                {userEmail}
              </span>
            )}
          </div>
          {authState === "authenticated" && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowCreateForm((v) => !v)}
                className="p-1.5 rounded-lg text-white/40 hover:text-indigo-300 transition-colors"
                aria-label="일정 추가"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-colors disabled:opacity-40"
                aria-label="새로고침"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <a
                href="/api/auth/logout"
                className="p-1.5 rounded-lg text-white/30 hover:text-red-400/70 transition-colors"
                aria-label="로그아웃"
              >
                <LogOut className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* ── 인증 확인 중 ── */}
        {authState === "checking" && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-white/30" />
          </div>
        )}

        {/* ── 미인증 ── */}
        {authState === "unauthenticated" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/25">
              <CalendarDays className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Google 캘린더 연결</p>
              <p className="mt-1 text-xs text-white/40 leading-relaxed">
                Google 계정으로 로그인하면<br />
                일정을 대시보드에서 바로 확인·추가할 수 있어요
              </p>
            </div>
            <a href="/api/auth/google">
              <Button className="[background:linear-gradient(135deg,#7c3aed,#2563eb)]">
                Google로 로그인
              </Button>
            </a>
          </div>
        )}

        {/* ── 인증됨 ── */}
        {authState === "authenticated" && (
          <>
            {error && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            {showCreateForm && (
              <CreateEventForm
                onClose={() => setShowCreateForm(false)}
                onCreated={fetchEvents}
              />
            )}

            {grouped.length === 0 && !loading ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarDays className="h-8 w-8 text-white/15" />
                <p className="text-xs text-white/30">앞으로 2주간 일정이 없어요</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-xs text-indigo-400/70 hover:text-indigo-300 transition-colors"
                >
                  + 첫 일정 추가하기
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {grouped.map(([date, dayEvents]) => (
                  <div key={date}>
                    <p className="mb-1.5 text-[11px] font-semibold text-white/35 tracking-wide">
                      {formatDateHeader(date)}
                    </p>
                    <div className="space-y-0.5">
                      {dayEvents.map((ev) => (
                        <a
                          key={ev.id}
                          href={ev.htmlLink ?? "https://calendar.google.com"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-white/[0.05] transition-colors group"
                        >
                          <span
                            className="mt-[5px] h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor: ev.colorId
                                ? GOOGLE_COLORS[ev.colorId]
                                : "#6366f1",
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white/80 truncate group-hover:text-white transition-colors">
                              {ev.summary ?? "(제목 없음)"}
                            </p>
                            <p className="text-[11px] text-white/35">
                              {isAllDay(ev)
                                ? "종일"
                                : `${formatTime(ev.start.dateTime!)} – ${formatTime(ev.end.dateTime!)}`}
                            </p>
                            {ev.location && (
                              <p className="text-[11px] text-white/25 truncate">
                                📍 {ev.location}
                              </p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
