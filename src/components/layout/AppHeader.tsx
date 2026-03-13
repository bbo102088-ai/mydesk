import { HeaderActions } from "@/components/layout/HeaderActions";

function formatTodayLabel(): string {
  const today = new Date();
  return today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.1)] bg-[#0a0a1a]/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#0a0a1a]/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="inline-flex size-7 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6366f1,#f97316)] shadow-[0_0_18px_rgba(249,115,22,0.9)]" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              따뜻한 AI 비서, <span className="text-orange-300">MyDesk</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            기획자님, 오늘도 차분하게 흐름을 이어가 볼까요?
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right text-xs text-slate-400 sm:block">
            <div className="font-medium text-slate-100">오늘</div>
            <div className="font-mono">{formatTodayLabel()}</div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderActions />
          </div>
        </div>
      </div>
    </header>
  );
}

