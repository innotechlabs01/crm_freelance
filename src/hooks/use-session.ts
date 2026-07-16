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
    let sessionStart: number;
    try {
      sessionStart = Number(localStorage.getItem(STORAGE_KEY));
    } catch {
      sessionStart = 0;
    }

    if (!sessionStart || isNaN(sessionStart)) {
      sessionStart = now;
      try {
        localStorage.setItem(STORAGE_KEY, String(sessionStart));
      } catch {
        // Storage unavailable — continue without persistence
      }
    }

    if (now - sessionStart > SESSION_MAX_MS) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors on cleanup
      }
      signOut();
      router.push("/sign-in");
      return;
    }

    // --- 5-minute inactivity timeout ---
    function resetInactivityTimer() {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(async () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore storage errors on cleanup
        }
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
