"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/settings/SettingsModal";

export function HeaderActions() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm">
        새 위젯
      </Button>
      <Button size="sm" onClick={() => setOpen(true)}>
        설정
      </Button>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}
