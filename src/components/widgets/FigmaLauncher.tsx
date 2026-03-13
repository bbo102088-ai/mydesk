"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { logEvent } from "@/lib/analytics";
import type { FigmaFile } from "@/types";
import { Plus, X, Trash2, ExternalLink } from "lucide-react";

// ─── 색상 옵션 ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { label: "보라", gradient: "from-violet-500 to-purple-600" },
  { label: "파랑", gradient: "from-blue-500 to-cyan-500" },
  { label: "초록", gradient: "from-emerald-500 to-teal-600" },
  { label: "주황", gradient: "from-orange-500 to-amber-500" },
  { label: "핑크", gradient: "from-pink-500 to-rose-600" },
] as const;

type ColorGradient = (typeof COLOR_OPTIONS)[number]["gradient"];

// ─── 시간 포맷 ────────────────────────────────────────────────────────────────

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// ─── URL 유효성 ───────────────────────────────────────────────────────────────

function isFigmaUrl(url: string): boolean {
  return /^https:\/\/(www\.)?figma\.com\/.+/.test(url.trim());
}

// ─── 파일 추가 모달 ───────────────────────────────────────────────────────────

type AddFileModalProps = {
  onClose: () => void;
  onSave: (file: FigmaFile) => void;
};

function AddFileModal({ onClose, onSave }: AddFileModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState<ColorGradient>(COLOR_OPTIONS[0].gradient);
  const [urlError, setUrlError] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    if (!isFigmaUrl(url)) {
      setUrlError("https://www.figma.com/... 형식의 URL을 입력해주세요");
      return;
    }
    onSave({
      id: crypto.randomUUID(),
      name: name.trim(),
      url: url.trim(),
      color,
      lastModified: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-[rgba(12,12,30,0.90)] shadow-[0_40px_140px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(circle_at_80%_100%,rgba(59,130,246,0.12),transparent_55%)]"
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">피그마 파일 추가</h2>
            <button
              onClick={onClose}
              className="text-white/35 transition-colors hover:text-white"
              aria-label="닫기"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="px-5 py-5 space-y-4">
            {/* 파일명 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">
                파일명
              </label>
              <input
                type="text"
                placeholder="예: 진료화면 리뉴얼 v3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-500/70 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
              />
            </div>

            {/* Figma URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">
                Figma URL
              </label>
              <input
                type="url"
                placeholder="https://www.figma.com/file/..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className={`w-full rounded-xl border bg-white/[0.07] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] ${
                  urlError
                    ? "border-red-500/60 focus:border-red-500/80"
                    : "border-white/10 focus:border-indigo-500/70"
                }`}
              />
              {urlError && (
                <p className="text-xs text-red-400">{urlError}</p>
              )}
            </div>

            {/* 색상 선택 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/50">
                카드 색상
              </label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.gradient}
                    onClick={() => setColor(opt.gradient)}
                    title={opt.label}
                    aria-label={opt.label}
                    className={`relative h-8 w-8 rounded-full bg-gradient-to-br ${opt.gradient} transition-transform hover:scale-110 ${
                      color === opt.gradient
                        ? "ring-2 ring-white/80 ring-offset-2 ring-offset-[rgba(12,12,30,0.90)] scale-110"
                        : ""
                    }`}
                  >
                    {color === opt.gradient && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-white shadow" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 미리보기 */}
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
              <div
                className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow`}
              >
                <span className="select-none text-base font-bold text-white/90">
                  F
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-white/80">
                  {name || "파일명"}
                </p>
                <p className="text-[10px] text-white/35">방금 전</p>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSave}
                disabled={!name.trim() || !url.trim()}
                className="flex-1 [background:linear-gradient(135deg,#7c3aed,#2563eb)] shadow-[0_0_18px_rgba(124,58,237,0.35)] disabled:opacity-40"
              >
                저장
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-white/55 hover:text-white"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function FigmaLauncher() {
  const [files, setFiles] = useLocalStorage<FigmaFile[]>(
    "mydesk:figma-files",
    [
      {
        id: "demo-1",
        name: "진료화면 리뉴얼 v3",
        url: "https://www.figma.com/files/recents-and-sharing",
        color: "from-violet-500 to-purple-600",
        lastModified: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "demo-2",
        name: "EMR 대시보드 컴포넌트",
        url: "https://www.figma.com/files/recents-and-sharing",
        color: "from-blue-500 to-cyan-500",
        lastModified: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
    ],
  );
  const [showModal, setShowModal] = useState(false);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  const addFile = (file: FigmaFile) => {
    setFiles([...files, file]);
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
    setContextMenuId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenuId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">피그마 퀵런처</CardTitle>
            {files.length < 8 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowModal(true)}
                className="text-white/55 hover:text-white"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                파일 추가
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* 빈 상태 */}
          {files.length === 0 ? (
            <div className="space-y-3 py-4">
              <div className="pointer-events-none grid select-none grid-cols-3 gap-3 sm:grid-cols-4 opacity-20">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-white/40"
                  >
                    <Plus className="h-5 w-5 text-white/60" />
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-white/30">
                파일 추가를 눌러 Figma 파일을 등록해보세요
              </p>
            </div>
          ) : (
            /* 카드 그리드 */
            <div
              className="grid grid-cols-3 gap-3 sm:grid-cols-4"
              onClick={() => setContextMenuId(null)}
            >
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group relative cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (contextMenuId === file.id) {
                      setContextMenuId(null);
                      return;
                    }
                    logEvent("figma_file_open", { fileName: file.name });
                    window.open(file.url, "_blank", "noopener,noreferrer");
                  }}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, file.id);
                  }}
                >
                  {/* 썸네일 */}
                  <div
                    className={`bg-gradient-to-br ${file.color ?? COLOR_OPTIONS[0].gradient} relative aspect-square rounded-xl flex items-center justify-center transition-transform group-hover:scale-105`}
                  >
                    <span className="select-none text-2xl font-bold text-white/90">
                      F
                    </span>
                    {/* hover 시 외부 링크 아이콘 */}
                    <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <ExternalLink className="h-5 w-5 text-white drop-shadow" />
                    </span>
                  </div>

                  {/* 파일명 */}
                  <p className="mt-1.5 truncate text-center text-xs leading-tight text-white/70">
                    {file.name}
                  </p>

                  {/* 등록 시간 */}
                  {file.lastModified && (
                    <p className="text-center text-[10px] text-white/35">
                      {timeAgo(file.lastModified)}
                    </p>
                  )}

                  {/* hover X 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file.id);
                    }}
                    aria-label="파일 삭제"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100 z-10"
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {/* 우클릭 컨텍스트 메뉴 */}
                  {contextMenuId === file.id && (
                    <div
                      className="absolute left-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/15 bg-[rgba(12,12,30,0.95)] shadow-xl backdrop-blur-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-white/[0.06]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-right text-[10px] text-white/20">
            우클릭으로 삭제 · 최대 8개
          </p>
        </CardContent>
      </Card>

      {/* 파일 추가 모달 */}
      {showModal && (
        <AddFileModal
          onClose={() => setShowModal(false)}
          onSave={addFile}
        />
      )}
    </>
  );
}
