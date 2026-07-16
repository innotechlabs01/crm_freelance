"use client";

import { useEffect, useRef } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const SESSION_MAX_MS = 12 * 60 * 60 * 1000; // 12 hours
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "crm_session_start";

export function useSessionManager() {
  const { signOut } = useClerk();
  const router = useRouter();
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // --- 12-hour absolute session limit ---
    const now = Date.now();
    let sessionStart = Number(localStorage.getItem(STORAGE_KEY));

    if (!sessionStart || isNaN(sessionStart)) {
      sessionStart = now;
      localStorage.setItem(STORAGE_KEY, String(sessionStart));
    }

    if (now - sessionStart > SESSION_MAX_MS) {
      localStorage.removeItem(STORAGE_KEY);
      signOut();
      router.push("/sign-in");
      return;
    }

    // --- 5-minute inactivity timeout ---
    function resetInactivityTimer() {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(async () => {
        localStorage.removeItem(STORAGE_KEY);
        await signOut();
        router.push("/sign-in");
      }, INACTIVITY_LIMIT);
    }

    const events = ["mousedown", "keydown", "touchstart", "scroll"];

    for (const event of events) {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    }

    resetInactivityTimer();

    return () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      for (const event of events) {
        window.removeEventListener(event, resetInactivityTimer);
      }
    };
  }, [signOut, router]);
}
