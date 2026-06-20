# FreelanceCRM

CRM SaaS para freelancers colombianos. Gestiona clientes, genera cuentas de cobro fiscalmente válidas, haz seguimiento de pagos en un tablero Kanban y visualiza dashboards financieros con KPIs.

## Stack

| Categoría | Tecnología |
|-----------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 + shadcn/ui (base-nova) |
| Autenticación | [Clerk](https://clerk.com) |
| Base de datos | [Turso](https://turso.tech) (libSQL) |
| Pagos | [Stripe](https://stripe.com) |
| Gráficos | Recharts |
| Iconos | Lucide React |

## Funcionalidades

- **Dashboard financiero** — KPIs (facturado, cobrado, pendiente), gráficos de cashflow, tendencias mensuales, top clientes
- **Gestión de clientes** — CRUD con datos fiscales (NIT, tipo de régimen, datos bancarios)
- **Cuentas de cobro** — Generador de facturas en 4 pasos con cálculo de IVA y retención, asistente IA para conceptos, descarga en PDF
- **Seguimiento de pagos** — Tablero Kanban (Pendiente → Enviada → Vencida → Pagada) con drag & drop
- **Reportes** — Ingresos por mes/cliente, facturación pendiente vs cobrada
- **Calendario** — Vista mensual con fechas de vencimiento de facturas
- **Notificaciones** — Recordatorios automáticos de pago (email)
- **Panel admin** — Gestión de usuarios, suscripciones, tickets de soporte, incidentes, feature flags y auditoría

## Planes

| Plan | Precio | Límites |
|------|--------|---------|
| **Free** | $0 COP | 1 cliente, 3 facturas/mes, dashboard básico |
| **Profesional** | $24,900 COP/mes | Clientes ilimitados, facturas ilimitadas, IA, recordatorios, reportes avanzados, PDF con marca |
| **Empresarial** | $79,900 COP/mes | Todo lo anterior + white label, API access, gestión de equipo, roles personalizados |

## Requisitos previos

- Node.js 18+
- Cuenta en [Clerk](https://clerk.com)
- Base de datos en [Turso](https://turso.tech)
- Cuenta en [Stripe](https://stripe.com) (para pagos)

## Configuración inicial

1. Clona el repositorio e instala dependencias:

```bash
git clone <repo-url>
cd crm-financing-freelance
npm install
```

2. Copia `.env.example` a `.env.local` y configura las variables:

```bash
cp .env.example .env.local
```

Variables requeridas:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL` | `/` |
| `TURSO_DATABASE_URL` | URL de la BD Turso |
| `TURSO_AUTH_TOKEN` | Token de autenticación Turso |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_APP_URL` | URL base de la app (ej. `http://localhost:3000`) |

3. Ejecuta las migraciones y seed:

```bash
# Corre las migraciones de base de datos
curl http://localhost:3000/api/migrate

# Carga datos iniciales (planes, roles, permisos)
curl -X POST http://localhost:3000/api/seed
```

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                    # Landing page (marketing)
│   ├── layout.tsx                  # Root layout (providers)
│   ├── globals.css                 # Tailwind + tema shadcn
│   ├── (crm)/                      # Rutas autenticadas del CRM
│   │   ├── dashboard/              # Dashboard con KPIs
│   │   ├── clientes/               # CRUD de clientes
│   │   ├── cuentas-cobro/          # Generador de facturas
│   │   ├── pagos/                  # Tablero Kanban de pagos
│   │   ├── reportes/               # Reportes financieros
│   │   ├── calendario/             # Calendario de facturas
│   │   └── configuracion/          # Perfil, notificaciones, plan
│   ├── admin/                      # Panel de administración
│   ├── api/                        # API routes (auth, stripe, migrate, seed)
│   └── actions/                    # Server Actions (clients, invoices, freelancer, admin)
├── components/
│   ├── auth/                       # AuthProvider (contexto de usuario y plan)
│   ├── layout/                     # Sidebar, Topbar, ThemeProvider, UpgradeModal
│   └── ui/                         # Componentes shadcn/ui
├── db/
│   ├── client.ts                   # Cliente Turso
│   ├── migrate.ts                  # Runner de migraciones
│   ├── seed.ts                     # Seed de planes/roles/permisos
│   └── migrations/                 # Archivos SQL de migración
├── hooks/                          # useUser, usePermission
├── lib/                            # Utilidades (auth, stripe, utils)
└── types/                          # Interfaces TypeScript
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en `localhost:3000` |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Ejecutar ESLint |

## Stripe Webhooks

Para desarrollo local, usa Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Eventos manejados:
- `checkout.session.completed` — Activar suscripción
- `customer.subscription.updated` — Sincronizar cambios
- `customer.subscription.deleted` — Cancelar suscripción
- `invoice.payment_succeeded` — Extender renovación
- `invoice.payment_failed` — Marcar como moroso
