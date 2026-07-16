# Session Timeout & Reports Module Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inactivity timeout with a session manager (12h absolute limit + 5min inactivity) and enable the reports module for all users.

**Architecture:** Client-side session management using localStorage for the 12-hour absolute limit, combined with an inactivity timer. Database migration to grant `advanced_reports` permission to the `FREE_USER` role.

**Tech Stack:** React hooks, localStorage, Clerk auth, SQLite (Turso/libSQL)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/hooks/use-inactivity.ts` | Delete | Old inactivity hook (replaced) |
| `src/hooks/use-session.ts` | Create | New session manager hook (12h limit + 5min inactivity) |
| `src/app/(crm)/layout.tsx` | Modify (line 9, 25) | Update import and hook call |
| `src/db/migrations/007_add_reports_to_free.sql` | Create | Migration to add `advanced_reports` to FREE_USER |

---

### Task 1: Create the session manager hook

**Files:**
- Create: `src/hooks/use-session.ts`
- Delete: `src/hooks/use-inactivity.ts`

- [ ] **Step 1: Create the new `useSessionManager` hook**

Create `src/hooks/use-session.ts`:

```typescript
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
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/hooks/use-session.ts`
Expected: No errors

- [ ] **Step 3: Delete the old hook**

Run: `rm src/hooks/use-inactivity.ts`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-session.ts src/hooks/use-inactivity.ts
git commit -m "feat: replace inactivity hook with session manager (12h limit + 5min inactivity)"
```

---

### Task 2: Update CRM layout to use new hook

**Files:**
- Modify: `src/app/(crm)/layout.tsx` (lines 9, 25)

- [ ] **Step 1: Update the import**

Change line 9 from:
```typescript
import { useInactivityTimeout } from '@/hooks/use-inactivity'
```
To:
```typescript
import { useSessionManager } from '@/hooks/use-session'
```

- [ ] **Step 2: Update the hook call**

Change line 25 from:
```typescript
useInactivityTimeout()
```
To:
```typescript
useSessionManager()
```

- [ ] **Step 3: Verify the file compiles**

Run: `npx tsc --noEmit src/app/(crm)/layout.tsx`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(crm)/layout.tsx
git commit -m "feat: use session manager in CRM layout"
```

---

### Task 3: Create migration to enable reports for FREE_USER

**Files:**
- Create: `src/db/migrations/007_add_reports_to_free.sql`

- [ ] **Step 1: Create the migration file**

Create `src/db/migrations/007_add_reports_to_free.sql`:

```sql
-- Add advanced_reports permission to FREE_USER role
-- so all users can see the reports module in the sidebar
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
VALUES ('role_free', 'perm_advanced_reports');
```

- [ ] **Step 2: Verify migration syntax**

Check that the SQL is valid and references existing IDs (`role_free`, `perm_advanced_reports` are defined in `006_seed_data.sql`).

- [ ] **Step 3: Commit**

```bash
git add src/db/migrations/007_add_reports_to_free.sql
git commit -m "feat: enable reports module for free plan users"
```

---

### Task 4: Verify everything works

- [ ] **Step 1: Run TypeScript check on entire project**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run linter if configured**

Run: `npm run lint` (if available)
Expected: No errors

- [ ] **Step 3: Manual verification checklist**

1. Start dev server: `npm run dev`
2. Log in as a FREE plan user
3. Verify "Reportes" appears in the sidebar
4. Navigate to `/reportes` — page should load correctly
5. Wait 5 minutes without interaction — should redirect to `/sign-in`
6. Set `crm_session_start` in localStorage to 12+ hours ago, reload — should redirect to `/sign-in`

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during verification"
```
