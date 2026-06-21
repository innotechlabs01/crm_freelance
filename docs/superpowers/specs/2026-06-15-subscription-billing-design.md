# FreelanceCRM — Subscription, Billing & Access Control

> **Status:** Draft | **Date:** 2026-06-15 | **Spec for:** FreelanceCRM SaaS monetization

---

## 1. Overview

FreelanceCRM is a SaaS platform for Colombian freelancers to manage clients, generate
_cuentas de cobro_ (billing accounts), and track payments. This spec defines the
subscription model, Stripe billing integration, role-based access control, and
enforcement of plan limits across the application.

### 1.1 Existing Codebase

The current application is a **Next.js 16 App Router** project with:

```
src/
  app/
    page.tsx                       ← Landing page
    (crm)/                         ← Authenticated CRM (freelancer-facing)
      layout.tsx                   ← Sidebar + Topbar layout
      dashboard/page.tsx
      clientes/page.tsx
      cuentas-cobro/page.tsx
      pagos/page.tsx
      reportes/page.tsx
      calendario/page.tsx
      configuracion/page.tsx
    admin/                         ← Admin/ops (platform operators)
      layout.tsx
      page.tsx, usuarios/, suscripciones/, tickets/, etc.
  components/
    layout/                        ← Sidebar, Topbar, ThemeProvider
    ui/                            ← shadcn/ui components
  lib/                             ← mock-data.ts, utils.ts
  types/                           ← index.ts
```

**No auth, database, or API routes exist yet.** The app uses in-memory mock data. This spec
adds Supabase Auth + Database, Stripe billing, and access control on top of the existing
frontend.

---

## 2. Plans

### 2.1 Free

| Limit | Value |
|-------|-------|
| Active clients | 1 |
| _Cuentas de cobro_ / month | 3 |
| History retention | 3 months |
| PDF output | Watermarked |

**Features:** Client management, invoice generator, basic dashboard.

### 2.2 Professional — $24.99 USD/month

| Limit | Value |
|-------|-------|
| Active clients | Unlimited |
| _Cuentas de cobro_ | Unlimited |
| History retention | Unlimited |

**Features:** Everything in Free + AI Assistant, Cash Flow, Advanced Reports,
Custom PDF Branding, Automated Reminders, Payment Tracking.

### 2.3 Enterprise — $79.99 USD/month

**Features:** Everything in Professional + Multi-user, Teams, Roles, White Label,
Advanced Analytics, API Access.

---

## 3. Roles & Permissions

### 3.1 Role Definitions

| Role | Assignment Trigger | Meaning |
|------|-------------------|---------|
| `FREE_USER` | On registration | Free-tier user |
| `PROFESSIONAL_USER` | Stripe subscription active | Paying user |
| `ENTERPRISE_OWNER` | Stripe enterprise subscription active | Paying user with team features |

### 3.2 Permission Catalog

```
free_permissions:
  - create_client (max:1)
  - create_invoice  (max:3/month)
  - view_basic_dashboard

professional_permissions:
  - create_client (unlimited)
  - create_invoice  (unlimited)
  - ai_access
  - reminders
  - advanced_reports
  - cashflow
  - pdf_branding
  - payment_tracking

enterprise_permissions:
  - manage_team
  - manage_roles
  - white_label
  - api_access
```

### 3.3 Feature Flag Mapping

| Feature Flag | Required Permission | Check Point |
|-------------|-------------------|-------------|
| `feature_ai_assistant` | `ai_access` | Invoice generator AI panel |
| `feature_cashflow` | `cashflow` | Dashboard cashflow chart |
| `feature_reports` | `advanced_reports` | `/reportes` route |
| `feature_pdf_branding` | `pdf_branding` | PDF generation |
| `feature_reminders` | `reminders` | Automated reminders |
| `feature_whatsapp` | `reminders` | WhatsApp integration |
| `feature_multiuser` | `manage_team` | Team management UI |

---

