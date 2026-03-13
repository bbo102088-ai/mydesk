import type { ReactNode } from "react";

import { QuickAppsBar } from "@/components/layout/QuickAppsBar";
import { AiBanner } from "@/components/layout/AiBanner";

export type DashboardLayoutProps = {
  left: ReactNode;
  right: ReactNode;
};

export function DashboardLayout({ left, right }: DashboardLayoutProps) {
  return (
    <div className="pb-10 pt-2">
      <QuickAppsBar />

      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="mb-4">
          <AiBanner />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2">{left}</section>
          <aside className="lg:col-span-1">{right}</aside>
        </div>

      </div>
    </div>
  );
}

