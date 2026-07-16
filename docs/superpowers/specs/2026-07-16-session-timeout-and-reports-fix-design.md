# Session Timeout & Reports Module Fix

**Date:** 2026-07-16  
**Status:** Approved

## Problem Statement

Two issues need to be addressed:

1. **Session timeout:** Currently the inactivity timeout is 5 minutes and redirects to `/`. The requirement is:
   - Maximum session duration of 12 hours (auto-logout)
   - Inactivity timeout of 5 minutes
   - Always redirect to `/sign-in` on logout (not `/`)

2. **Reportes module hidden:** The sidebar filters the "reportes" nav item by the `advanced_reports` permission (`sidebar.tsx:87`). The `FREE_USER` role does not have this permission, so free plan users cannot see the reports module. All users should see it.

## Design

### Part 1: Session Manager Hook

**Replace** `src/hooks/use-inactivity.ts` with a new `src/hooks/use-session.ts` hook that combines:

#### 12-Hour Absolute Session Limit (localStorage)

- On mount, check `localStorage.getItem('crm_session_start')`
- If not found → create with `Date.now()`
- If found and `Date.now() - session_start > 12 hours` → `signOut()` + redirect to `/sign-in`
- If valid → continue

#### 5-Minute Inactivity Timeout (existing behavior, updated redirect)

- Monitor events: `mousedown`, `keydown`, `touchstart`, `scroll`
- On timeout → `signOut()` + redirect to `/sign-in`
- Timer resets on each user activity event

#### Configuration

```
SESSION_MAX_HOURS = 12
INACTIVITY_LIMIT = 5 * 60 * 1000  (5 minutes)
STORAGE_KEY = 'crm_session_start'
```

#### File Changes

| File | Action |
|------|--------|
| `src/hooks/use-inactivity.ts` | Delete |
| `src/hooks/use-session.ts` | Create (new hook) |
| `src/app/(crm)/layout.tsx` | Update import from `useInactivityTimeout` to `useSessionManager` |

### Part 2: Enable Reports for All Users

**Database migration:** Add `advanced_reports` permission to the `FREE_USER` role.

```sql
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) 
VALUES ('role_free', 'perm_advanced_reports');
```

No frontend code changes needed — the sidebar already checks for `advanced_reports` permission.

#### File Changes

| File | Action |
|------|--------|
| `src/db/migrations/007_add_reports_to_free.sql` | Create (new migration) |

## Data Flow

```
User loads CRM page
  → useSessionManager mounts
  → Check localStorage for session_start
    → If missing: create timestamp
    → If expired (>12h): signOut() → /sign-in
    → If valid: start inactivity timer
  → User interacts (mouse/keyboard/touch/scroll)
    → Reset inactivity timer
  → 5 min no interaction
    → signOut() → /sign-in
  → localStorage cleared or expired
    → Next page load: signOut() → /sign-in
```

## Testing

1. **12-hour limit:** Set `crm_session_start` to 12+ hours ago in localStorage, reload page → should redirect to `/sign-in`
2. **Inactivity:** Wait 5 minutes without interaction → should redirect to `/sign-in`
3. **Activity resets timer:** Interact before 5 minutes → timer should reset
4. **Reports visibility:** Log in as FREE_USER → reportes should appear in sidebar
5. **Existing functionality:** Verify other CRM pages still work correctly
