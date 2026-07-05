import { NavItem } from "@/types";

type TFunc = (key: string, params?: Record<string, string | number>) => string;

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { id: "clientes", label: "Clientes", icon: "Users" },
  { id: "cuentas-cobro", label: "Cuentas de Cobro", icon: "FileText" },
  { id: "pagos", label: "Pagos", icon: "CreditCard" },
  { id: "reportes", label: "Reportes", icon: "BarChart3" },
  { id: "calendario", label: "Calendario", icon: "Calendar" },
  { id: "configuracion", label: "Configuración", icon: "Settings" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function getStatusBadge(status: string, t: TFunc) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.pending
  const key = `status.${status}` as string
  return { color, label: t(key) }
}

export function getPriorityBadge(priority: string, t: TFunc) {
  const color = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium
  const key = `priority.${priority}` as string
  return { color, label: t(key) }
}

// Legacy static exports for backward compat
export const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  pending: { color: STATUS_COLORS.pending, label: "Pendiente" },
  sent: { color: STATUS_COLORS.sent, label: "Enviada" },
  paid: { color: STATUS_COLORS.paid, label: "Pagada" },
  overdue: { color: STATUS_COLORS.overdue, label: "Vencida" },
};

export const PRIORITY_BADGE: Record<string, { color: string; label: string }> = {
  high: { color: PRIORITY_COLORS.high, label: "Alta" },
  medium: { color: PRIORITY_COLORS.medium, label: "Media" },
  low: { color: PRIORITY_COLORS.low, label: "Baja" },
};

export const fmtCurrency = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);

export const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const getClientColor = (name: string): string => {
  const colors = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#F97316"];
  return colors[name.charCodeAt(0) % colors.length];
};
