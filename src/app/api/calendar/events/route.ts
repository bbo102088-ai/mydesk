import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// ── 액세스 토큰 조회 (만료 시 refresh_token으로 갱신) ─────────────────────────

async function getAccessToken(): Promise<{
  token: string | null;
  newToken?: string;
}> {
  const jar = cookies();
  const accessToken = jar.get("mydesk_access_token")?.value;
  if (accessToken) return { token: accessToken };

  const refreshToken = jar.get("mydesk_refresh_token")?.value;
  if (!refreshToken) return { token: null };

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return { token: null };
  const data: { access_token: string } = await res.json();
  return { token: data.access_token, newToken: data.access_token };
}

function attachNewToken(response: NextResponse, token: string) {
  response.cookies.set("mydesk_access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 3600,
  });
}

// ── GET /api/calendar/events — 이벤트 목록 조회 ──────────────────────────────

export async function GET(req: NextRequest) {
  const { token, newToken } = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const days = parseInt(new URL(req.url).searchParams.get("days") ?? "14");
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    orderBy: "startTime",
    singleEvents: "true",
    maxResults: "50",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );

  if (res.status === 401) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "Calendar API 오류" }, { status: res.status });
  }

  const data: { items: unknown[] } = await res.json();
  const response = NextResponse.json({ events: data.items ?? [] });
  if (newToken) attachNewToken(response, newToken);
  return response;
}

// ── POST /api/calendar/events — 이벤트 생성 ──────────────────────────────────

export async function POST(req: NextRequest) {
  const { token, newToken } = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body: unknown = await req.json();

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json({ error: errText }, { status: res.status });
  }

  const event: unknown = await res.json();
  const response = NextResponse.json({ event });
  if (newToken) attachNewToken(response, newToken);
  return response;
}
