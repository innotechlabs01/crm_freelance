"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  PenLine,
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
  STATUS_BADGE,
  PRIORITY_BADGE,
} from "@/lib/mock-data";
import { getClients } from "@/app/actions/clients";
import { getInvoices, createInvoice } from "@/app/actions/invoices";
import { getFreelancerProfile } from "@/app/actions/freelancer";
import type { WithholdingType, Invoice, Client, Freelancer } from "@/types";

const STEPS = ["Cliente", "Servicio", "Impuestos", "Vista Previa"];

const plazoOptions = [
  { value: "15", label: "15 días" },
  { value: "30", label: "30 días" },
  { value: "45", label: "45 días" },
  { value: "60", label: "60 días" },
];

const retencionOptions: { value: WithholdingType; label: string; rate: number }[] = [
  { value: "ninguna", label: "Ninguna", rate: 0 },
  { value: "iva", label: "IVA 15%", rate: 15 },
  { value: "ica", label: "ICA 0.96%", rate: 0.96 },
  { value: "renta", label: "Renta 11%", rate: 11 },
];

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
  const { isFree, monthlyInvoiceCount, refreshLimits } = useUser();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Data state
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

  // AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    concepto: string;
    descripcion: string;
    valorSugerido: number;
  } | null>(null);

  // Form state
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

  const fetchData = async () => {
    setLoading(true);
    const [invRes, cliRes, freeRes] = await Promise.all([
      getInvoices(),
      getClients(),
      getFreelancerProfile(),
    ]);
    if (invRes.success) setInvoices(invRes.data || []);
    else toast.error(invRes.error || "Error al cargar facturas");
    if (cliRes.success) setClients(cliRes.data || []);
    else toast.error(cliRes.error || "Error al cargar clientes");
    if (freeRes.success) setFreelancer(freeRes.data || { name: "", nit: "", email: "", phone: "" });
    else toast.error(freeRes.error || "Error al cargar perfil");
    setLoading(false);
  };

  useEffect(() => {
    refreshLimits();
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    toast.info("La generación con IA estará disponible próximamente.");
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
      toast.success("Cuenta de cobro creada");
      if (r.data) setInvoices((prev) => [r.data!, ...prev]);
      setDialogOpen(false);
      resetForm();
      refreshLimits();
    } else {
      toast.error(r.error || "Error al crear cuenta de cobro");
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Cuentas de Cobro
          </h1>
          <p className="text-sm text-muted-foreground">
            {invoices.length} cuentas registradas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="size-4" />
            Filtros
          </Button>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* Upgrade Banner */}
      {isFree && (
        <div className="flex items-center justify-between rounded-lg border bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 text-sm">
          <span className="text-amber-800 dark:text-amber-200">
            Plan Gratuito — {monthlyInvoiceCount}/3 cuentas este mes
          </span>
          <Button
            variant="link"
            size="sm"
            className="text-amber-700 dark:text-amber-300 font-semibold"
            onClick={() => setUpgradeModalOpen(true)}
          >
            Actualizar
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número, cliente o concepto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead className="w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => {
              const client = getClientById(invoice.clientId);
              const statusBadge = STATUS_BADGE[invoice.status];
              const priorityBadge = PRIORITY_BADGE[invoice.priority];
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
                      <Button variant="ghost" size="icon-xs" title="Ver">
                        <Eye className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" title="Editar">
                        <PenLine className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" title="Descargar">
                        <FileDown className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" title="Enviar">
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
                  No se encontraron cuentas de cobro
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Generator Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Generar Cuenta de Cobro</DialogTitle>
          </DialogHeader>

          {/* AI Panel */}
          {isFree ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-5 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">La generación con IA requiere un plan Profesional</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Actualiza tu plan para desbloquear el asistente IA y generar cuentas de cobro automáticamente.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setUpgradeModalOpen(true)}
              >
                Actualizar
              </Button>
            </div>
          ) : (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="size-4 text-purple-500" />
              Asistente IA
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Describe el trabajo realizado..."
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
                    Generar con IA
                  </>
                )}
              </Button>
            </div>

            {/* AI Result Card */}
            {aiResult && (
              <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Concepto</span>
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
                    Usar estos datos
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleDiscardAI}
                  >
                    <Trash2 className="size-3" />
                    Descartar
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center gap-1">
            {STEPS.map((label, i) => (
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
                {i < STEPS.length - 1 && (
                  <ChevronRight className="size-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="flex flex-col gap-4 min-h-[200px]">
            {/* Step 0: Client Selection */}
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Seleccionar Cliente</Label>
                  <Select
                    value={selectedClientId}
                    onValueChange={(v) => v && setSelectedClientId(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Buscar cliente..." />
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
                        NIT: {selectedClient.nit}
                      </span>
                      <span className="text-muted-foreground">
                        {selectedClient.email} · {selectedClient.phone}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Service Info */}
            {step === 1 && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="concepto">Concepto</Label>
                  <Input
                    id="concepto"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Ej. Desarrollo web plataforma e-commerce"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Detalle del servicio prestado..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="valorBase">Valor Base</Label>
                    <Input
                      id="valorBase"
                      type="number"
                      value={valorBase}
                      onChange={(e) => setValorBase(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Plazo de Pago</Label>
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
                    <Label htmlFor="fechaEmision">Fecha de Emisión</Label>
                    <Input
                      id="fechaEmision"
                      type="date"
                      value={fechaEmision}
                      onChange={(e) => setFechaEmision(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fechaVencimiento">
                      Fecha de Vencimiento
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

            {/* Step 2: Taxes */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="iva">IVA %</Label>
                    <Input
                      id="iva"
                      type="number"
                      value={ivaPorcentaje}
                      onChange={(e) => setIvaPorcentaje(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Tipo de Retención</Label>
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

                {/* Calculation Summary */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <h4 className="text-sm font-medium mb-2">
                    Resumen de Cálculo
                  </h4>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{fmtCurrency(baseVal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        IVA ({ivaPorcentaje}%)
                      </span>
                      <span className="font-medium">
                        {fmtCurrency(ivaVal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Retención ({tipoRetencion === "ninguna" ? "0%" : retencionOptions.find((r) => r.value === tipoRetencion)?.label.split(" ").pop()})
                      </span>
                      <span className="font-medium text-red-600">
                        -{fmtCurrency(retVal)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5 mt-0.5 font-semibold">
                      <span>Total</span>
                      <span>{fmtCurrency(totalVal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                {/* PDF-like preview card */}
                <div className="rounded-lg border bg-white shadow-sm text-xs overflow-hidden max-h-[600px] overflow-y-auto">
                  {/* Header */}
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
                        <p className="font-bold text-lg leading-tight">CUENTA DE COBRO</p>
                        <p className="text-white/70 text-[10px]">Documento equivalente a la factura (Art. 616-1 E.T.)</p>
                        <p className="text-white/70 text-[10px]">Consecutivo N° {invoices.length + 1}-{(new Date()).getFullYear()}</p>
                      </div>
                    </div>
                  </div>

                  {/* De / A */}
                  <div className="grid grid-cols-2 border-b">
                    <div className="p-3 border-r">
                      <p className="font-semibold text-[10px] uppercase text-slate-500 mb-1">
                        De (Prestador del Servicio)
                      </p>
                      <p className="font-medium">{freelancer.name}</p>
                      <p className="text-slate-600">CC / NIT: {freelancer.nit}</p>
                      <p className="text-slate-600">Celular: {freelancer.phone}</p>
                      <p className="text-slate-600">{freelancer.address || "Ciudad: Colombia"}</p>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-[10px] uppercase text-slate-500 mb-1">
                        A Favor de (Cliente)
                      </p>
                      {selectedClient && (
                        <>
                          <p className="font-medium">{selectedClient.name}</p>
                          <p className="text-slate-600">{selectedClient.company}</p>
                          <p className="text-slate-600">NIT: {selectedClient.nit}</p>
                          <p className="text-slate-600">Fecha: {formatDate(fechaEmision)}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Debe a / Concepto */}
                  <div className="p-3 border-b bg-slate-50">
                    <p className="font-medium">
                      DEBE A: <span className="font-semibold">{freelancer.name || "Freelancer"}</span>, la suma de{" "}
                      <span className="font-semibold">{fmtCurrency(totalVal)}</span>, por concepto de:{" "}
                    </p>
                    <p className="mt-1">{concepto}</p>
                  </div>

                  {/* Tabla de items */}
                  <div className="p-3">
                    <table className="w-full text-xs border">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="text-left py-1.5 px-2 font-semibold text-slate-700 border-r w-8">Ítem</th>
                          <th className="text-left py-1.5 px-2 font-semibold text-slate-700 border-r">Descripción del Servicio Prestado</th>
                          <th className="text-center py-1.5 px-2 font-semibold text-slate-700 border-r w-12">Cant.</th>
                          <th className="text-right py-1.5 px-2 font-semibold text-slate-700 w-24">Valor Total</th>
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

                  {/* Totales */}
                  <div className="px-3 pb-3">
                    <div className="flex justify-end">
                      <div className="w-56 text-xs">
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-slate-600">Subtotal:</span>
                          <span>{fmtCurrency(baseVal)}</span>
                        </div>
                        {ivaVal > 0 && (
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-slate-600">IVA ({ivaPorcentaje}%):</span>
                            <span>{fmtCurrency(ivaVal)}</span>
                          </div>
                        )}
                        {retVal > 0 && (
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-slate-600">Retención:</span>
                            <span className="text-red-600">-{fmtCurrency(retVal)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 bg-slate-800 text-white px-2 -mx-2 font-semibold">
                          <span>VALOR TOTAL A PAGAR:</span>
                          <span>{fmtCurrency(totalVal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Datos bancarios */}
                  <div className="p-3 border-t border-b bg-slate-50">
                    <p className="font-semibold text-[10px] uppercase text-slate-500 mb-1.5">
                      Información Bancaria para Transferencia
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500">Entidad Financiera</p>
                        <p className="font-medium">{freelancer.bank || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Tipo de Cuenta</p>
                        <p className="font-medium">
                          {freelancer.accountType === "ahorros"
                            ? "Cuenta de Ahorros"
                            : freelancer.accountType === "corriente"
                            ? "Cuenta Corriente"
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Número de Cuenta</p>
                        <p className="font-medium font-mono">{freelancer.accountNumber || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nota legal */}
                  <div className="p-3 border-b">
                    <p className="text-[9px] text-slate-500 leading-tight italic">
                      Nota: Esta cuenta de cobro se asimila en sus efectos legales a la letra de cambio (Artículo 774 y siguientes del Código de Comercio). Manifiesto bajo la gravedad del juramento que pertenezco al régimen de No Responsables del Impuesto sobre las Ventas (IVA) - anteriormente Régimen Simplificado (Art. 437 del Estatuto Tributario), y que las actividades aquí descritas corresponden a servicios profesionales independientes.
                    </p>
                  </div>

                  {/* Firma */}
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
                        Prestador del Servicio
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="size-4" />
                    Vista Previa
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileDown className="size-4" />
                    Generar PDF
                  </Button>
                  <Button size="sm">
                    <Mail className="size-4" />
                    Enviar por Correo
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" />}
            >
              Cancelar
            </DialogClose>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Anterior
                </Button>
              )}
              {step < 3 && (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canGoNext()}
                >
                  Siguiente
                </Button>
              )}
              {step === 3 && (
                <Button onClick={handleFinalizar} disabled={submitting}>
                  {submitting ? "Creando..." : "Finalizar"}
                </Button>
              )}
            </div>
          </DialogFooter>
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
