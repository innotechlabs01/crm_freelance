"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/mock-data";
import {
  getFreelancerProfile,
  saveFreelancerProfile,
  getPaymentMethods,
  getNotificationPrefs,
  saveNotificationPrefs,
} from "@/app/actions/freelancer";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nit, setNit] = useState("");

  const [darkMode, setDarkMode] = useState(false);
  const [idioma, setIdioma] = useState("es");

  const [recordatorios, setRecordatorios] = useState(true);
  const [confirmacion, setConfirmacion] = useState(true);
  const [resumenSemanal, setResumenSemanal] = useState(false);
  const [actualizaciones, setActualizaciones] = useState(true);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

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
        toast.error("Error al cargar configuración");
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

  const userInitials = nombre ? getInitials(nombre) : "??";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1 animate-fade">
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Administra tu perfil, preferencias y configuración de la cuenta
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
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
                  Nombre Completo
                </label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre Completo"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="Correo Electrónico"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Teléfono
                </label>
                <Input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono"
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
                {savingProfile ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="animate-slide">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-muted-foreground" />
                <CardTitle>Preferencias</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Modo Oscuro</p>
                    <p className="text-xs text-muted-foreground">
                      Activar tema oscuro en la aplicación
                    </p>
                  </div>
                </div>
                <ToggleSwitch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Idioma</p>
                    <p className="text-xs text-muted-foreground">
                      Selecciona el idioma de la interfaz
                    </p>
                  </div>
                </div>
                <Select value={idioma} onValueChange={(v) => v && setIdioma(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Zona Horaria</p>
                    <p className="text-xs text-muted-foreground">
                      America/Bogota (GMT-5)
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Automática</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Banknote className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Moneda</p>
                    <p className="text-xs text-muted-foreground">
                      Peso Colombiano
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium">COP</span>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <CardTitle>Métodos de Pago</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
              {paymentMethods.map((method) => {
                const { icon: IconComponent, color } = getPaymentMethodIcon(method.name);
                return (
                  <div
                    key={method.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
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
                  </div>
                );
              })}
              {paymentMethods.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sin métodos de pago registrados
                </p>
              )}
              <Button variant="outline" className="w-full">
                <Plus className="mr-1.5 size-4" />
                Agregar Método de Pago
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-slide">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <CardTitle>Notificaciones</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Recordatorios de pago</p>
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
                  <p className="text-sm font-medium">Confirmación de pago</p>
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
                  <p className="text-sm font-medium">Resumen semanal</p>
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
                    Actualizaciones del sistema
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
