"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Plus,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  STATUS_BADGE,
  fmtCurrency,
  getInitials,
  getClientColor,
  MONTHS,
} from "@/lib/mock-data";
import { getClients } from "@/app/actions/clients";
import { getInvoices } from "@/app/actions/invoices";
import { toast } from "sonner";
import type { Client, Invoice, KpiData } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
};

type Period = "Día" | "Semana" | "Mes" | "Año";

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const h = 30;
  const w = 80;
  const padding = 2;

  const points = data
    .map(
      (v, i) =>
        `${padding + (i / (data.length - 1 || 1)) * (w - padding * 2)},${
          h - padding - ((v - min) / range) * (h - padding * 2)
        }`
    )
    .join(" ");

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function computeCashflow(invoices: Invoice[]) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const numMonths = 7;
  const billed: number[] = new Array(numMonths).fill(0);
  const collected: number[] = new Array(numMonths).fill(0);
  const pending: number[] = new Array(numMonths).fill(0);
  const labels: string[] = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m < 0) {
      m += 12;
      y--;
    }
    labels.push(MONTHS[m].slice(0, 3));

    const monthPrefix = `${y}-${String(m + 1).padStart(2, "0")}`;

    for (const inv of invoices) {
      if (inv.date.startsWith(monthPrefix)) {
        billed[numMonths - 1 - i] += inv.value;
        if (inv.status === "paid") {
          collected[numMonths - 1 - i] += inv.value;
        } else if (inv.status === "pending" || inv.status === "sent") {
          pending[numMonths - 1 - i] += inv.value;
        }
      }
    }
  }

  return { billed, collected, pending, labels };
}

