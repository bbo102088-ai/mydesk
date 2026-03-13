"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import type { WidgetType } from "@/store/dashboardStore";
import { PomodoroTimer } from "@/components/widgets/PomodoroTimer";
import { DailyNote } from "@/components/widgets/DailyNote";
import { FigmaLauncher } from "@/components/widgets/FigmaLauncher";
import { WorkSheet } from "@/components/widgets/WorkSheet";
import { AiAssistant } from "@/components/widgets/AiAssistant";
import { CommFeed } from "@/components/widgets/CommFeed";
import { NewsFeed } from "@/components/widgets/NewsFeed";
import { CalendarView } from "@/components/widgets/CalendarView";
import type { ComponentType } from "react";

const WIDGET_MAP: Record<WidgetType, ComponentType> = {
  PomodoroTimer,
  DailyNote,
  FigmaLauncher,
  WorkSheet,
  AiAssistant,
  CommFeed,
  NewsFeed,
  CalendarView,
};

export function DashboardWidgets({ column }: { column: "left" | "right" }) {
  const widgets = useDashboardStore((s) => s.widgets);

  const visible = [...widgets]
    .filter((w) => w.column === column && w.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-4">
      {visible.map(({ type }) => {
        const Widget = WIDGET_MAP[type];
        return <Widget key={type} />;
      })}
    </div>
  );
}
