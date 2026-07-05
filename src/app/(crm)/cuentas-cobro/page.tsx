"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  FileDown,
  Mail,
  Sparkles,
  ChevronRight,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useUser } from "@/hooks/use-user";
import { UpgradeModal } from "@/components/layout/upgrade-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  fmtCurrency,
  getStatusBadge,
  getPriorityBadge,
} from "@/lib/mock-data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getClients } from "@/app/actions/clients";
import { getInvoices, createInvoice } from "@/app/actions/invoices";
import { getFreelancerProfile } from "@/app/actions/freelancer";
import { generateInvoiceHtml, sendInvoiceEmail } from "@/lib/email";
import type { WithholdingType, Invoice, Client, Freelancer } from "@/types";

type RetencionOption = {
  value: WithholdingType;
  label: string;
  labelKey: string;
  rate: number;
};

const RETENCION_MAP: Record<WithholdingType, { labelKey: string; rate: number }> = {
  ninguna: { labelKey: "invoices.ret_none", rate: 0 },
  iva: { labelKey: "invoices.ret_iva", rate: 15 },
  ica: { labelKey: "invoices.ret_ica", rate: 0.96 },
  renta: { labelKey: "invoices.ret_renta", rate: 11 },
};

const TERM_MAP: Record<string, string> = {
  "15": "invoices.term_15",
  "30": "invoices.term_30",
  "45": "invoices.term_45",
  "60": "invoices.term_60",
};

