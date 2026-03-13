"use client";

import { useEffect } from "react";
import { logEvent } from "@/lib/analytics";

/**
 * 앱 진입 시 session_start 이벤트를 1회 기록한다.
 * layout.tsx에 마운트해 모든 페이지에서 동작한다.
 */
export function SessionTracker() {
  useEffect(() => {
    logEvent("session_start");
  }, []);

  return null;
}
