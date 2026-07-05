"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MONTHS, fmtCurrency, getInitials, getClientColor } from "@/lib/mock-data";
import { getClients } from "@/app/actions/clients";
import { getInvoices } from "@/app/actions/invoices";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Client, Invoice } from "@/types";

function TrendingUpIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}

type TopClient = {
  id: number;
  name: string;
  company: string;
  color: string;
  initials: string;
  totalInvoiced: number;
};

export default function ReportesPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invRes, cliRes] = await Promise.all([
          getInvoices(),
          getClients(),
        ]);

        if (!invRes.success || !cliRes.success) {
          toast.error(invRes.error || cliRes.error || t("reportes.load_error"));
          return;
        }

        setInvoices(invRes.data ?? []);
        setClients(cliRes.data ?? []);
      } catch {
        toast.error(t("reportes.load_error"));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.value, 0);
  const totalRecibido = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.value, 0);
  const pendingTotal = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.value, 0);
  const proyeccionAnual = totalInvoiced * 12;

  const clientTotalsMap = new Map<
    number,
    { name: string; color: string; initials: string; total: number }
  >();
  for (const inv of invoices) {
    const existing = clientTotalsMap.get(inv.clientId);
    if (existing) {
      existing.total += inv.value;
    } else {
      const c = clients.find((cl) => cl.id === inv.clientId);
      clientTotalsMap.set(inv.clientId, {
        name: inv.client,
        color: c?.color ?? getClientColor(inv.client),
        initials: c?.initials ?? getInitials(inv.client),
        total: inv.value,
      });
    }
  }

  const topClients: TopClient[] = Array.from(clientTotalsMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      company:
        clients.find((c) => c.id === id)?.company ?? "",
      color: data.color,
      initials: data.initials,
      totalInvoiced: data.total,
    }))
    .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
    .slice(0, 5);

  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "pending" || inv.status === "overdue",
  );

  const monthlyData = Array(12).fill(0);
  for (const inv of invoices) {
    if (!inv.date) continue;
    const m = new Date(inv.date + "T00:00:00").getMonth();
    if (m >= 0 && m < 12) {
      monthlyData[m] += inv.value;
    }
  }
  const monthlyChartData = monthlyData.map((v) => v / 1_000_000);

  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const totalCount = invoices.length || 1;

  const donutData = [
    {
      label: t("status.paid"),
      pct: Math.round((paidCount / totalCount) * 100),
      color: "#10B981",
    },
    {
      label: t("status.pending"),
      pct: Math.round((pendingCount / totalCount) * 100),
      color: "#F59E0B",
    },
    {
      label: t("status.overdue"),
      pct: Math.round((overdueCount / totalCount) * 100),
      color: "#EF4444",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight">
          {t("nav.reportes")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("reportes.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">
                  {t("reportes.monthly_income")}
                </span>
                <span className="text-2xl font-bold tracking-tight">
                  {fmtCurrency(totalInvoiced)}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <span>&mdash;</span>
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
                <TrendingUpIcon />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">
                  {t("reportes.payments_received")}
                </span>
                <span className="text-2xl font-bold tracking-tight">
                  {fmtCurrency(totalRecibido)}
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40">
                <CheckCircleIcon />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">
                  {t("reportes.annual_projection")}
                </span>
                <span className="text-2xl font-bold tracking-tight">
                  {fmtCurrency(proyeccionAnual)}
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/40">
                <BarChartIcon />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("reportes.monthly_income_chart")}</CardTitle>
          </CardHeader>
          <CardContent>
            <svg
              viewBox="0 0 500 220"
              className="w-full h-auto"
              role="img"
              aria-label={t("reportes.monthly_income_chart_aria")}
            >
              {[0, 10, 20, 30, 40].map((v, i) => {
                const y = 200 - (v / 40) * 200;
                return (
                  <g key={i}>
                    <line
                      x1="40"
                      y1={y}
                      x2="480"
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.08}
                      strokeWidth="1"
                    />
                    <text
                      x="35"
                      y={y + 4}
                      textAnchor="end"
                      className="fill-muted-foreground"
                      fontSize="10"
                    >
                      {v}M
                    </text>
                  </g>
                );
              })}

              {monthlyChartData.map((v, i) => {
                const barW = 28;
                const gap = 34;
                const x = 50 + i * gap;
                const barH = Math.min((v / 40) * 200, 200);
                const y = 200 - barH;

                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      rx="3"
                      fill="currentColor"
                      className="fill-primary"
                      opacity={0.85}
                    />
                    {i % 2 === 0 && (
                      <text
                        x={x + barW / 2}
                        y="215"
                        textAnchor="middle"
                        className="fill-muted-foreground"
                        fontSize="9"
                      >
                        {MONTHS[i].slice(0, 3)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reportes.top_clients")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topClients.map((client, i) => (
              <div
                key={client.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
              >
                <span className="w-5 text-xs font-semibold text-muted-foreground text-right">
                  {i + 1}
                </span>
                <Avatar size="sm">
                  <AvatarFallback
                    className="text-xs font-medium"
                    style={{
                      backgroundColor: client.color,
                      color: "#fff",
                    }}
                  >
                    {client.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {client.company}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {fmtCurrency(client.totalInvoiced)}
                </span>
              </div>
            ))}
            {topClients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("reportes.no_client_data")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("reportes.payment_distribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <svg
                viewBox="0 0 140 140"
                className="size-[120px] shrink-0"
                role="img"
                aria-label={t("reportes.payment_distribution_aria")}
              >
                {donutSegments(
                  donutData[0].pct,
                  donutData[1].pct,
                  donutData[2].pct,
                ).map((seg, i) => (
                  <path
                    key={i}
                    d={seg.d}
                    fill={donutData[i].color}
                    strokeWidth="0"
                  />
                ))}
                <text
                  x="70"
                  y="64"
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize="18"
                  fontWeight="700"
                >
                  {invoices.length}
                </text>
                <text
                  x="70"
                  y="82"
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="9"
                >
                  {t("reportes.total")}
                </text>
              </svg>

              <div className="flex flex-col gap-2">
                {donutData.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-sm shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {seg.label}
                    </span>
                    <span className="text-xs font-semibold ml-auto">
                      {seg.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reportes.pending_payments")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {t("reportes.pending_total")}
              </span>
              <p className="text-xl font-bold text-amber-800 dark:text-amber-300">
                {fmtCurrency(pendingTotal)}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {pendingInvoices.slice(0, 4).map((inv) => {
                const client = clients.find((c) => c.id === inv.clientId);
                return (
                  <div
                    key={inv.id}
                    className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar size="sm">
                      <AvatarFallback
                        className="text-xs font-medium"
                        style={{
                          backgroundColor:
                            client?.color ?? getClientColor(inv.client),
                          color: "#fff",
                        }}
                      >
                        {client?.initials ?? getInitials(inv.client)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {inv.client}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {inv.id}
                      </p>
                    </div>
                    <span className="text-xs font-semibold">
                      {fmtCurrency(inv.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reportes.income_projection")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">
                {fmtCurrency(proyeccionAnual)}
              </span>
              <span className="text-xs font-medium text-emerald-600">
                {t("reportes.projection_12_months")}
              </span>
            </div>
            <svg
              viewBox="0 0 300 120"
              className="w-full h-auto"
              role="img"
              aria-label={t("reportes.income_projection_aria")}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = 100 - ratio * 100;
                return (
                  <g key={i}>
                    <line
                      x1="10"
                      y1={y}
                      x2="290"
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.08}
                      strokeWidth="1"
                    />
                  </g>
                );
              })}

              <path
                d={projectionArea(300, 100, 10)}
                fill="currentColor"
                className="fill-primary/15"
              />

              <path
                d={projectionLine(300, 100, 10)}
                fill="none"
                stroke="currentColor"
                className="stroke-primary"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {["Ene", "Mar", "May", "Jul", "Sep", "Nov"].map((m, i) => (
                <text
                  key={m}
                  x={15 + i * 52}
                  y="114"
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="8"
                >
                  {m}
                </text>
              ))}
            </svg>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type DonutSegment = { d: string };

function donutSegments(
  pct1: number,
  pct2: number,
  pct3: number,
): DonutSegment[] {
  const cx = 70,
    cy = 70,
    outer = 54,
    inner = 34;
  const total = pct1 + pct2 + pct3 || 1;
  let start = -90;

  const describeArc = (fromAngle: number, toAngle: number): string => {
    const r1 = (fromAngle * Math.PI) / 180;
    const r2 = (toAngle * Math.PI) / 180;

    const x1o = cx + outer * Math.cos(r1);
    const y1o = cy + outer * Math.sin(r1);
    const x2o = cx + outer * Math.cos(r2);
    const y2o = cy + outer * Math.sin(r2);

    const x1i = cx + inner * Math.cos(r2);
    const y1i = cy + inner * Math.sin(r2);
    const x2i = cx + inner * Math.cos(r1);
    const y2i = cy + inner * Math.sin(r1);

    const large = toAngle - fromAngle > 180 ? 1 : 0;

    return [
      `M ${x1o.toFixed(1)} ${y1o.toFixed(1)}`,
      `A ${outer} ${outer} 0 ${large} 1 ${x2o.toFixed(1)} ${y2o.toFixed(1)}`,
      `L ${x1i.toFixed(1)} ${y1i.toFixed(1)}`,
      `A ${inner} ${inner} 0 ${large} 0 ${x2i.toFixed(1)} ${y2i.toFixed(1)}`,
      "Z",
    ].join(" ");
  };

  const segments: { d: string }[] = [];
  const percents = [pct1, pct2, pct3];

  for (const p of percents) {
    const sweep = (p / total) * 360;
    const end = start + sweep;
    segments.push({ d: describeArc(start, end) });
    start = end;
  }

  return segments;
}

function projectionLine(width: number, height: number, pad: number): string {
  const points = [
    [0.22, 0.72],
    [0.31, 0.6],
    [0.4, 0.55],
    [0.5, 0.42],
    [0.58, 0.38],
    [0.67, 0.3],
    [0.75, 0.25],
    [0.83, 0.18],
    [0.91, 0.12],
    [1.0, 0.06],
  ];

  const w = width - pad * 2;
  const h = height;
  return points
    .map(
      ([rx, ry], i) =>
        `${i === 0 ? "M" : "L"} ${(pad + rx * w).toFixed(1)} ${(ry * h).toFixed(1)}`,
    )
    .join(" ");
}

function projectionArea(width: number, height: number, pad: number): string {
  const points = [
    [0.22, 0.72],
    [0.31, 0.6],
    [0.4, 0.55],
    [0.5, 0.42],
    [0.58, 0.38],
    [0.67, 0.3],
    [0.75, 0.25],
    [0.83, 0.18],
    [0.91, 0.12],
    [1.0, 0.06],
  ];

  const w = width - pad * 2;
  const h = height;

  let d = points
    .map(
      ([rx, ry], i) =>
        `${i === 0 ? "M" : "L"} ${(pad + rx * w).toFixed(1)} ${(ry * h).toFixed(1)}`,
    )
    .join(" ");

  d += ` L ${(pad + 1 * w).toFixed(1)} ${h}`;
  d += ` L ${(pad + 0.22 * w).toFixed(1)} ${h}`;
  d += " Z";

  return d;
}
