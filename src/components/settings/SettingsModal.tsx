"use client";

import { useState } from "react";
import { useDashboardStore, BUILTIN_PRESETS } from "@/store/dashboardStore";
import type { WidgetType } from "@/store/dashboardStore";
import { X, ChevronUp, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const WIDGET_LABELS: Record<WidgetType, string> = {
  FigmaLauncher: "피그마 퀵런처",
  AiAssistant: "AI 어시스턴트",
  WorkSheet: "업무 시트",
  PomodoroTimer: "뽀모도로 타이머",
  DailyNote: "데일리 노트",
  CommFeed: "커뮤니케이션 피드",
  NewsFeed: "뉴스 피드",
  CalendarView: "캘린더",
};

type SettingsModalProps = {
  onClose: () => void;
};

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { widgets, presets, setWidgetVisible, moveWidget, savePreset, applyPreset, deletePreset } =
    useDashboardStore();
  const [customName, setCustomName] = useState("커스텀");
  const [saved, setSaved] = useState(false);

  const allPresets = [...BUILTIN_PRESETS, ...presets];

  const handleSave = () => {
    if (!customName.trim()) return;
    savePreset(customName.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="위젯 설정"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[rgba(12,12,30,0.85)] shadow-[0_40px_140px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_25%_0%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_75%_100%,rgba(249,115,22,0.12),transparent_55%)]"
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="text-base font-semibold text-white">위젯 설정</h2>
            <button
              onClick={onClose}
              className="text-white/35 transition-colors hover:text-white"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[72vh] space-y-6 overflow-y-auto px-6 py-5">
            {/* Widget list — left then right column */}
            {(
              [
                { col: "left" as const, label: "좌측 영역" },
                { col: "right" as const, label: "우측 영역" },
              ] as const
            ).map(({ col, label }) => {
              const colWidgets = [...widgets]
                .filter((w) => w.column === col)
                .sort((a, b) => a.order - b.order);
              return (
                <div key={col}>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/35">
                    {label}
                  </p>
                  <div className="space-y-2">
                    {colWidgets.map((w, idx) => (
                      <div
                        key={w.type}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3"
                      >
                        {/* Toggle switch */}
                        <button
                          onClick={() => setWidgetVisible(w.type, !w.isVisible)}
                          aria-label={w.isVisible ? "위젯 숨기기" : "위젯 표시"}
                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                            w.isVisible ? "bg-indigo-500" : "bg-white/15"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                              w.isVisible ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>

                        <span
                          className={`flex-1 text-sm ${
                            w.isVisible ? "text-white/85" : "text-white/30"
                          }`}
                        >
                          {WIDGET_LABELS[w.type]}
                        </span>

                        {/* Order arrows */}
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => moveWidget(w.type, "up")}
                            disabled={idx === 0}
                            aria-label="위로 이동"
                            className="rounded-md p-1 text-white/30 transition-colors hover:text-white/75 disabled:opacity-20"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveWidget(w.type, "down")}
                            disabled={idx === colWidgets.length - 1}
                            aria-label="아래로 이동"
                            className="rounded-md p-1 text-white/30 transition-colors hover:text-white/75 disabled:opacity-20"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Presets */}
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/35">
                레이아웃 프리셋
              </p>
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {allPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5"
                  >
                    <button
                      onClick={() => applyPreset(preset.id)}
                      className="flex-1 text-left text-sm text-white/65 transition-colors hover:text-white"
                    >
                      {preset.name}
                    </button>
                    {!preset.id.startsWith("builtin-") && (
                      <button
                        onClick={() => deletePreset(preset.id)}
                        aria-label="프리셋 삭제"
                        className="text-white/25 transition-colors hover:text-red-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {presets.length < 3 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="프리셋 이름"
                    className="flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-500/70 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                  />
                  <Button size="sm" onClick={handleSave} className="shrink-0 min-w-[52px]">
                    {saved ? <Check className="h-4 w-4" /> : "저장"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
