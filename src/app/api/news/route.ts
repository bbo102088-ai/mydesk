import { NextResponse } from "next/server";

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  pubDate: string;
};

// ─── RSS 파서 ─────────────────────────────────────────────────────────────────

function extractText(block: string, tag: string): string {
  // CDATA
  const cdata = block.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`),
  );
  if (cdata) return cdata[1].trim();
  // plain
  const plain = block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`));
  return plain?.[1].trim() ?? "";
}

function parseItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  let n = 0;

  while ((match = itemRegex.exec(xml)) !== null) {
    const raw = match[1];

    // 제목에서 " - 출처" 분리
    const fullTitle = extractText(raw, "title");
    const dashIdx = fullTitle.lastIndexOf(" - ");
    const title = dashIdx > 0 ? fullTitle.slice(0, dashIdx).trim() : fullTitle;
    const sourceFromTitle =
      dashIdx > 0 ? fullTitle.slice(dashIdx + 3).trim() : "";
    const source = extractText(raw, "source") || sourceFromTitle || "뉴스";

    const linkMatch = raw.match(/<link>([\s\S]*?)<\/link>/);
    const url = linkMatch?.[1].trim() ?? "";

    const pubDate = extractText(raw, "pubDate");

    if (title && url) {
      items.push({ id: String(++n), title, source, url, pubDate });
    }
  }

  return items;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET() {
  const query = encodeURIComponent("AI 기획 UX 헬스케어 디자인 서비스기획");
  const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const res = await fetch(rssUrl, {
      next: { revalidate: 1800 }, // 30분 서버 캐시
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MyDesk/1.0)" },
    });

    if (!res.ok) {
      throw new Error(`RSS 응답 오류: ${res.status}`);
    }

    const xml = await res.text();
    const items = parseItems(xml).slice(0, 8);

    console.log(`[/api/news] 뉴스 ${items.length}건 파싱 완료`);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[/api/news] 가져오기 실패:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 502 },
    );
  }
}
