import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WidgetType =
  | "PomodoroTimer"
  | "DailyNote"
  | "FigmaLauncher"
  | "WorkSheet"
  | "AiAssistant"
  | "CommFeed"
  | "NewsFeed"
  | "CalendarView";

export type WidgetConfig = {
  type: WidgetType;
  isVisible: boolean;
  column: "left" | "right";
  order: number;
};

export type LayoutPreset = {
  id: string;
  name: string;
  widgets: WidgetConfig[];
};

export type DashboardState = {
  widgets: WidgetConfig[];
  presets: LayoutPreset[];
  setWidgetVisible: (type: WidgetType, isVisible: boolean) => void;
  moveWidget: (type: WidgetType, direction: "up" | "down") => void;
  savePreset: (name: string) => void;
  applyPreset: (id: string) => void;
  deletePreset: (id: string) => void;
};

const defaultWidgets: WidgetConfig[] = [
  { type: "FigmaLauncher", isVisible: true, column: "left", order: 0 },
  { type: "AiAssistant", isVisible: true, column: "left", order: 1 },
  { type: "WorkSheet", isVisible: true, column: "left", order: 2 },
  { type: "CalendarView", isVisible: true, column: "left", order: 3 },
  { type: "PomodoroTimer", isVisible: true, column: "right", order: 0 },
  { type: "DailyNote", isVisible: true, column: "right", order: 1 },
  { type: "CommFeed", isVisible: true, column: "right", order: 2 },
  { type: "NewsFeed", isVisible: true, column: "right", order: 3 },
];

export const BUILTIN_PRESETS: LayoutPreset[] = [
  {
    id: "builtin-focus",
    name: "기획 집중 모드",
    widgets: [
      { type: "FigmaLauncher", isVisible: true, column: "left", order: 0 },
      { type: "AiAssistant", isVisible: true, column: "left", order: 1 },
      { type: "WorkSheet", isVisible: true, column: "left", order: 2 },
      { type: "PomodoroTimer", isVisible: true, column: "right", order: 0 },
      { type: "DailyNote", isVisible: true, column: "right", order: 1 },
      { type: "CommFeed", isVisible: false, column: "right", order: 2 },
      { type: "NewsFeed", isVisible: true, column: "right", order: 3 },
    ],
  },
  {
    id: "builtin-meeting",
    name: "회의 많은 날",
    widgets: [
      { type: "FigmaLauncher", isVisible: false, column: "left", order: 0 },
      { type: "AiAssistant", isVisible: true, column: "left", order: 1 },
      { type: "WorkSheet", isVisible: true, column: "left", order: 2 },
      { type: "PomodoroTimer", isVisible: false, column: "right", order: 0 },
      { type: "DailyNote", isVisible: true, column: "right", order: 1 },
      { type: "CommFeed", isVisible: true, column: "right", order: 2 },
      { type: "NewsFeed", isVisible: false, column: "right", order: 3 },
    ],
  },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: defaultWidgets,
      presets: [],

      setWidgetVisible: (type, isVisible) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.type === type ? { ...w, isVisible } : w,
          ),
        })),

      moveWidget: (type, direction) =>
        set((state) => {
          const widget = state.widgets.find((w) => w.type === type);
          if (!widget) return state;
          const colWidgets = [...state.widgets]
            .filter((w) => w.column === widget.column)
            .sort((a, b) => a.order - b.order);
          const idx = colWidgets.findIndex((w) => w.type === type);
          const targetIdx = direction === "up" ? idx - 1 : idx + 1;
          if (targetIdx < 0 || targetIdx >= colWidgets.length) return state;
          const target = colWidgets[targetIdx];
          return {
            widgets: state.widgets.map((w) => {
              if (w.type === type) return { ...w, order: target.order };
              if (w.type === target.type) return { ...w, order: widget.order };
              return w;
            }),
          };
        }),

      savePreset: (name) =>
        set((state) => {
          const newPreset: LayoutPreset = {
            id: crypto.randomUUID(),
            name: name.trim(),
            widgets: [...state.widgets],
          };
          const filtered = state.presets.filter((p) => p.name !== name.trim());
          return { presets: [...filtered, newPreset].slice(0, 3) };
        }),

      applyPreset: (id) => {
        const all = [...BUILTIN_PRESETS, ...get().presets];
        const preset = all.find((p) => p.id === id);
        if (preset) set({ widgets: [...preset.widgets] });
      },

      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "mydesk:dashboard-v4",
    },
  ),
);
