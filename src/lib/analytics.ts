/**
 * MyDesk 자체 이벤트 로그 모듈
 *
 * 외부 분석 도구 없이 localStorage에 이벤트를 적재한다.
 * 브라우저 콘솔에서 아래 명령으로 원시 데이터를 즉시 조회할 수 있다:
 *
 *   JSON.parse(localStorage.getItem('mydesk:events') ?? '[]')
 *
 * 집계 요약:
 *   (await import('/src/lib/analytics.ts')).summarizeEvents()
 */

export type EventName =
  | "session_start"
  | "figma_file_open"
  | "ai_message_sent"
  | "ai_template_used"
  | "task_status_changed"
  | "task_added"
  | "pomodoro_session_completed"
  | "widget_settings_opened"
  | "quick_app_launched"
  | "news_article_clicked";

type EventPayload = {
  name: EventName;
  ts: number;      // Unix ms
  date: string;    // YYYY-MM-DD (날짜별 집계용)
  [key: string]: string | number;
};

const STORAGE_KEY = "mydesk:events";
const MAX_EVENTS  = 500; // 오래된 이벤트 순서로 제거

/** 이벤트 기록 */
export function logEvent(name: EventName, meta?: Record<string, string>): void {
  try {
    const raw  = localStorage.getItem(STORAGE_KEY);
    const logs: EventPayload[] = raw ? (JSON.parse(raw) as EventPayload[]) : [];

    logs.push({
      name,
      ts:   Date.now(),
      date: new Date().toISOString().slice(0, 10),
      ...meta,
    });

    // 최대 건수 초과 시 오래된 이벤트 제거
    if (logs.length > MAX_EVENTS) {
      logs.splice(0, logs.length - MAX_EVENTS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // 시크릿 모드 등 localStorage 접근 불가 시 무시
  }
}

/** 전체 이벤트 조회 */
export function getEvents(): EventPayload[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EventPayload[]) : [];
  } catch {
    return [];
  }
}

/**
 * 날짜 × 이벤트명 집계 요약
 *
 * 반환 예시:
 * {
 *   "2026-03-13": { session_start: 4, ai_message_sent: 7, figma_file_open: 3 },
 *   "2026-03-14": { session_start: 6, pomodoro_session_completed: 2 }
 * }
 */
export function summarizeEvents(): Record<string, Record<string, number>> {
  const events = getEvents();
  const summary: Record<string, Record<string, number>> = {};

  for (const e of events) {
    if (!summary[e.date]) summary[e.date] = {};
    summary[e.date][e.name] = (summary[e.date][e.name] ?? 0) + 1;
  }

  return summary;
}

/**
 * 특정 이벤트의 일별 카운트 반환
 * 예) dailyCount('ai_message_sent') → { "2026-03-13": 7, "2026-03-14": 3 }
 */
export function dailyCount(name: EventName): Record<string, number> {
  const events = getEvents().filter((e) => e.name === name);
  const result: Record<string, number> = {};
  for (const e of events) {
    result[e.date] = (result[e.date] ?? 0) + 1;
  }
  return result;
}

/**
 * 연속 방문 일수 (리텐션 스트릭)
 *
 * session_start 이벤트 기준으로 오늘 포함 며칠 연속 방문했는지 반환.
 * 예) 오늘 포함 10일 연속 방문 → 10
 */
export function retentionStreak(): number {
  const visitDates = new Set(
    getEvents()
      .filter((e) => e.name === "session_start")
      .map((e) => e.date),
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (visitDates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 퍼널 전환율 분석
 *
 * session_start 횟수 대비 각 핵심 기능 이벤트가 발생한 날의 비율을 반환.
 * 날짜 기준으로 측정해 "오늘 방문했을 때 기능도 썼는가"를 나타낸다.
 *
 * 반환 예시:
 * {
 *   sessions: 14,          // 총 방문 일수
 *   figma:    { days: 8,  rate: 0.57 },
 *   ai:       { days: 11, rate: 0.79 },
 *   task:     { days: 6,  rate: 0.43 },
 *   pomodoro: { days: 4,  rate: 0.29 },
 * }
 */
export function funnelConversion(): {
  sessions: number;
  figma:    { days: number; rate: number };
  ai:       { days: number; rate: number };
  task:     { days: number; rate: number };
  pomodoro: { days: number; rate: number };
} {
  const events = getEvents();

  const sessionDates = new Set(
    events.filter((e) => e.name === "session_start").map((e) => e.date),
  );
  const sessions = sessionDates.size;
  if (sessions === 0) {
    return {
      sessions: 0,
      figma:    { days: 0, rate: 0 },
      ai:       { days: 0, rate: 0 },
      task:     { days: 0, rate: 0 },
      pomodoro: { days: 0, rate: 0 },
    };
  }

  const daysWithEvent = (names: EventName[]): number =>
    new Set(
      events.filter((e) => names.includes(e.name)).map((e) => e.date),
    ).size;

  const figmaDays    = daysWithEvent(["figma_file_open"]);
  const aiDays       = daysWithEvent(["ai_message_sent", "ai_template_used"]);
  const taskDays     = daysWithEvent(["task_status_changed", "task_added"]);
  const pomodoroDays = daysWithEvent(["pomodoro_session_completed"]);

  return {
    sessions,
    figma:    { days: figmaDays,    rate: Math.round((figmaDays    / sessions) * 100) / 100 },
    ai:       { days: aiDays,       rate: Math.round((aiDays       / sessions) * 100) / 100 },
    task:     { days: taskDays,     rate: Math.round((taskDays     / sessions) * 100) / 100 },
    pomodoro: { days: pomodoroDays, rate: Math.round((pomodoroDays / sessions) * 100) / 100 },
  };
}
