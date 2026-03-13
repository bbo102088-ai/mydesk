"use client";

import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NewsItem } from "@/app/api/news/route";

// ─── 카테고리 감지 ────────────────────────────────────────────────────────────

type Category = "AI기술" | "UX기획" | "디자인툴" | "헬스IT" | "IT일반";

const CATEGORY_STYLES: Record<Category, string> = {
  AI기술:   "bg-indigo-500/20 text-indigo-300",
  UX기획:   "bg-emerald-500/20 text-emerald-300",
  디자인툴: "bg-violet-500/20 text-violet-300",
  헬스IT:   "bg-cyan-500/20 text-cyan-300",
  IT일반:   "bg-white/10 text-white/50",
};

function detectCategory(title: string): Category {
  const t = title.toLowerCase();
  if (/ai|gpt|claude|gemini|llm|챗봇|생성형|딥러닝|머신러닝/.test(t)) return "AI기술";
  if (/ux|사용자|인터뷰|기획|프로덕트|서비스 기획|와이어프레임/.test(t)) return "UX기획";
  if (/figma|노션|notion|framer|스케치|디자인 툴|피그마/.test(t)) return "디자인툴";
  if (/헬스케어|의료|emr|병원|진료|환자|건강/.test(t)) return "헬스IT";
  return "IT일반";
}

// ─── 시간 포맷 ────────────────────────────────────────────────────────────────

function timeAgo(pubDateStr: string): string {
  const pub = new Date(pubDateStr);
  if (isNaN(pub.getTime())) return "";
  const diff = Date.now() - pub.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

// ─── 로컬 캐시 (30분) ─────────────────────────────────────────────────────────

const CACHE_KEY = "mydesk:news-cache";
const CACHE_TTL = 30 * 60 * 1000;

function loadCache(): NewsItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { items, ts } = JSON.parse(raw) as { items: NewsItem[]; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return items;
  } catch {
    return null;
  }
}

function saveCache(items: NewsItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, ts: Date.now() }));
  } catch {}
}

// ─── 스켈레톤 ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <ul className="space-y-0 divide-y divide-white/[0.05]">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 py-3 animate-pulse">
          <span className="mt-0.5 h-5 w-10 shrink-0 rounded-md bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-full rounded bg-white/10" />
            <div className="h-3.5 w-4/5 rounded bg-white/[0.07]" />
            <div className="h-2.5 w-1/3 rounded bg-white/[0.05]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchNews = async (forceRefresh = false) => {
    setStatus("loading");

    if (!forceRefresh) {
      const cached = loadCache();
      if (cached) {
        setItems(cached);
        setStatus("ok");
        return;
      }
    }

    try {
      const res = await fetch("/api/news");
      const data: { items?: NewsItem[]; error?: string } = await res.json();
      if (!res.ok || !data.items) throw new Error(data.error ?? "오류");
      saveCache(data.items);
      setItems(data.items);
      setLastFetched(new Date());
      setStatus("ok");
    } catch (err) {
      console.error("[NewsFeed]", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">AI · 기획 뉴스</CardTitle>
            {status === "ok" && lastFetched && (
              <span className="text-[10px] text-white/25">
                {timeAgo(lastFetched.toISOString())} 업데이트
              </span>
            )}
          </div>
          <button
            onClick={() => fetchNews(true)}
            disabled={status === "loading"}
            aria-label="뉴스 새로고침"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-colors disabled:opacity-30"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${status === "loading" ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {status === "loading" && <Skeleton />}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <RotateCcw className="h-8 w-8 text-white/15" />
            <p className="text-sm text-white/40">뉴스를 불러오지 못했어요</p>
            <button
              onClick={() => fetchNews(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {status === "ok" && (
          <ul className="divide-y divide-white/[0.05]">
            {items.map((item) => {
              const category = detectCategory(item.title);
              return (
                <li key={item.id}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 -mx-1 px-1 py-3 rounded-lg transition-colors hover:bg-white/[0.03]"
                  >
                    <span
                      className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${CATEGORY_STYLES[category]}`}
                    >
                      {category}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] text-white/30">
                        {item.source}
                        {item.pubDate && ` · ${timeAgo(item.pubDate)}`}
                      </p>
                    </div>

                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
