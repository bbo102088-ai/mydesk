import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { origin } = new URL(req.url);
  const response = NextResponse.redirect(`${origin}/`);
  response.cookies.delete("mydesk_access_token");
  response.cookies.delete("mydesk_refresh_token");
  response.cookies.delete("mydesk_user_email");
  return response;
}
