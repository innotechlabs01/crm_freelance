"use client";

import { useEffect, useRef } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

export function useInactivityTimeout() {
  const { signOut } = useClerk();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        await signOut();
        router.push("/");
      }, INACTIVITY_LIMIT);
    }

    const events = ["mousedown", "keydown", "touchstart", "scroll"];

    for (const event of events) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [signOut, router]);
}