## 4. Database Schema (Supabase Postgres)

### 4.1 `plans`

```sql
CREATE TABLE plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                -- 'free', 'professional', 'enterprise'
  display_name    TEXT NOT NULL,                -- 'Free', 'Profesional', 'Empresarial'
  price           INT NOT NULL DEFAULT 0,       -- in USD cents
  stripe_price_id TEXT,                         -- Stripe Price ID
  max_clients     INT,                          -- NULL = unlimited
  max_invoices_per_month INT,                   -- NULL = unlimited
  features_json   JSONB NOT NULL DEFAULT '[]',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.2 `subscriptions`

```sql
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id                 UUID NOT NULL REFERENCES plans(id),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT UNIQUE,
  status                  TEXT NOT NULL DEFAULT 'trialing',
        -- trialing | active | past_due | canceled | expired | paused
  starts_at               TIMESTAMPTZ,
  ends_at                 TIMESTAMPTZ,
  renewal_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.3 `roles`

```sql
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,  -- 'FREE_USER', 'PROFESSIONAL_USER', 'ENTERPRISE_OWNER'
  description TEXT
);
```

### 4.4 `permissions`

```sql
CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,  -- 'create_client', 'ai_access', etc.
  description TEXT
);
```

### 4.5 `role_permissions`

