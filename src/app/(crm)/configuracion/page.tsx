"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  Settings,
  User,
  Bell,
  CreditCard,
  Moon,
  Globe,
  Clock,
  Banknote,
  SmartphoneNfc,
  Building2,
  Plus,
  Landmark,
  Crown,
  Sparkles,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/mock-data";
import {
  getFreelancerProfile,
  saveFreelancerProfile,
  getPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  getNotificationPrefs,
  saveNotificationPrefs,
} from "@/app/actions/freelancer";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

function getPlanBadgeStyle(planName: string) {
  switch (planName.toLowerCase()) {
    case "free":
      return "bg-muted text-muted-foreground border-border";
    case "professional":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "enterprise":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
    default:
      return "";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return { label: "Activo", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" };
    case "trialing":
      return { label: "Prueba", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" };
    case "past_due":
      return { label: "Pago Pendiente", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
    case "canceled":
      return { label: "Cancelado", className: "bg-muted text-muted-foreground" };
    case "expired":
      return { label: "Expirado", className: "bg-muted text-muted-foreground" };
    default:
      return { label: status, className: "" };
  }
}

type PaymentMethod = {
  id: string;
  name: string;
  bank: string;
  accountType: string;
  accountNumber: string;
  phone: string;
};

function ToggleSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        checked ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

function getPaymentMethodIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("nequi")) {
    return { icon: SmartphoneNfc, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" };
  }
  if (lower.includes("daviplata")) {
    return { icon: Landmark, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  }
  return { icon: Building2, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
}

function getPaymentMethodDescription(method: PaymentMethod): string {
  if (method.phone) return method.phone;
  if (method.accountType && method.accountNumber) {
    const typeLabel = method.accountType === "ahorros" ? "Ahorros" : "Corriente";
    return `Cuenta de ${typeLabel} — ${method.accountNumber}`;
  }
  return method.accountNumber || "";
}

export default function ConfiguracionPage() {
  const { plan, subscription, isFree, refreshLimits } = useUser();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nit, setNit] = useState("");

  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setDarkMode(theme === "dark");
  }, [theme]);

  const [recordatorios, setRecordatorios] = useState(true);
  const [confirmacion, setConfirmacion] = useState(true);
  const [resumenSemanal, setResumenSemanal] = useState(false);
  const [actualizaciones, setActualizaciones] = useState(true);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Payment method dialog
  const [pmDialogOpen, setPmDialogOpen] = useState(false);
  const [pmName, setPmName] = useState("");
  const [pmBank, setPmBank] = useState("");
  const [pmAccountType, setPmAccountType] = useState("ahorros");
  const [pmAccountNumber, setPmAccountNumber] = useState("");
  const [pmPhone, setPmPhone] = useState("");
  const [pmSaving, setPmSaving] = useState(false);

  const handleAddPaymentMethod = async () => {
    if (!pmName.trim()) {
      toast.error("El nombre del metodo es obligatorio");
      return;
    }
    setPmSaving(true);
    const res = await createPaymentMethod({
      name: pmName,
      bank: pmBank,
      accountType: pmAccountType,
      accountNumber: pmAccountNumber,
      phone: pmPhone,
    });
    setPmSaving(false);
    if (res.success && res.data) {
      setPaymentMethods((prev) => [...prev, res.data!]);
      setPmDialogOpen(false);
      resetPmForm();
      toast.success("Metodo de pago agregado");
    } else {
      toast.error(res.error || "Error al agregar metodo de pago");
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    const res = await deletePaymentMethod(id);
    if (res.success) {
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success("Metodo de pago eliminado");
    } else {
      toast.error(res.error || "Error al eliminar metodo de pago");
    }
  };

  const resetPmForm = () => {
    setPmName("");
    setPmBank("");
    setPmAccountType("ahorros");
    setPmAccountNumber("");
    setPmPhone("");
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, methodsRes, prefsRes] = await Promise.all([
          getFreelancerProfile(),
          getPaymentMethods(),
          getNotificationPrefs(),
        ]);

        if (profileRes.success && profileRes.data) {
          setNombre(profileRes.data.name);
          setCorreo(profileRes.data.email);
          setTelefono(profileRes.data.phone);
          setNit(profileRes.data.nit);
        }

        if (methodsRes.success && methodsRes.data) {
          setPaymentMethods(methodsRes.data);
        }

        if (prefsRes.success && prefsRes.data) {
          setRecordatorios(prefsRes.data.paymentReminders);
          setConfirmacion(prefsRes.data.paymentConfirmations);
          setResumenSemanal(prefsRes.data.weeklySummary);
          setActualizaciones(prefsRes.data.systemUpdates);
        }
      } catch {
        toast.error("Error al cargar configuracion");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const res = await saveFreelancerProfile({
        name: nombre,
        email: correo,
        phone: telefono,
        nit,
      });
      if (res.success) {
        toast.success("Perfil guardado correctamente");
      } else {
        toast.error(res.error || "Error al guardar perfil");
      }
    } catch {
      toast.error("Error al guardar perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleTogglePref(
    key: "recordatorios" | "confirmacion" | "resumenSemanal" | "actualizaciones",
    value: boolean,
  ) {
    if (key === "recordatorios") setRecordatorios(value);
    if (key === "confirmacion") setConfirmacion(value);
    if (key === "resumenSemanal") setResumenSemanal(value);
    if (key === "actualizaciones") setActualizaciones(value);

    try {
      const res = await saveNotificationPrefs({
        paymentReminders: key === "recordatorios" ? value : recordatorios,
        paymentConfirmations: key === "confirmacion" ? value : confirmacion,
        weeklySummary: key === "resumenSemanal" ? value : resumenSemanal,
        systemUpdates: key === "actualizaciones" ? value : actualizaciones,
      });
      if (!res.success) {
        toast.error(res.error || "Error al guardar preferencias");
      }
    } catch {
      toast.error("Error al guardar preferencias");
    }
  }

  async function handleUpgrade() {
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/paddle/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: "professional" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al crear la sesion de pago");
      }
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No se recibio la URL de pago");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la sesion de pago");
    } finally {
      setUpgradeLoading(false);
    }
  }

  async function handleOpenPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/paddle/portal");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al abrir el portal");
      }
      const { portalUrl } = await res.json();
      if (portalUrl) {
        window.open(portalUrl, "_blank");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al abrir el portal");
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/paddle/cancel", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al cancelar suscripcion");
      }
      toast.success("Suscripcion cancelada");
      setShowCancelConfirm(false);
      await refreshLimits();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cancelar suscripcion");
    } finally {
      setCancelLoading(false);
    }
  }

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "\u2014";
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  }

  function formatPrice(price: number): string {
    if (price === 0) return "Gratis";
    return `$${price.toFixed(2)} USD/mes`;
  }

  const statusBadge = getStatusBadge(subscription?.status || "inactive");
  const planName = plan?.display_name || "Free";
  const planPrice = plan?.price ?? 0;
  const planBadgeStyle = getPlanBadgeStyle(plan?.name || "free");
  const isPastDue = subscription?.status === "past_due";

  const userInitials = nombre ? getInitials(nombre) : "??";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1 animate-fade">
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuracion
        </h1>
        <p className="text-sm text-muted-foreground">
          Administra tu perfil, plan, preferencias y configuracion de la cuenta
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="animate-slide">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-muted-foreground" />
                <CardTitle>{t("settings.current_plan")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold">{planName}</span>
                  <Badge variant="outline" className={cn("text-[10px]", planBadgeStyle)}>
                    {plan?.name?.toUpperCase() || "FREE"}
                  </Badge>
                </div>
                <span className="text-lg font-bold tabular-nums">
                  {formatPrice(planPrice)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <Badge variant="outline" className={cn("text-[10px]", statusBadge.className)}>
                  {statusBadge.label}
                </Badge>
              </div>

              {subscription?.renewal_at && (
                <p className="text-sm text-muted-foreground">
                  Proxima renovacion: {formatDate(subscription.renewal_at)}
                </p>
              )}

              {isPastDue && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                  <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Tu pago esta pendiente. Actualiza tu metodo de pago para evitar la suspension del servicio.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {isFree ? (
                  <Button onClick={handleUpgrade} disabled={upgradeLoading}>
                    {upgradeLoading ? (
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 size-4" />
                    )}
                    Actualizar a Profesional
                  </Button>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={handleOpenPortal}
                        disabled={portalLoading}
                      >
                        {portalLoading ? (
                          <Loader2 className="mr-1.5 size-4 animate-spin" />
                        ) : (
                          <ExternalLink className="mr-1.5 size-4" />
                        )}
                        {t("settings.manage_billing")}
                      </Button>
                    </div>
                    {!showCancelConfirm ? (
                      <Button
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setShowCancelConfirm(true)}
                      >
                        Cancelar Suscripcion
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 p-3">
                        <p className="text-sm text-destructive">
                          Estas seguro? Perderas acceso a las funcionalidades premium.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleCancelSubscription}
                            disabled={cancelLoading}
                          >
                            {cancelLoading && <Loader2 className="mr-1.5 size-3 animate-spin" />}
                            Si, Cancelar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={cancelLoading}
                          >
                            No, Mantener
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar size="lg" className="size-14">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{nombre || "Sin nombre"}</CardTitle>
                  <CardDescription>{correo || "Sin correo"}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("settings.field_name")}
                </label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre Completo"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Correo Electronico
                </label>
                <Input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="Correo Electronico"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Telefono
                </label>
                <Input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Telefono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  NIT
                </label>
                <Input
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  placeholder="NIT"
                />
              </div>
              <Button
                className="mt-2 w-full"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                <User className="mr-1.5 size-4" />
                {savingProfile ? t("settings.saving") : t("settings.save_profile")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="animate-slide">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-muted-foreground" />
                <CardTitle>{t("settings.preferences")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("settings.dark_mode")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.dark_mode_desc")}
                    </p>
                  </div>
                </div>
                <ToggleSwitch checked={darkMode} onCheckedChange={(v) => { setDarkMode(v); setTheme(v ? "dark" : "light"); }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("settings.language")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.language_desc")}
                    </p>
                  </div>
                </div>
                <Select value={locale} onValueChange={(v) => { if (v) setLocale(v as "es" | "en"); }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Espanol</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("settings.timezone")}</p>
                    <p className="text-xs text-muted-foreground">
                      America/Bogota (GMT-5)
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Automatica</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Banknote className="size-4 text-muted-foreground" />
                  <div>
                     <p className="text-sm font-medium">{t("settings.currency")}</p>
                     <p className="text-xs text-muted-foreground">
                       {t("settings.currency_desc")}
                     </p>
                  </div>
                </div>
                <span className="text-xs font-medium">USD</span>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <CardTitle>{t("settings.payment_methods")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
              {paymentMethods.map((method) => {
                const { icon: IconComponent, color } = getPaymentMethodIcon(method.name);
                return (
                  <div
                    key={method.id}
                    className="flex items-center gap-3 rounded-lg border p-3 group"
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        color,
                      )}
                    >
                      <IconComponent className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{method.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getPaymentMethodDescription(method)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeletePaymentMethod(method.id)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                );
              })}
              {paymentMethods.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sin metodos de pago registrados
                </p>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPmDialogOpen(true)}
              >
                <Plus className="mr-1.5 size-4" />
                Agregar Metodo de Pago
              </Button>
            </CardContent>
          </Card>

          {/* Add Payment Method Dialog */}
          <Dialog open={pmDialogOpen} onOpenChange={setPmDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar Metodo de Pago</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pmName">Nombre del metodo</Label>
                  <Input
                    id="pmName"
                    placeholder="Ej. Nequi, Daviplata, Bancolombia"
                    value={pmName}
                    onChange={(e) => setPmName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pmBank">Banco</Label>
                  <Input
                    id="pmBank"
                    placeholder="Ej. Bancolombia"
                    value={pmBank}
                    onChange={(e) => setPmBank(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pmAccountType">Tipo de Cuenta</Label>
                  <Select value={pmAccountType} onValueChange={(v) => v && setPmAccountType(v)}>
                    <SelectTrigger id="pmAccountType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ahorros">Ahorros</SelectItem>
                      <SelectItem value="corriente">Corriente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pmAccountNumber">Numero de Cuenta / Telefono</Label>
                  <Input
                    id="pmAccountNumber"
                    placeholder="000-123456-78"
                    value={pmAccountNumber}
                    onChange={(e) => setPmAccountNumber(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pmPhone">Telefono (Nequi/Daviplata)</Label>
                  <Input
                    id="pmPhone"
                    placeholder="3001234567"
                    value={pmPhone}
                    onChange={(e) => setPmPhone(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline" />}
                  onClick={resetPmForm}
                >
                  Cancelar
                </DialogClose>
                <Button onClick={handleAddPaymentMethod} disabled={pmSaving}>
                  {pmSaving ? (
                    <>
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                      {t("settings.saving")}
                    </>
                  ) : (
                    "Agregar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="animate-slide">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <CardTitle>{t("settings.notifications")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("settings.notif_payment_reminders")}</p>
                  <p className="text-xs text-muted-foreground">
                    Recibe notificaciones antes de cada vencimiento
                  </p>
                </div>
                <ToggleSwitch
                  checked={recordatorios}
                  onCheckedChange={(v) => handleTogglePref("recordatorios", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Confirmacion de pago</p>
                  <p className="text-xs text-muted-foreground">
                    Notificar cuando un cliente realice un pago
                  </p>
                </div>
                <ToggleSwitch
                  checked={confirmacion}
                  onCheckedChange={(v) => handleTogglePref("confirmacion", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("settings.notif_weekly")}</p>
                  <p className="text-xs text-muted-foreground">
                    Recibe un resumen de actividad cada lunes
                  </p>
                </div>
                <ToggleSwitch
                  checked={resumenSemanal}
                  onCheckedChange={(v) => handleTogglePref("resumenSemanal", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t("settings.notif_system")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Noticias, mejoras y nuevas funcionalidades
                  </p>
                </div>
                <ToggleSwitch
                  checked={actualizaciones}
                  onCheckedChange={(v) => handleTogglePref("actualizaciones", v)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
