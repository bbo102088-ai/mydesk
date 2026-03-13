"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { DailyNote as DailyNoteType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getTodayKey(): string {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  return `mydesk:daily-note:${iso}`;
}

function createEmptyNote(): DailyNoteType {
  const today = new Date().toISOString().slice(0, 10);
  return {
    date: today,
    memo: "",
    checklist: [],
  };
}

export function DailyNote() {
  const storageKey = getTodayKey();
  const [note, setNote] = useLocalStorage<DailyNoteType>(
    storageKey,
    createEmptyNote(),
  );
  const [newItem, setNewItem] = useState("");

  const formattedDate = useMemo(() => {
    const date = new Date(note.date);
    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  }, [note.date]);

  const sortedChecklist = useMemo(
    () =>
      [...note.checklist].sort((a, b) => Number(a.done) - Number(b.done)),
    [note.checklist],
  );

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    setNote({
      ...note,
      checklist: [...note.checklist, { id: nanoid(), text, done: false }],
    });
    setNewItem("");
  };

  const toggleItem = (id: string) => {
    setNote({
      ...note,
      checklist: note.checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    });
  };

  const removeItem = (id: string) => {
    setNote({
      ...note,
      checklist: note.checklist.filter((item) => item.id !== id),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-card-foreground">
            데일리 노트
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">
            {formattedDate}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="체크리스트 추가..."
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
              className="flex-1 rounded-lg border border-[rgba(148,163,184,0.5)] bg-[rgba(15,23,42,0.9)] px-2 py-1 text-xs text-slate-100 outline-none ring-0 placeholder:text-slate-500"
            />
            <Button
              size="xs"
              type="button"
              onClick={addItem}
              className="px-2 text-[11px] [background:linear-gradient(135deg,#7c3aed,#2563eb)] shadow-[0_0_12px_rgba(124,58,237,0.35)]"
            >
              추가
            </Button>
          </div>
          <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
            {sortedChecklist.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1 text-xs hover:bg-[rgba(15,23,42,0.7)]"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                    className="size-3.5 cursor-pointer accent-indigo-400"
                  />
                  <span
                    className={
                      item.done
                        ? "text-[11px] text-slate-500 line-through"
                        : "text-[11px] text-slate-200"
                    }
                  >
                    {item.text}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  삭제
                </button>
              </label>
            ))}
            {sortedChecklist.length === 0 && (
              <p className="text-[11px] text-slate-500">
                오늘 할 일을 간단히 적어보세요.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] text-slate-400">메모</p>
          <textarea
            rows={3}
            value={note.memo}
            onChange={(event) =>
              setNote({
                ...note,
                memo: event.target.value,
              })
            }
            placeholder="오늘의 생각, 메모를 자유롭게 적어보세요."
            className="min-h-[72px] w-full resize-none rounded-lg border border-[rgba(148,163,184,0.5)] bg-[rgba(15,23,42,0.9)] px-2 py-1 text-xs text-slate-100 outline-none ring-0 placeholder:text-slate-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}

