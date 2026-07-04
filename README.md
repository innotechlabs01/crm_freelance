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
| Pagos | [Lemon Squeezy](https://lemonsqueezy.com) |
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
| **Free** | $0 USD | 1 cliente, 3 facturas/mes, dashboard básico |
| **Profesional** | $24.99 USD/mes | Clientes ilimitados, facturas ilimitadas, IA, recordatorios, reportes avanzados, PDF con marca |
| **Empresarial** | $79.99 USD/mes | Todo lo anterior + white label, API access, gestión de equipo, roles personalizados |

## Requisitos previos

- Node.js 18+
- Cuenta en [Clerk](https://clerk.com)
- Base de datos en [Turso](https://turso.tech)
- Cuenta en [Lemon Squeezy](https://lemonsqueezy.com) (para pagos)

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
| `LEMONSQUEEZY_TEST_API_KEY` | Lemon Squeezy test API key |
| `LEMONSQUEEZY_TEST_STORE_ID` | Lemon Squeezy test store ID |
| `LEMONSQUEEZY_TEST_SIGNING_SECRET` | Lemon Squeezy test webhook signing secret |
| `LEMONSQUEEZY_LIVE_API_KEY` | Lemon Squeezy live API key |
| `LEMONSQUEEZY_LIVE_STORE_ID` | Lemon Squeezy live store ID |
| `LEMONSQUEEZY_LIVE_SIGNING_SECRET` | Lemon Squeezy live webhook signing secret |
| `LEMONSQUEEZY_PRO_VARIANT_ID` | Variant ID for Professional plan |
| `LEMONSQUEEZY_ENTERPRISE_VARIANT_ID` | Variant ID for Enterprise plan |
| `RESEND_API_KEY` | Resend API key for transactional emails |
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
│   ├── api/                        # API routes (auth, lemonsqueezy, migrate, seed)
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
├── lib/                            # Utilidades (auth, lemonsqueezy, email, utils)
└── types/                          # Interfaces TypeScript
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en `localhost:3000` |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Ejecutar ESLint |

## Lemon Squeezy Webhooks

Para desarrollo local, usa Lemon Squeezy CLI o un tunnel (ngrok):

```bash
ngrok http 3000
# Luego configura el webhook en Lemon Squeezy Dashboard apuntando a:
# https://<tu-ngrok>.ngrok.io/api/lemonsqueezy/webhook
```

Eventos manejados:
- `order_created` / `subscription_created` — Crear suscripcion, asignar rol, email de bienvenida
- `subscription_payment_success` — Activar suscripcion, email de confirmacion
- `subscription_payment_failed` — Marcar como moroso, periodo de gracia de 7 dias, email de aviso
- `subscription_updated` — Sincronizar cambios
- `subscription_cancelled` / `subscription_expired` — Cancelar suscripcion, downgrade a FREE_USER, email de notificacion
