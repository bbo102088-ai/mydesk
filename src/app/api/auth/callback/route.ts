import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? `${origin}/api/auth/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  const tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  } = await tokenRes.json();

  // 사용자 이메일 조회 (표시용)
  let email = "";
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (userRes.ok) {
    const user: { email: string } = await userRes.json();
    email = user.email;
  }

  const response = NextResponse.redirect(`${origin}/`);

  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax" as const,
  };

  response.cookies.set("mydesk_access_token", tokens.access_token, {
    ...base,
    maxAge: tokens.expires_in ?? 3600,
  });

  if (tokens.refresh_token) {
    response.cookies.set("mydesk_refresh_token", tokens.refresh_token, {
      ...base,
      maxAge: 60 * 60 * 24 * 30, // 30일
    });
  }

  if (email) {
    // 클라이언트에서 이메일을 읽어 표시하기 위해 httpOnly: false
    response.cookies.set("mydesk_user_email", email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
