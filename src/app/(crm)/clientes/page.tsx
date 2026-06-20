"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Loader2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtCurrency } from "@/lib/mock-data";
import {
  getClients,
  createClient,
  updateClient,
} from "@/app/actions/clients";
import { toast } from "sonner";
import type { Client, TaxType, AccountType } from "@/types";

type ClientFormData = Omit<Client, "id" | "totalInvoiced" | "status" | "initials" | "color">;

const emptyForm: ClientFormData = {
  name: "",
  company: "",
  nit: "",
  email: "",
  phone: "",
  address: "",
  taxType: "regimen-comun",
  bank: "",
  accountType: "ahorros",
  accountNumber: "",
  notes: "",
};

const taxTypeLabels: Record<TaxType, string> = {
  "regimen-comun": "Régimen Común",
  "regimen-simplificado": "Régimen Simplificado",
  "gran-contribuyente": "Gran Contribuyente",
};

const accountTypeLabels: Record<AccountType, string> = {
  ahorros: "Ahorros",
  corriente: "Corriente",
};

export default function ClientesPage() {
  const { isFree, clientCount, refreshLimits } = useUser();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(emptyForm);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const result = await getClients();
      if (result.success) {
        setClients(result.data || []);
      } else {
        toast.error(result.error || "Error al cargar clientes");
      }
    } catch {
      toast.error("Error al cargar clientes");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadClients();
      setLoading(false);
    };
    init();
    refreshLimits();
  }, [loadClients, refreshLimits]);

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.nit.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    if (isFree && clientCount >= 1) {
      setUpgradeModalOpen(true);
      return;
    }
    setEditingClient(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company,
      nit: client.nit,
      email: client.email,
      phone: client.phone,
      address: client.address || "",
      taxType: client.taxType,
      bank: client.bank || "",
      accountType: client.accountType || "ahorros",
      accountNumber: client.accountNumber || "",
      notes: client.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      if (editingClient) {
        const result = await updateClient(editingClient.id, formData);
        if (result.success) {
          toast.success("Cliente actualizado");
          setDialogOpen(false);
          setEditingClient(null);
          setFormData(emptyForm);
          await loadClients();
        } else {
          toast.error(result.error || "Error al actualizar cliente");
        }
      } else {
        const result = await createClient(formData);
        if (result.success) {
          toast.success("Cliente creado");
          setDialogOpen(false);
          setFormData(emptyForm);
          await loadClients();
          refreshLimits();
        } else {
          toast.error(result.error || "Error al crear cliente");
        }
      }
    } catch {
      toast.error("Error al guardar cliente");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof ClientFormData>(
    key: K,
    value: ClientFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} clientes registrados
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Upgrade Banner */}
      {isFree && (
        <div className="flex items-center justify-between rounded-lg border bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 text-sm">
          <span className="text-amber-800 dark:text-amber-200">
            Plan Gratuito — {clientCount}/1 clientes usados
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
          placeholder="Buscar por nombre, empresa o NIT..."
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
              <TableHead>Cliente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Total Facturado</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => openEdit(client)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar
                      size="sm"
                      style={{ backgroundColor: client.color + "20" }}
                    >
                      <AvatarFallback
                        style={{ color: client.color }}
                        className="font-medium"
                      >
                        {client.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{client.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.company}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {client.nit}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.email}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.phone}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {fmtCurrency(client.totalInvoiced)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={client.status === "active" ? "default" : "secondary"}
                  >
                    {client.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {/* Basic Info */}
            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium text-muted-foreground mb-1">
                Información Básica
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Ej. María García"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    placeholder="Ej. TechSolutions SAS"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nit">NIT/RUT</Label>
                  <Input
                    id="nit"
                    value={formData.nit}
                    onChange={(e) => updateField("nit", e.target.value)}
                    placeholder="901.123.456-7"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="correo@empresa.co"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Carrera 15 # 88-40"
                  />
                </div>
              </div>
            </fieldset>

            {/* Tax Info */}
            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium text-muted-foreground mb-1">
                Información Tributaria
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de Contribuyente</Label>
                  <Select
                    value={formData.taxType}
                    onValueChange={(v) => updateField("taxType", v as TaxType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regimen-comun">
                        {taxTypeLabels["regimen-comun"]}
                      </SelectItem>
                      <SelectItem value="regimen-simplificado">
                        {taxTypeLabels["regimen-simplificado"]}
                      </SelectItem>
                      <SelectItem value="gran-contribuyente">
                        {taxTypeLabels["gran-contribuyente"]}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Autoretenedor</Label>
                  <Select defaultValue="no">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="si">Sí</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            {/* Bank Info */}
            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium text-muted-foreground mb-1">
                Información Bancaria
              </legend>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bank">Banco</Label>
                <Input
                  id="bank"
                  value={formData.bank}
                  onChange={(e) => updateField("bank", e.target.value)}
                  placeholder="Ej. Bancolombia"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de Cuenta</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(v) =>
                      updateField("accountType", v as AccountType)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ahorros">
                        {accountTypeLabels.ahorros}
                      </SelectItem>
                      <SelectItem value="corriente">
                        {accountTypeLabels.corriente}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="accountNumber">Número de Cuenta</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      updateField("accountNumber", e.target.value)
                    }
                    placeholder="000-123456-78"
                  />
                </div>
              </div>
            </fieldset>

            {/* Notes */}
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-sm font-medium text-muted-foreground mb-1">
                Notas
              </legend>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Notas adicionales sobre el cliente..."
                rows={3}
              />
            </fieldset>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editingClient ? (
                "Guardar Cambios"
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        reason="client_limit"
      />
    </div>
  );
}
