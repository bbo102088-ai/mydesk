"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommItem } from "@/types";
import { mockCommItems } from "@/lib/mock/commData";

function SourceBadge({ source }: { source: CommItem["source"] }) {
  const label = source === "mail" ? "Mail" : "Teams";
  const baseClass =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium";

  if (source === "mail") {
    return (
      <span
        className={`${baseClass} bg-[rgba(37,99,235,0.18)] text-blue-200 border border-blue-400/40`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`${baseClass} bg-[rgba(56,189,248,0.18)] text-cyan-200 border border-cyan-400/40`}
    >
      {label}
    </span>
  );
}

export function CommFeed() {
  const unreadCount = mockCommItems.filter((item) => !item.isRead).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-card-foreground">
            커뮤니케이션 피드
          </CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(15,23,42,0.9)] px-2 py-0.5 text-[10px] text-slate-200">
            읽지 않음
            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-black">
              {unreadCount}
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
          {mockCommItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-lg bg-[rgba(15,23,42,0.7)] px-3 py-2 text-xs hover:bg-[rgba(15,23,42,0.95)]"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SourceBadge source={item.source} />
                  <span className="text-[10px] text-slate-400">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-100">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-400">{item.sender}</p>
              </div>
              {!item.isRead && (
                <span className="mt-1 inline-block size-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.9)]" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