```sql
CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

### 4.6 `user_roles`

```sql
CREATE TABLE user_roles (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id   UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
```

### 4.7 `audit_logs`

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,          -- 'plan_upgrade', 'payment_failed', etc.
  target      TEXT,                   -- e.g. subscription_id, feature name
  metadata    JSONB DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.8 Extend `clients` & `invoices` with `user_id`

```sql
ALTER TABLE clients  ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE invoices ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_clients_user_id  ON clients(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
```

---

## 5. Registration & Subscription Flow

### 5.1 Registration (Supabase Auth)

```
User → Sign Up (email/password or Google OAuth via Supabase Auth)
     → `auth.users` row created
     → DB trigger: INSERT INTO user_roles (user_id, role_id = FREE_USER)
     → DB trigger: INSERT INTO subscriptions (user_id, plan_id = free, status = 'trialing', trial period = 14 days)
     → Stripe customer created via API (store customer ID)
     → Redirect to /dashboard
```

### 5.2 Upgrade Flow

```
User clicks "Upgrade" → POST /api/stripe/checkout
  → Server validates user is authenticated
  → Creates Stripe Checkout Session (stripe_price_id from plan)
  → Returns session.url → Redirect to Stripe
  → User completes payment on Stripe
  → Stripe sends webhook: checkout.session.completed
  → Webhook handler: POST /api/stripe/webhook
    1. Validate Stripe signature
    2. Look up user by stripe_customer_id
    3. Create/update subscription row (status = active)
    4. Update user_roles (remove FREE_USER, add PROFESSIONAL_USER)
    5. Create audit_log entry
    6. Return 200 OK
  → User redirected to /dashboard?upgrade=success
```

### 5.3 Client Creation Validation

```
Before creating client:
  1. Auth middleware → user authenticated
  2. Count user's active clients (SELECT COUNT(*) FROM clients WHERE user_id = X AND status = 'active')
  3. Resolve user's current plan
  4. IF plan == free AND active_clients >= 1:
       Return 403 with { code: 'LIMIT_REACHED', message: '...', required_plan: 'professional' }
  5. ELSE: allow creation
```

Frontend shows **UpgradeModal** when receiving 403 with `LIMIT_REACHED`.

### 5.4 Invoice Creation Validation

```
Before creating invoice:
  1. Auth middleware → user authenticated
  2. Count invoices created this month (SELECT COUNT(*) FROM invoices WHERE user_id = X AND date >= start_of_month)
  3. IF plan == free AND count >= 3:
       Return 403 with { code: 'INVOICE_LIMIT_REACHED' }
  4. ELSE: allow creation
```

---

## 6. Stripe Integration

### 6.1 Products (configured in Stripe Dashboard)

| Product Key | Name | Price (USD) |
|------------|------|-------------|
| `professional_monthly` | FreelanceCRM Professional | $24.99 USD/month |
| `enterprise_monthly` | FreelanceCRM Enterprise | $79.99 USD/month |

### 6.2 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
```

### 6.3 Webhook Events

| Event | Handler Action |
|-------|---------------|
| `checkout.session.completed` | Activate subscription, assign PROFESSIONAL_USER role, create audit log |
| `customer.subscription.created` | Store stripe_subscription_id |
| `customer.subscription.updated` | Sync status (active → past_due, etc.) |
| `customer.subscription.deleted` | Downgrade to FREE_USER, mark subscription expired |
| `invoice.payment_succeeded` | Extend renewal_at by 1 month, log |
| `invoice.payment_failed` | Set status = past_due, notify user, start grace period |
| `customer.subscription.trial_will_end` | Notify user trial ending in 3 days |

### 6.4 API Routes to Create

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stripe/checkout` | POST | Create Checkout Session, return URL |
| `/api/stripe/webhook` | POST | Stripe webhook receiver (raw body) |
| `/api/stripe/portal` | POST | Create Customer Portal session for cancel/reactivate |
| `/api/auth/me` | GET | Return current user + plan + permissions |

### 6.5 Webhook Signature Verification

```typescript
// src/app/api/stripe/webhook/route.ts
import { stripe } from '@/lib/stripe';

const sig = request.headers.get('stripe-signature')!;
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
```

---

## 7. Payment Lifecycle

### 7.1 Payment Success

```
invoice.payment_succeeded
  → UPDATE subscriptions SET status = 'active', renewal_at = now() + 1 month
  → INSERT audit_log: action = 'payment_succeeded'
  → Send confirmation email (optional, via Resend/SendGrid)
```

### 7.2 Payment Failure

```
invoice.payment_failed
  → UPDATE subscriptions SET status = 'past_due'
  → INSERT audit_log: action = 'payment_failed'
  → Notify user (in-app notification + email)
  → Start 7-day grace period timer
```

### 7.3 Grace Period Expiry (Supabase Cron)

The grace period handler runs as a **Supabase Edge Function triggered by `pg_cron`**
(scheduled every hour via `SELECT cron.schedule('grace-period-check', '0 * * * *', ...)`).

Alternatively, deploy as a **Supabase Edge Function with `@supabase/supabase-js`**
and trigger via an external cron provider (e.g., Vercel Cron Jobs, GitHub Actions).

```
Edge function runs hourly, scans for:
  SELECT * FROM subscriptions WHERE status = 'past_due' AND updated_at < now() - INTERVAL '7 days'

For each expired subscription:
  → Downgrade user: remove PROFESSIONAL_USER, assign FREE_USER
  → UPDATE subscriptions SET status = 'expired'
  → Keep all user data (clients, invoices)
  → Mark excess clients/invoices as read-only
  → INSERT audit_log: action = 'subscription_expired_downgraded'
```

### 7.4 Downgrade Data Retention

When Professional → Free:
- Existing clients: **visible but read-only** (no edits, no new)
- Existing invoices: **visible but read-only** (no edits, no new)
- AI Assistant, Reports, Cashflow, Reminders: **hidden with paywall**
- PDF watermark: **re-enabled**

---

## 8. Authorization Middleware

### 8.1 Route Protection Strategy

```
┌─ /                → Public (landing)
├─ /api/stripe/*    → Public (webhook)
├─ /auth/*          → Public (login/signup)
├─ /(crm)/*         → Auth required + subscription check
└─ /admin/*         → Auth required + admin role check
```

### 8.2 Middleware Implementation

**File:** `src/middleware.ts`

```typescript
// Pseudo-code
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated for protected routes
  if (!user && isProtectedRoute(request)) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Check subscription for premium routes
  if (user && requiresSubscription(request)) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, plans(name)')
      .eq('user_id', user.id)
      .single();

    if (!sub || sub.status !== 'active') {
      // Allow free-tier routes, block premium
      if (isPremiumRoute(request)) {
        return NextResponse.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 });
      }
    }
  }
}
```

### 8.3 Server-Side Permission Check (Helper)

```typescript
// src/lib/auth.ts
export async function getUserPermissions(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('roles(role_permissions(permissions(name)))')
    .eq('user_id', userId);
  // Flatten to array of permission names
  return flatten(data);
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.includes(permission);
}
```

---

## 9. Frontend Changes

### 9.1 New Files

```
src/
  app/
    auth/
      login/page.tsx            ← Login / signup page
      callback/route.ts          ← Supabase OAuth callback
    api/
      stripe/
        checkout/route.ts        ← POST /api/stripe/checkout
        webhook/route.ts         ← POST /api/stripe/webhook
        portal/route.ts          ← POST /api/stripe/portal
      auth/
        me/route.ts              ← GET /api/auth/me
  components/
    layout/
      upgrade-modal.tsx          ← Paywall / upgrade modal
    auth/
      login-form.tsx             ← Supabase Auth UI
  hooks/
    use-user.ts                  ← User + plan + permissions hook
    use-permission.ts            ← Single permission check hook
  lib/
    supabase/
      client.ts                  ← Browser client
      server.ts                  ← Server client (middleware)
      admin.ts                   ← Service role client (webhooks)
    stripe.ts                    ← Stripe server-side client
    auth.ts                      ← Permission helpers
  middleware.ts                  ← Route protection middleware
```

### 9.2 Pages Needing Modification

| Page | Change |
|------|--------|
| `(crm)/clientes/page.tsx` | Add client count check → show UpgradeModal if limit reached |
| `(crm)/cuentas-cobro/page.tsx` | Add monthly invoice count check → show UpgradeModal |
| `(crm)/dashboard/page.tsx` | Hide Cashflow section for Free users, show upgrade CTA |
| `(crm)/reportes/page.tsx` | Block route entirely for Free users (middleware) |
| `(crm)/configuracion/page.tsx` | Add "Plan" section showing current plan + upgrade button |
| `components/layout/sidebar.tsx` | Hide "Reportes" nav item for Free users, add plan badge |
| `page.tsx` (landing) | Wire "Comenzar Gratis" to `/auth/login` |

### 9.3 Upgrade/Paywall Modal

```typescript
// src/components/layout/upgrade-modal.tsx
interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason: 'client_limit' | 'invoice_limit' | 'premium_feature';
  featureName?: string;
}

// Messages by reason (Spanish — matches app language):
// client_limit:    "Has alcanzado el límite de tu Plan Gratuito. Actualiza a Profesional para crear clientes ilimitados."
// invoice_limit:   "Has alcanzado tu límite mensual de cuentas de cobro. Actualiza para continuar."
// premium_feature: "[Funcionalidad] requiere un plan Profesional. Actualiza para acceder."
```

### 9.4 Context Provider

```typescript
// src/components/auth/auth-provider.tsx
interface AuthContext {
  user: User | null;
  plan: Plan | null;
  subscription: Subscription | null;
  permissions: string[];
  isLoading: boolean;
  canAccess: (permission: string) => boolean;
  planName: string; // 'free' | 'professional' | 'enterprise'
}
```

---

## 10. Feature Flag Enforcement Map

| Feature | Free | Professional | Enterprise | Guard Location |
|---------|:----:|:------------:|:----------:|----------------|
| Client creation (>1) | BLOCK | Allow | Allow | API route + frontend modal |
| Invoice creation (>3/mo) | BLOCK | Allow | Allow | API route + frontend modal |
| Dashboard KPIs | Basic | Full | Full | Conditional rendering |
| Cashflow chart | HIDE | Show | Show | Dashboard component |
| AI Assistant | HIDE | Show | Show | Conditional rendering |
| Advanced Reports | HIDE | Show | Show | Middleware route block |
| PDF Branding (no watermark) | HIDE | Show | Show | API route |
| Automated Reminders | HIDE | Show | Show | API route |
| Team Management | HIDE | HIDE | Show | Conditional rendering |
| API Access | HIDE | HIDE | Show | Middleware |
| White Label | HIDE | HIDE | Show | Middleware |

---

## 11. Audit Log Actions

| Action | Trigger |
|--------|---------|
| `plan_upgrade` | User upgrades from Free → Professional/Enterprise |
| `plan_downgrade` | Subscription expires, user downgraded |
| `payment_succeeded` | Stripe invoice.payment_succeeded |
| `payment_failed` | Stripe invoice.payment_failed |
| `role_changed` | Role added or removed |
| `permission_changed` | Permission granted or revoked |
| `subscription_created` | New subscription record |
| `subscription_canceled` | User cancels subscription |
| `subscription_expired` | Subscription reaches end date |
| `feature_access_denied` | User attempts blocked premium feature |
| `client_limit_blocked` | Free user blocked from creating >1 client |
| `invoice_limit_blocked` | Free user blocked from creating >3 invoices |

---

## 12. Implementation Plan (Phased)

### Phase A: Foundation (Auth + DB)

1. Set up Supabase project
2. Apply database migrations (schema from §4)
3. Implement `src/lib/supabase/` clients (browser, server, admin)
4. Implement `src/middleware.ts` route protection
5. Build `/auth/login` page with Supabase Auth UI
6. Build `/api/auth/me` endpoint

### Phase B: Billing (Stripe)

1. Configure Stripe Products & Prices
2. Implement `src/lib/stripe.ts` server client
3. Build `/api/stripe/checkout` route
4. Build `/api/stripe/webhook` route
5. Build `/api/stripe/portal` route
6. Create Supabase Edge Function for grace period cron

### Phase C: Access Control

1. Seed roles, permissions, and role_permissions tables
2. Implement `src/lib/auth.ts` permission helpers
3. Create `AuthProvider` context
4. Build `UpgradeModal` component
5. Add `usePermission` hook

### Phase D: UI Integration

1. Modify sidebar: plan badge, conditional nav items
2. Modify clientes page: limit check + upgrade modal
3. Modify cuentas-cobro page: monthly count check
4. Modify dashboard: conditional sections
5. Modify configuracion: plan info + upgrade button
6. Wire landing page CTAs

### Phase E: Polish

1. Audit log UI in admin panel
2. Email notifications (Resend/SendGrid)
3. In-app notification center
4. Trial countdown banner
5. Grace period warning UI

---

## 13. Dependencies to Add

```bash
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js
```

---

## 14. Success Criteria Checklist

- [ ] Free user cannot create more than 1 active client
- [ ] Free user cannot create more than 3 invoices per calendar month
- [ ] Free user sees "Upgrade" CTA instead of premium features
- [ ] Professional subscription activates immediately after Stripe payment
- [ ] Role changes from FREE_USER → PROFESSIONAL_USER automatically
- [ ] Stripe is the source of truth for billing status
- [ ] Premium features unlock without manual intervention
- [ ] Downgrade preserves all user data (clients, invoices, history)
- [ ] All billing events are auditable via audit_logs table
- [ ] Webhook signature is verified on every Stripe event
- [ ] Grace period handles payment failures gracefully
- [ ] Enterprise plan supports multi-user team management

---

## 15. Open Questions

1. **Trial period length:** 14 days as shown in landing, or different?
2. **Colombian payment methods:** Should Stripe Checkout include Nequi/DaviPlata? (Stripe supports PSE for Colombia)
3. **Invoice PDF generation:** Use a library (jsPDF, Puppeteer, or a service like DocRaptor)?
4. **Email provider:** Resend, SendGrid, or AWS SES for transactional emails?
5. **WhatsApp reminders:** Use Twilio WhatsApp Business API or Meta Cloud API?
