import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type RequestBody = {
  messages: ChatMessage[];
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;

  console.log("[/api/ai/chat] POST 요청 수신");
  console.log("[/api/ai/chat] API 키 존재 여부:", !!apiKey);
  if (apiKey) {
    console.log("[/api/ai/chat] API 키 앞 10자:", apiKey.slice(0, 10) + "...");
  }

  if (!apiKey) {
    console.error("[/api/ai/chat] GROQ_API_KEY 환경변수 없음");
    return NextResponse.json(
      { error: "GROQ_API_KEY가 설정되지 않았습니다. .env.local을 확인하고 서버를 재시작해 주세요." },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages가 비어 있습니다." },
      { status: 400 },
    );
  }

  console.log("[/api/ai/chat] Groq API 호출 시작, 메시지 수:", messages.length);

  let groqRes: Response;
  try {
    groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[/api/ai/chat] Groq fetch 예외 발생:");
    console.error("  타입:", err instanceof Error ? err.constructor.name : typeof err);
    console.error("  메시지:", err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.cause) {
      console.error("  원인(cause):", err.cause);
    }
    return NextResponse.json(
      {
        error: `Groq 서버 연결 실패: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 502 },
    );
  }

  console.log("[/api/ai/chat] Groq 응답 status:", groqRes.status);

  if (!groqRes.ok) {
    const errorText = await groqRes.text().catch(() => "");
    console.error("[/api/ai/chat] Groq API 오류:", groqRes.status, errorText);
    return NextResponse.json(
      { error: `Groq API 오류 (${groqRes.status}): ${errorText || "알 수 없는 오류"}` },
      { status: 502 },
    );
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = await groqRes.json();
  } catch {
    return NextResponse.json(
      { error: "AI 응답을 파싱하는 데 실패했습니다." },
      { status: 502 },
    );
  }

  const content: string = data.choices?.[0]?.message?.content ?? "";
  console.log("[/api/ai/chat] 응답 완료, 글자 수:", content.length);
  return NextResponse.json({ content });
}
