"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  fmtCurrency,
  PRIORITY_BADGE,
  getInitials,
  getClientColor,
} from "@/lib/mock-data";
import { getInvoices, updateInvoiceStatus } from "@/app/actions/invoices";
import { getClients } from "@/app/actions/clients";
import type { Invoice, InvoiceStatus, Client } from "@/types";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type ColumnKey = "pending" | "sent" | "overdue" | "paid";

export default function PagosPage() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<number, Client>>({});
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ColumnKey | null>(null);
  const originalStatusRef = useRef<InvoiceStatus | null>(null);

  const COLUMNS = useMemo(
    () => [
      {
        key: "pending" as ColumnKey,
        label: t("payments.pending"),
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/40",
        border: "border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500",
      },
      {
        key: "sent" as ColumnKey,
        label: t("payments.sent"),
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/40",
        border: "border-blue-200 dark:border-blue-800",
        dot: "bg-blue-500",
      },
      {
        key: "overdue" as ColumnKey,
        label: t("payments.due_soon"),
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950/40",
        border: "border-red-200 dark:border-red-800",
        dot: "bg-red-500",
      },
      {
        key: "paid" as ColumnKey,
        label: t("payments.paid"),
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        border: "border-emerald-200 dark:border-emerald-800",
        dot: "bg-emerald-500",
      },
    ],
    [t],
  );

  const fetchData = async () => {
    setLoading(true);
    const [invRes, cliRes] = await Promise.all([
      getInvoices(),
      getClients(),
    ]);
    if (invRes.success) setInvoices(invRes.data || []);
    else toast.error(invRes.error || t("invoices.load_error"));
    if (cliRes.success) {
      setClientsMap(
        (cliRes.data || []).reduce(
          (acc, c) => {
            acc[c.id] = c;
            return acc;
          },
          {} as Record<number, Client>,
        ),
      );
    } else {
      toast.error(cliRes.error || t("invoices.load_clients_error"));
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const getInvoicesByStatus = (status: InvoiceStatus) =>
    invoices.filter((inv) => inv.status === status);

  const handleDragStart = useCallback(
    (id: string) => {
      const inv = invoices.find((i) => i.id === id);
      if (inv) originalStatusRef.current = inv.status;
      setDragId(id);
    },
    [invoices],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, column: ColumnKey) => {
      e.preventDefault();
      if (overColumn !== column) setOverColumn(column);
    },
    [overColumn],
  );

  const handleDragLeave = useCallback(() => {
    setOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, column: ColumnKey) => {
      e.preventDefault();
      const id = dragId;
      const originalStatus = originalStatusRef.current;
      setOverColumn(null);
      setDragId(null);
      originalStatusRef.current = null;
      if (!id || !originalStatus) return;

      if (originalStatus === column) return;

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status: column as InvoiceStatus } : inv,
        ),
      );

      const r = await updateInvoiceStatus(id, column as InvoiceStatus);
      if (!r.success) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === id ? { ...inv, status: originalStatus } : inv,
          ),
        );
        toast.error(r.error || t("payments.update_error"));
      }
    },
    [dragId, t],
  );

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setOverColumn(null);
    originalStatusRef.current = null;
  }, []);

  const formatDate = (dateStr: string) => {
    const [, m, d] = dateStr.split("-");
    return `${d}/${m}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight">
          {t("payments.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("payments.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const colInvoices = getInvoicesByStatus(col.key);
          return (
            <div key={col.key} className="flex flex-col gap-3">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-sm",
                  col.bg,
                  col.color,
                )}
              >
                <span className={cn("size-2 rounded-full", col.dot)} />
                <span>{col.label}</span>
                <span className="ml-auto inline-flex items-center justify-center size-5 rounded-full bg-muted-foreground/10 text-xs font-semibold">
                  {colInvoices.length}
                </span>
              </div>

              <div
                className={cn(
                  "flex flex-col gap-2 rounded-xl border-2 border-dashed p-2 min-h-[320px] transition-colors",
                  col.border,
                  overColumn === col.key && "border-foreground/30 bg-muted/50",
                )}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                {colInvoices.map((inv) => {
                  const client = clientsMap[inv.clientId];
                  return (
                    <Card
                      key={inv.id}
                      data-size="sm"
                      draggable
                      onDragStart={() => handleDragStart(inv.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "cursor-grab active:cursor-grabbing select-none transition-opacity bg-card",
                        dragId === inv.id && "opacity-40",
                      )}
                    >
                      <CardContent className="gap-2 flex flex-col">
                        <div className="flex items-center gap-2">
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
                            <p className="text-sm font-medium truncate">
                              {inv.client}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {inv.id}
                            </p>
                          </div>
                        </div>

                        <p className="text-lg font-bold tracking-tight">
                          {fmtCurrency(inv.value)}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(inv.date)}
                          </span>
                          <Badge
                            variant="outline"
                            className={PRIORITY_BADGE[inv.priority]?.color}
                          >
                            {PRIORITY_BADGE[inv.priority]?.label || inv.priority}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {colInvoices.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                    {t("payments.empty")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
