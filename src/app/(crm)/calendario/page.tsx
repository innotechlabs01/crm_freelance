"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MONTHS, DAYS } from "@/lib/mock-data";
import { getInvoices } from "@/app/actions/invoices";
import { toast } from "sonner";
import type { Invoice } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const today = new Date();
const CURRENT_YEAR = today.getFullYear();
const CURRENT_MONTH = today.getMonth();
const CURRENT_DAY = today.getDate();

export default function CalendarioPage() {
  const { t } = useLanguage();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await getInvoices();
        if (!res.success) {
          toast.error(res.error || t("invoices.load_error"));
          return;
        }
        setInvoices(res.data ?? []);
      } catch {
        toast.error(t("invoices.load_error"));
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [t]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const isCurrentMonth = year === CURRENT_YEAR && month === CURRENT_MONTH;

  const cells: { day: number; type: "prev" | "current" | "next" }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, type: "prev" });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, type: "current" });
  }

  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, type: "next" });
  }

  const eventDays = new Set<number>();
  const eventInvoicesMap: Record<number, string> = {};

  for (const inv of invoices) {
    if (!inv.date) continue;
    const d = new Date(inv.date + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      eventDays.add(day);
      if (!eventInvoicesMap[day]) {
        eventInvoicesMap[day] = inv.id;
      }
    }
  }

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const eventItems = Array.from(eventDays)
    .sort((a, b) => a - b)
    .map((d) => ({
      day: d,
      invoice: eventInvoicesMap[d],
      date: `${d} de ${MONTHS[month]} de ${year}`,
    }));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1 animate-fade">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("nav.calendario")}
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestión de fechas de vencimiento y eventos
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : (
        <>
          <Card className="max-w-lg animate-slide">
            <CardHeader className="flex-row items-center justify-between px-4 pb-2">
              <button
                onClick={handlePrevMonth}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <CardTitle className="text-sm font-medium">
                {MONTHS[month]} {year}
              </CardTitle>
              <button
                onClick={handleNextMonth}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="grid grid-cols-7">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="flex h-8 items-center justify-center text-[11px] font-medium text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
                {cells.map((cell, i) => {
                  const isToday =
                    isCurrentMonth &&
                    cell.type === "current" &&
                    cell.day === CURRENT_DAY;
                  const hasEvent =
                    cell.type === "current" && eventDays.has(cell.day);
                  const isOtherMonth = cell.type !== "current";

                  return (
                    <div
                      key={i}
                      className="flex aspect-square items-center justify-center"
                    >
                      <div className="relative flex size-8 items-center justify-center">
                        <span
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-full text-xs tabular-nums transition-colors",
                            isToday &&
                              "bg-primary font-semibold text-primary-foreground",
                            !isToday &&
                              !isOtherMonth &&
                              "text-foreground hover:bg-muted",
                            isOtherMonth && "text-muted-foreground/40",
                          )}
                        >
                          {cell.day}
                        </span>
                        {hasEvent && (
                          <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="max-w-lg animate-slide">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <CardTitle>
                  Vencimientos de {MONTHS[month]} {year}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {eventItems.map((ev) => (
                  <div
                    key={ev.day}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <span className="text-sm font-bold tabular-nums text-primary">
                        {ev.day}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        Vencimiento factura
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="size-3" />
                        {ev.invoice}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {ev.date}
                    </span>
                  </div>
                ))}
                {eventItems.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Sin vencimientos este mes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
