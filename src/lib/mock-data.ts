import { NavItem } from "@/types";

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

export const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", label: "Pendiente" },
  sent: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Enviada" },
  paid: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Pagada" },
  overdue: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Vencida" },
};

export const PRIORITY_BADGE: Record<string, { color: string; label: string }> = {
  high: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Alta" },
  medium: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", label: "Media" },
  low: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Baja" },
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
