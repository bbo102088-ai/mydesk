"use client";

import {
  Brain,
  FileSpreadsheet,
  FileText,
  Mail,
  MessageCircle,
  PenSquare,
  Sparkles,
} from "lucide-react";
import { logEvent } from "@/lib/analytics";

type QuickApp = {
  id: string;
  label: string;
  webUrl: string;
  protocol?: string;
  badge?: number; // 목업 미읽음 뱃지
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const APPS: QuickApp[] = [
  { id: "figma",   label: "Figma",   webUrl: "https://www.figma.com",           protocol: "figma://",      icon: PenSquare },
  { id: "claude",  label: "Claude",  webUrl: "https://claude.ai",                                          icon: Sparkles },
  { id: "chatgpt", label: "ChatGPT", webUrl: "https://chatgpt.com",                                        icon: Brain },
  { id: "gemini",  label: "Gemini",  webUrl: "https://gemini.google.com",                                  icon: FileText },
  { id: "teams",   label: "Teams",   webUrl: "https://teams.microsoft.com",     protocol: "msteams://",    badge: 2, icon: MessageCircle },
  { id: "excel",   label: "Excel",   webUrl: "https://office.com/launch/excel", protocol: "ms-excel://",   icon: FileSpreadsheet },
  { id: "mail",    label: "Mail",    webUrl: "https://outlook.office.com/mail", protocol: "ms-outlook://", badge: 5, icon: Mail },
];

/**
 * 데스크탑 앱 프로토콜을 시도하고, 앱이 없으면 웹으로 fallback.
 * - 프로토콜 링크를 클릭하면 OS가 앱을 실행
 * - 1.5초 후에도 탭이 여전히 visible이면 앱 미설치로 판단 → 웹 열기
 */
function openApp(app: QuickApp) {
  logEvent("quick_app_launched", { app: app.id });

  if (!app.protocol) {
    window.open(app.webUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // 프로토콜로 데스크탑 앱 시도
  window.location.href = app.protocol;

  // 앱이 실행되면 OS가 포커스를 가져가며 탭이 숨겨짐 → visibilitychange 발생
  let launched = false;
  const onHide = () => {
    launched = true;
    cleanup();
  };
  const cleanup = () => {
    document.removeEventListener("visibilitychange", onHide);
  };
  document.addEventListener("visibilitychange", onHide);

  // 1.5초 후에도 앱이 안 열렸으면 웹 fallback
  setTimeout(() => {
    cleanup();
    if (!launched) {
      window.open(app.webUrl, "_blank", "noopener,noreferrer");
    }
  }, 1500);
}

export function QuickAppsBar() {
  return (
    <section
      aria-label="자주 쓰는 앱 바로가기"
      className="mx-auto mb-4 mt-4 w-full max-w-6xl px-4"
    >
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-xs text-slate-300 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="hidden text-sm font-semibold text-slate-100 sm:block">
          즐겨 쓰는 도구를 한 번에 열어요.
        </div>
        <div className="flex flex-1 items-center justify-between gap-1 sm:gap-2 sm:justify-end">
          {APPS.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => openApp(app)}
                title={app.protocol ? `${app.label} 앱 열기` : `${app.label} 열기`}
                className="group flex flex-col items-center gap-1 rounded-2xl px-1.5 py-1 sm:px-2 text-[10px] font-medium text-slate-200 transition hover:text-white hover:[text-shadow:0_0_14px_rgba(248,250,252,0.9)]"
              >
                <span className="relative inline-flex size-7 sm:size-8 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.1)] text-white shadow-[0_0_18px_rgba(15,23,42,0.9)] transition group-hover:scale-105 group-hover:brightness-125 group-hover:bg-[rgba(255,255,255,0.18)] group-hover:shadow-[0_0_26px_rgba(15,23,42,1)]">
                  <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
                  {app.badge != null && app.badge > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-[0_0_6px_rgba(239,68,68,0.7)]">
                      {app.badge > 99 ? "99+" : app.badge}
                    </span>
                  )}
                </span>
                <span className="hidden xs:block sm:block">{app.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