function computeLast7DaysSparkline(
  invoices: Invoice[],
  filter: (inv: Invoice) => boolean
): number[] {
  const days = 7;
  const result: number[] = new Array(days).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const inv of invoices) {
    if (!filter(inv)) continue;
    const d = new Date(inv.date + "T00:00:00");
    const dayDiff = Math.floor(
      (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    const idx = days - 1 - dayDiff;
    if (idx >= 0 && idx < days) {
      result[idx] += inv.value;
    }
  }

  return result;
}

function computeMonthOverMonth(
  invoices: Invoice[],
  filter: (inv: Invoice) => boolean
): { change: string; positive: boolean } {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonth = `${prevY}-${String(prevM + 1).padStart(2, "0")}`;

  let thisSum = 0;
  let prevSum = 0;

  for (const inv of invoices) {
    if (!filter(inv)) continue;
    if (inv.date.startsWith(thisMonth)) thisSum += inv.value;
    if (inv.date.startsWith(prevMonth)) prevSum += inv.value;
  }

  if (prevSum === 0) return { change: "N/A", positive: true };
  const pct = ((thisSum - prevSum) / prevSum) * 100;
  return {
    change: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    positive: pct >= 0,
  };
}

function CashFlowChart({
  billed,
  collected,
  pending,
  labels,
}: {
  billed: number[];
  collected: number[];
  pending: number[];
  labels: string[];
}) {
  const [period, setPeriod] = useState<Period>("Mes");

  if (labels.length === 0) {
    return (
      <Card className="animate-slide">
        <CardHeader className="flex-row items-center justify-between border-b pb-3">
          <CardTitle>Flujo de Caja</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex items-center justify-center h-40 text-muted-foreground text-sm">
          Sin datos de facturación
        </CardContent>
      </Card>
    );
  }

  const barW = 16;
  const gap = 12;
  const groupW = barW * 3 + gap * 2;
  const chartW = labels.length * (groupW + gap);
  const chartH = 160;
  const maxVal = Math.max(...billed, 1);

  return (
    <Card className="animate-slide">
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <CardTitle>Flujo de Caja</CardTitle>
        <div className="flex gap-1 rounded-lg bg-muted p-0.5">
          {(["Día", "Semana", "Mes", "Año"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors",
                period === p
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-chart-1" /> Facturado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-chart-2" /> Cobrado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-chart-3" /> Pendiente
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartW + 20} ${chartH + 24}`}
            className="w-full"
            style={{ minWidth: chartW + 20, height: chartH + 24 }}
          >
            {billed.map((v, i) => {
              const x = i * (groupW + gap) + gap;
              const bh = (v / maxVal) * chartH;
              const ch = ((collected[i] || 0) / maxVal) * chartH;
              const ph = ((pending[i] || 0) / maxVal) * chartH;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={chartH - bh + 4}
                    width={barW}
                    height={bh}
                    rx="3"
                    fill="var(--chart-1)"
                    opacity={0.85}
                  />
                  <rect
                    x={x + barW + gap}
                    y={chartH - ch + 4}
                    width={barW}
                    height={ch}
                    rx="3"
                    fill="var(--chart-2)"
                    opacity={0.85}
                  />
                  <rect
                    x={x + (barW + gap) * 2}
                    y={chartH - ph + 4}
                    width={barW}
                    height={ph}
                    rx="3"
                    fill="var(--chart-3)"
                    opacity={0.85}
                  />
                  <text
                    x={x + groupW / 2}
                    y={chartH + 20}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {labels[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cr, ir] = await Promise.all([getClients(), getInvoices()]);
        if (cr.success) setClients(cr.data || []);
        else toast.error(cr.error || "Error al cargar clientes");
        if (ir.success) setInvoices(ir.data || []);
        else toast.error(ir.error || "Error al cargar facturas");
      } catch {
        toast.error("Error al cargar datos del dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayInvoices = invoices.filter((inv) => inv.date === today);
  const facturadoHoy = todayInvoices.reduce((s, inv) => s + inv.value, 0);
  const cobradoHoy = todayInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((s, inv) => s + inv.value, 0);
  const pendienteTotal = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "sent")
    .reduce((s, inv) => s + inv.value, 0);
  const clientesActivos = clients.filter((c) => c.status === "active").length;

  const cashflow = computeCashflow(invoices);

  const facturadoSpark = computeLast7DaysSparkline(invoices, () => true);
  const cobradoSpark = computeLast7DaysSparkline(
    invoices,
    (inv) => inv.status === "paid"
  );
  const pendienteSpark = computeLast7DaysSparkline(
    invoices,
    (inv) => inv.status === "pending" || inv.status === "sent"
  );

  const facturadoChange = computeMonthOverMonth(invoices, () => true);
  const cobradoChange = computeMonthOverMonth(
    invoices,
    (inv) => inv.status === "paid"
  );

  const fallbackSpark = [8, 12, 10, 15, 13, 18, 20];

  const hasSpark = (arr: number[]) => arr.some((v) => v > 0);

  const kpis: KpiData[] = [
    {
      label: "Facturado Hoy",
      value: fmtCurrency(facturadoHoy),
      change: facturadoChange.change,
      positive: facturadoChange.positive,
      icon: "TrendingUp",
      iconBg: "rgba(37,99,235,0.1)",
      color: "var(--primary)",
      chartData: hasSpark(facturadoSpark) ? facturadoSpark : fallbackSpark,
    },
    {
      label: "Cobrado Hoy",
      value: fmtCurrency(cobradoHoy),
      change: cobradoChange.change,
      positive: cobradoChange.positive,
      icon: "CheckCircle",
      iconBg: "rgba(16,185,129,0.1)",
      color: "var(--secondary)",
      chartData: hasSpark(cobradoSpark) ? cobradoSpark : [5, 9, 7, 12, 10, 15, 16],
    },
    {
      label: "Pendiente por Cobrar",
      value: fmtCurrency(pendienteTotal),
      change: "-",
      positive: false,
      icon: "Clock",
      iconBg: "rgba(245,158,11,0.1)",
      color: "var(--warning)",
      chartData: hasSpark(pendienteSpark) ? pendienteSpark : [12, 14, 11, 16, 13, 9, 10],
    },
    {
      label: "Clientes Activos",
      value: String(clientesActivos),
      change: "-",
      positive: true,
      icon: "Users",
      iconBg: "rgba(139,92,246,0.1)",
      color: "#8B5CF6",
      chartData: fallbackSpark,
    },
  ];

  const recentInvoices = invoices.slice(0, 4);
  const pendingInvoices = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "sent")
    .slice(0, 5);

  const clientMap = new Map(clients.map((c) => [c.id, c]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 animate-fade sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bienvenido de nuevo
          </h1>
          <p className="text-sm text-muted-foreground">
            Controla tus ingresos, cuentas de cobro y pagos desde un solo lugar.
          </p>
        </div>
        <Button className="mt-3 sm:mt-0">
          <Plus className="mr-1.5 size-4" />
          Nueva Cuenta de Cobro
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger">
        {kpis.map((kpi, i) => {
          const Icon = iconMap[kpi.icon] || TrendingUp;
          return (
            <Card
              key={i}
              className="group animate-slide transition-shadow hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex size-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: kpi.iconBg }}
                  >
                    <Icon className="size-4" style={{ color: kpi.color }} />
                  </div>
                  <Sparkline data={kpi.chartData} color={kpi.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {kpi.change !== "-" ? (
                    <span
                      className={cn(
                        "flex items-center gap-0.5 font-medium",
                        kpi.positive ? "text-emerald-500" : "text-red-500"
                      )}
                    >
                      {kpi.positive ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                      {kpi.change}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                  <span className="text-muted-foreground">vs. mes anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cash Flow Chart */}
      <CashFlowChart
        billed={cashflow.billed}
        collected={cashflow.collected}
        pending={cashflow.pending}
        labels={cashflow.labels}
      />

      {/* Bottom row: Recent Invoices + Upcoming Deadlines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="animate-slide">
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Cuentas Recientes</CardTitle>
              <Button variant="ghost" size="xs" className="text-xs">
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentInvoices.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay cuentas de cobro
                </div>
              ) : (
                recentInvoices.map((inv) => {
                  const stat = STATUS_BADGE[inv.status];
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{inv.id}</span>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px]", stat.color)}
                          >
                            {stat.label}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {inv.client}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {fmtCurrency(inv.value)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="animate-slide">
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Próximos Vencimientos</CardTitle>
              <Button variant="ghost" size="xs" className="text-xs">
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pendingInvoices.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay vencimientos pendientes
                </div>
              ) : (
                pendingInvoices.map((inv) => {
                  const stat = STATUS_BADGE[inv.status];
                  const client = clientMap.get(inv.clientId);
                  const color = client?.color || getClientColor(inv.client);
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <Avatar size="sm">
                        <AvatarFallback
                          style={{ backgroundColor: color + "20", color }}
                          className="text-[11px] font-medium"
                        >
                          {getInitials(inv.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {inv.client}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inv.concept}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {fmtCurrency(inv.value)}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", stat.color)}
                        >
                          {stat.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