const TERM_VALUES = ["15", "30", "45", "60"];

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function dueDateFromPlazo(plazoDias: string): string {
  const d = new Date();
  d.setDate(d.getDate() + Number(plazoDias));
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function CuentasCobroPage() {
  const { t, locale } = useLanguage();
  const steps = useMemo(() => t("invoices.steps").split(","), [t]);
  const { isFree, monthlyInvoiceCount, refreshLimits } = useUser();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [step, setStep] = useState(0);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [freelancer, setFreelancer] = useState<Freelancer>({
    name: "",
    nit: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    concepto: string;
    descripcion: string;
    valorSugerido: number;
  } | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [concepto, setConcepto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [valorBase, setValorBase] = useState("");
  const [plazoPago, setPlazoPago] = useState("30");
  const [fechaEmision, setFechaEmision] = useState(todayStr());
  const [fechaVencimiento, setFechaVencimiento] = useState(
    dueDateFromPlazo("30")
  );
  const [ivaPorcentaje, setIvaPorcentaje] = useState("19");
  const [tipoRetencion, setTipoRetencion] = useState<WithholdingType>("ninguna");

  const retencionOptions: RetencionOption[] = useMemo(
    () =>
      (Object.entries(RETENCION_MAP) as [WithholdingType, { labelKey: string; rate: number }][]).map(
        ([value, { labelKey, rate }]) => ({
          value,
          label: t(labelKey),
          labelKey,
          rate,
        })
      ),
    [t]
  );

  const plazoOptions = useMemo(
    () =>
      TERM_VALUES.map((value) => ({
        value,
        label: t(TERM_MAP[value]),
      })),
    [t]
  );

  const fetchData = async () => {
    setLoading(true);
    const [invRes, cliRes, freeRes] = await Promise.all([
      getInvoices(),
      getClients(),
      getFreelancerProfile(),
    ]);
    if (invRes.success) setInvoices(invRes.data || []);
    else toast.error(t("invoices.load_error"));
    if (cliRes.success) setClients(cliRes.data || []);
    else toast.error(t("invoices.load_clients_error"));
    if (freeRes.success) setFreelancer(freeRes.data || { name: "", nit: "", email: "", phone: "" });
    else toast.error(t("invoices.load_profile_error"));
    setLoading(false);
  };

  useEffect(() => {
    refreshLimits();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.id.toLowerCase().includes(q) ||
      inv.client.toLowerCase().includes(q) ||
      inv.concept.toLowerCase().includes(q)
    );
  });

  const selectedClient = clients.find(
    (c) => c.id.toString() === selectedClientId
  );

  const baseVal = Number(valorBase) || 0;
  const ivaRate = Number(ivaPorcentaje) / 100;
  const ivaVal = baseVal * ivaRate;
  const retRate =
    (retencionOptions.find((r) => r.value === tipoRetencion)?.rate ?? 0) / 100;
  const retVal = baseVal * retRate;
  const totalVal = baseVal + ivaVal - retVal;

  const openCreate = () => {
    if (isFree && monthlyInvoiceCount >= 3) {
      setUpgradeModalOpen(true);
      return;
    }
    resetForm();
    setStep(0);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setAiPrompt("");
    setAiLoading(false);
    setAiResult(null);
    setSelectedClientId("");
    setConcepto("");
    setDescripcion("");
    setValorBase("");
    setPlazoPago("30");
    setFechaEmision(todayStr());
    setFechaVencimiento(dueDateFromPlazo("30"));
    setIvaPorcentaje("19");
    setTipoRetencion("ninguna");
  };

  const handlePlazoChange = (v: string) => {
    setPlazoPago(v);
    setFechaVencimiento(dueDateFromPlazo(v));
  };

  const handleGenerateAI = () => {
    toast.info(t("invoices.ai_coming_soon"));
  };

  const handleUseAIData = () => {
    if (!aiResult) return;
    setConcepto(aiResult.concepto);
    setDescripcion(aiResult.descripcion);
    setValorBase(aiResult.valorSugerido.toString());
    setAiResult(null);
    setAiPrompt("");
    setStep(1);
  };

  const handleDiscardAI = () => {
    setAiResult(null);
    setAiPrompt("");
  };

  const canGoNext = () => {
    if (step === 0) return !!selectedClientId;
    if (step === 1) return concepto.trim() && valorBase && Number(valorBase) > 0;
    return true;
  };

  const getClientById = (id: number) =>
    clients.find((c) => c.id === id);

  const handleFinalizar = async () => {
    if (!selectedClient || !concepto.trim() || !valorBase) return;
    setSubmitting(true);
    const selectedRet = retencionOptions.find((r) => r.value === tipoRetencion);
    const r = await createInvoice({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      concepto,
      descripcion,
      valorBase: baseVal,
      ivaPorcentaje: Number(ivaPorcentaje),
      tipoRetencion,
      retRate: (selectedRet?.rate ?? 0) / 100,
      fechaEmision,
      fechaVencimiento,
      priority: "medium",
    });
    setSubmitting(false);
    if (r.success) {
      toast.success(t("invoices.create_success"));
      if (r.data) setInvoices((prev) => [r.data!, ...prev]);
      setDialogOpen(false);
      resetForm();
      refreshLimits();
    } else {
      toast.error(r.error || t("invoices.create_error"));
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    const html = generateInvoiceHtml(invoice, freelancer);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cuenta_${invoice.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("invoices.download_success"));
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    const email = freelancer.email || "";
    if (!email) {
      toast.error(t("common.email_not_configured"));
      return;
    }
    const { mailtoUrl } = await sendInvoiceEmail(email, invoice, freelancer);
    window.open(mailtoUrl, "_blank");
    toast.success(t("common.email_opened"));
  };

  const handleDownloadPreview = () => {
    if (!selectedClientId || !concepto) {
      toast.error(t("invoices.preview_download_error"));
      return;
    }
    const previewInvoice: Invoice = {
      id: "VISTA-PREVIA",
      client: clients.find((c) => c.id === Number(selectedClientId))?.name || t("invoices.col_client"),
      clientId: Number(selectedClientId),
      date: fechaEmision,
      value: totalVal,
      status: "pending",
      concept: concepto,
      priority: "medium",
      description: descripcion,
      subtotal: baseVal,
      taxVal: ivaVal,
      retVal,
      total: totalVal,
    };
    handleDownloadInvoice(previewInvoice);
  };

  const handleSendPreview = () => {
    const email = freelancer.email || "";
    if (!email) {
      toast.error(t("common.email_not_configured"));
      return;
    }
    const clientName = clients.find((c) => c.id === Number(selectedClientId))?.name || t("invoices.col_client");
    const previewInvoice: Invoice = {
      id: "VISTA-PREVIA",
      client: clientName,
      clientId: Number(selectedClientId),
      date: fechaEmision,
      value: totalVal,
      status: "pending",
      concept: concepto,
      priority: "medium",
      description: descripcion,
      subtotal: baseVal,
      taxVal: ivaVal,
      retVal,
      total: totalVal,
    };
    handleSendInvoice(previewInvoice);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("invoices.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("invoices.count", { n: invoices.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="size-4" />
            {t("invoices.filters")}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t("invoices.new")}
          </Button>
        </div>
      </div>

      {isFree && (
        <div className="flex items-center justify-between rounded-lg border bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 text-sm">
          <span className="text-amber-800 dark:text-amber-200">
            {t("invoices.free_banner", { n: monthlyInvoiceCount })}
          </span>
          <Button
            variant="link"
            size="sm"
            className="text-amber-700 dark:text-amber-300 font-semibold"
            onClick={() => setUpgradeModalOpen(true)}
          >
            {t("common.upgrade")}
          </Button>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t("invoices.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("invoices.col_number")}</TableHead>
              <TableHead>{t("invoices.col_client")}</TableHead>
              <TableHead>{t("invoices.col_date")}</TableHead>
              <TableHead className="text-right">{t("invoices.col_value")}</TableHead>
              <TableHead>{t("invoices.col_status")}</TableHead>
              <TableHead>{t("invoices.col_priority")}</TableHead>
              <TableHead className="w-[120px]">{t("invoices.col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => {
              const client = getClientById(invoice.clientId);
              const statusBadge = getStatusBadge(invoice.status, t);
              const priorityBadge = getPriorityBadge(invoice.priority, t);
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono font-medium text-sm">
                    {invoice.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        style={{ backgroundColor: (client?.color || "#888") + "20" }}
                      >
                        <AvatarFallback
                          style={{ color: client?.color || "#888" }}
                          className="font-medium"
                        >
                          {client?.initials || invoice.client.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{invoice.client}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(invoice.date)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {fmtCurrency(invoice.value)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        statusBadge?.color
                      )}
                    >
                      {statusBadge?.label || invoice.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        priorityBadge?.color
                      )}
                    >
                      {priorityBadge?.label || invoice.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon-xs" title={t("common.view")} onClick={() => handleViewInvoice(invoice)}>
                        <Eye className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" title={t("common.download")} onClick={() => handleDownloadInvoice(invoice)}>
                        <FileDown className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" title={t("common.send")} onClick={() => handleSendInvoice(invoice)}>
                        <Mail className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredInvoices.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("invoices.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>{t("invoices.dialog_title")}</DialogTitle>
          </DialogHeader>

          {isFree ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-5 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("invoices.ai_upsell_title")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("invoices.ai_upsell_desc")}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setUpgradeModalOpen(true)}
              >
                {t("common.upgrade")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="size-4 text-purple-500" />
                {t("invoices.ai_title")}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("invoices.ai_placeholder")}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1"
                  disabled={aiLoading}
                />
                <Button
                  variant="secondary"
                  onClick={handleGenerateAI}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="shrink-0"
                >
                  {aiLoading ? (
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block size-1.5 rounded-full bg-current animate-pulse"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="inline-block size-1.5 rounded-full bg-current animate-pulse"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="inline-block size-1.5 rounded-full bg-current animate-pulse"
                        style={{ animationDelay: "300ms" }}
                      />
                    </span>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      {t("invoices.ai_generate")}
                    </>
                  )}
                </Button>
              </div>

              {aiResult && (
                <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t("invoices.ai_concept")}</span>
                      <span className="text-sm font-medium">{aiResult.concepto}</span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {fmtCurrency(aiResult.valorSugerido)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {aiResult.descripcion}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Button size="xs" onClick={handleUseAIData}>
                      <Check className="size-3" />
                      {t("invoices.ai_use_data")}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={handleDiscardAI}
                    >
                      <Trash2 className="size-3" />
                      {t("invoices.ai_discard")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full text-[10px] font-semibold",
                      i === step
                        ? "bg-primary-foreground text-primary"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </span>
                  {label}
                </button>
                {i < steps.length - 1 && (
                  <ChevronRight className="size-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 min-h-[200px]">
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>{t("invoices.field_client")}</Label>
                  <Select
                    value={selectedClientId}
                    onValueChange={(v) => v && setSelectedClientId(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("invoices.field_search_client")} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem
                          key={client.id}
                          value={client.id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar
                              size="sm"
                              style={{
                                backgroundColor: client.color + "20",
                              }}
                            >
                              <AvatarFallback
                                style={{ color: client.color }}
                                className="font-medium"
                              >
                                {client.initials}
                              </AvatarFallback>
                            </Avatar>
                            {client.name} — {client.company}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClient && (
                  <div className="rounded-lg border bg-muted/30 p-3 flex items-start gap-3">
                    <Avatar
                      size="lg"
                      style={{ backgroundColor: selectedClient.color + "20" }}
                    >
                      <AvatarFallback
                        style={{ color: selectedClient.color }}
                        className="font-medium"
                      >
                        {selectedClient.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 text-sm">
                      <span className="font-medium">{selectedClient.name}</span>
                      <span className="text-muted-foreground">
                        {selectedClient.company}
                      </span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {t("invoices.field_nit")}: {selectedClient.nit}
                      </span>
                      <span className="text-muted-foreground">
                        {selectedClient.email} · {selectedClient.phone}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="concepto">{t("invoices.field_concept")}</Label>
                  <Input
                    id="concepto"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder={t("invoices.field_concept_placeholder")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="descripcion">{t("invoices.field_description")}</Label>
                  <Textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder={t("invoices.field_description_placeholder")}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="valorBase">{t("invoices.field_base_value")}</Label>
                    <Input
                      id="valorBase"
                      type="number"
                      value={valorBase}
                      onChange={(e) => setValorBase(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>{t("invoices.field_payment_term")}</Label>
                    <Select value={plazoPago} onValueChange={(v) => v && handlePlazoChange(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plazoOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fechaEmision">{t("invoices.field_issue_date")}</Label>
                    <Input
                      id="fechaEmision"
                      type="date"
                      value={fechaEmision}
                      onChange={(e) => setFechaEmision(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fechaVencimiento">
                      {t("invoices.field_due_date")}
                    </Label>
                    <Input
                      id="fechaVencimiento"
                      type="date"
                      value={fechaVencimiento}
                      onChange={(e) => setFechaVencimiento(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="iva">{t("invoices.field_iva")}</Label>
                    <Input
                      id="iva"
                      type="number"
                      value={ivaPorcentaje}
                      onChange={(e) => setIvaPorcentaje(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>{t("invoices.field_retention")}</Label>
                    <Select
                      value={tipoRetencion}
                      onValueChange={(v) =>
                        setTipoRetencion(v as WithholdingType)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {retencionOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <h4 className="text-sm font-medium mb-2">
                    {t("invoices.calc_title")}
                  </h4>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("invoices.calc_subtotal")}</span>
                      <span className="font-medium">{fmtCurrency(baseVal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("invoices.calc_iva", { n: ivaPorcentaje })}
                      </span>
                      <span className="font-medium">
                        {fmtCurrency(ivaVal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("invoices.calc_retention", {
                          label: tipoRetencion === "ninguna"
                            ? "0%"
                            : (retencionOptions.find((r) => r.value === tipoRetencion)?.label.split(" ").pop() ?? ""),
                        })}
                      </span>
                      <span className="font-medium text-red-600">
                        -{fmtCurrency(retVal)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5 mt-0.5 font-semibold">
                      <span>{t("invoices.calc_total")}</span>
                      <span>{fmtCurrency(totalVal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border bg-white shadow-sm text-xs overflow-hidden max-h-[600px] overflow-y-auto">
                  <div className="border-b">
                    <div className="grid grid-cols-2">
                      <div className="bg-slate-800 text-white p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center font-bold text-sm">
                            {freelancer.name
                              ? freelancer.name.split(" ").map((n) => n[0]).join("")
                              : "FR"}
                          </div>
                          <div>
                            <p className="font-semibold text-sm leading-tight">
                              {freelancer.company || freelancer.name || "Freelancer"}
                            </p>
                            <p className="text-white/70 text-[10px]">
                              {freelancer.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-700 text-white p-3 flex flex-col justify-center">
                        <p className="font-bold text-lg leading-tight">{t("invoices.preview_title")}</p>
                        <p className="text-white/70 text-[10px]">{t("invoices.preview_subtitle")}</p>
                        <p className="text-white/70 text-[10px]">{t("invoices.preview_consecutive", { n: invoices.length + 1, year: new Date().getFullYear() })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 border-b">
                    <div className="p-3 border-r">
                      <p className="font-semibold text-[10px] uppercase text-slate-500 mb-1">
                        {t("invoices.preview_from")}
                      </p>
                      <p className="font-medium">{freelancer.name}</p>
                      <p className="text-slate-600">{t("invoices.field_nit")}: {freelancer.nit}</p>
                      <p className="text-slate-600">{t("invoices.preview_phone")}: {freelancer.phone}</p>
                      <p className="text-slate-600">{freelancer.address || `${t("invoices.preview_city")}: ${t("invoices.preview_colombia")}`}</p>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-[10px] uppercase text-slate-500 mb-1">
                        {t("invoices.preview_to")}
                      </p>
                      {selectedClient && (
                        <>
                          <p className="font-medium">{selectedClient.name}</p>
                          <p className="text-slate-600">{selectedClient.company}</p>
                          <p className="text-slate-600">{t("invoices.field_nit")}: {selectedClient.nit}</p>
                          <p className="text-slate-600">{t("invoices.col_date")}: {formatDate(fechaEmision)}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 border-b bg-slate-50">
                    <p className="font-medium">
                      {t("invoices.preview_owes", { name: freelancer.name || "Freelancer", amount: fmtCurrency(totalVal) })}
                    </p>
                    <p className="mt-1">{concepto}</p>
                  </div>

                  <div className="p-3">
                    <table className="w-full text-xs border">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="text-left py-1.5 px-2 font-semibold text-slate-700 border-r w-8">{t("invoices.preview_item")}</th>
                          <th className="text-left py-1.5 px-2 font-semibold text-slate-700 border-r">{t("invoices.preview_item_desc")}</th>
                          <th className="text-center py-1.5 px-2 font-semibold text-slate-700 border-r w-12">{t("invoices.preview_qty")}</th>
                          <th className="text-right py-1.5 px-2 font-semibold text-slate-700 w-24">{t("invoices.preview_total_value")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-2 text-center border-r">1</td>
                          <td className="py-2 px-2 border-r">
                            <p className="font-medium text-slate-800">{concepto}</p>
                            {descripcion && (
                              <p className="text-slate-500 text-[10px] mt-0.5 line-clamp-2">
                                {descripcion}
                              </p>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center border-r">1</td>
                          <td className="py-2 px-2 text-right font-medium">
                            {fmtCurrency(baseVal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="px-3 pb-3">
                    <div className="flex justify-end">
                      <div className="w-56 text-xs">
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-slate-600">{t("invoices.preview_subtotal_label")}</span>
                          <span>{fmtCurrency(baseVal)}</span>
                        </div>
                        {ivaVal > 0 && (
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-slate-600">{t("invoices.preview_iva_label", { n: ivaPorcentaje })}</span>
                            <span>{fmtCurrency(ivaVal)}</span>
                          </div>
                        )}
                        {retVal > 0 && (
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-slate-600">{t("invoices.preview_retention_label")}</span>
                            <span className="text-red-600">-{fmtCurrency(retVal)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 bg-slate-800 text-white px-2 -mx-2 font-semibold">
                          <span>{t("invoices.preview_total_label")}</span>
                          <span>{fmtCurrency(totalVal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t border-b bg-slate-50">
                    <p className="font-semibold text-[10px] uppercase text-slate-500 mb-1.5">
                      {t("invoices.preview_bank_info")}
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500">{t("invoices.preview_bank")}</p>
                        <p className="font-medium">{freelancer.bank || t("invoices.preview_na")}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">{t("invoices.preview_account_type")}</p>
                        <p className="font-medium">
                          {freelancer.accountType === "ahorros"
                            ? t("invoices.preview_savings")
                            : freelancer.accountType === "corriente"
                            ? t("invoices.preview_checking")
                            : t("invoices.preview_na")}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">{t("invoices.preview_account_number")}</p>
                        <p className="font-medium font-mono">{freelancer.accountNumber || t("invoices.preview_na")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-b">
                    <p className="text-[9px] text-slate-500 leading-tight italic">
                      {t("invoices.preview_legal")}
                    </p>
                  </div>

                  <div className="p-4 flex justify-end">
                    <div className="w-56 text-center">
                      <div className="border-b border-slate-300 h-10 mb-1"></div>
                      <p className="text-[10px] text-slate-600">
                        {freelancer.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        C.C. {freelancer.nit}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {t("invoices.preview_provider")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadPreview}>
                    <FileDown className="size-4" />
                    {t("invoices.preview_generate_pdf")}
                  </Button>
                  <Button size="sm" onClick={handleSendPreview}>
                    <Mail className="size-4" />
                    {t("invoices.preview_send_email")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" />}
            >
              {t("common.cancel")}
            </DialogClose>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  {t("common.back")}
                </Button>
              )}
              {step < 3 && (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canGoNext()}
                >
                  {t("common.next")}
                </Button>
              )}
              {step === 3 && (
                <Button onClick={handleFinalizar} disabled={submitting}>
                  {submitting ? t("common.creating") : t("common.finish")}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("invoices.view_title", { id: selectedInvoice?.id || "" })}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div
              className="text-[13px]"
              dangerouslySetInnerHTML={{
                __html: generateInvoiceHtml(selectedInvoice, freelancer),
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        reason="invoice_limit"
      />
    </div>
  );
}
