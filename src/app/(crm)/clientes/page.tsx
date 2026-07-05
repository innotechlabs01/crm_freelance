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
import { useLanguage } from "@/lib/i18n/LanguageProvider";
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

export default function ClientesPage() {
  const { t } = useLanguage();
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
        toast.error(result.error || t("clients.load_error"));
      }
    } catch {
      toast.error(t("clients.load_error"));
    }
  }, [t]);

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
      toast.error(t("clients.name_required"));
      return;
    }

    setSaving(true);
    try {
      if (editingClient) {
        const result = await updateClient(editingClient.id, formData);
        if (result.success) {
          toast.success(t("clients.update_success"));
          setDialogOpen(false);
          setEditingClient(null);
          setFormData(emptyForm);
          await loadClients();
        } else {
          toast.error(result.error || t("clients.update_error"));
        }
      } else {
        const result = await createClient(formData);
        if (result.success) {
          toast.success(t("clients.create_success"));
          setDialogOpen(false);
          setFormData(emptyForm);
          await loadClients();
          refreshLimits();
        } else {
          toast.error(result.error || t("clients.create_error"));
        }
      }
    } catch {
      toast.error(t("clients.save_error"));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("clients.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("clients.count", { n: clients.length })}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          {t("clients.new")}
        </Button>
      </div>

      {isFree && (
        <div className="flex items-center justify-between rounded-lg border bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 text-sm">
          <span className="text-amber-800 dark:text-amber-200">
            {t("clients.free_banner", { n: clientCount })}
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
          placeholder={t("clients.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("clients.col_name")}</TableHead>
              <TableHead>{t("clients.col_company")}</TableHead>
              <TableHead>{t("clients.col_nit")}</TableHead>
              <TableHead>{t("clients.col_email")}</TableHead>
              <TableHead>{t("clients.col_phone")}</TableHead>
              <TableHead className="text-right">{t("clients.col_invoiced")}</TableHead>
              <TableHead>{t("clients.col_status")}</TableHead>
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
                    {client.status === "active" ? t("clients.status_active") : t("clients.status_inactive")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("clients.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? t("clients.edit") : t("clients.new")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium text-muted-foreground mb-1">
                {t("clients.section_basic")}
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">{t("clients.field_name")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder={t("clients.field_name_ph")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="company">{t("clients.field_company")}</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    placeholder={t("clients.field_company_ph")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nit">{t("clients.field_nit")}</Label>
                  <Input
                    id="nit"
                    value={formData.nit}
                    onChange={(e) => updateField("nit", e.target.value)}
                    placeholder={t("clients.field_nit_ph")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">{t("clients.field_email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder={t("clients.field_email_ph")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">{t("clients.field_phone")}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder={t("clients.field_phone_ph")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="address">{t("clients.field_address")}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder={t("clients.field_address_ph")}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium text-muted-foreground mb-1">
                {t("clients.section_tax")}
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>{t("clients.field_tax_type")}</Label>
                  <Select
                    value={formData.taxType}
                    onValueChange={(v) => updateField("taxType", v as TaxType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regimen-comun">
                        {t("clients.tax_common")}
                      </SelectItem>
                      <SelectItem value="regimen-simplificado">
                        {t("clients.tax_simplified")}
                      </SelectItem>
                      <SelectItem value="gran-contribuyente">
                        {t("clients.tax_large")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t("clients.field_self_withholding")}</Label>
                  <Select defaultValue="no">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">{t("clients.field_no")}</SelectItem>
                      <SelectItem value="si">{t("clients.field_yes")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium text-muted-foreground mb-1">
                {t("clients.section_bank")}
              </legend>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bank">{t("clients.field_bank")}</Label>
                <Input
                  id="bank"
                  value={formData.bank}
                  onChange={(e) => updateField("bank", e.target.value)}
                  placeholder={t("clients.field_bank_ph")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>{t("clients.field_account_type")}</Label>
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
                        {t("clients.account_savings")}
                      </SelectItem>
                      <SelectItem value="corriente">
                        {t("clients.account_checking")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="accountNumber">{t("clients.field_account_number")}</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      updateField("accountNumber", e.target.value)
                    }
                    placeholder={t("clients.field_account_number_ph")}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-sm font-medium text-muted-foreground mb-1">
                {t("clients.section_notes")}
              </legend>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder={t("clients.field_notes_ph")}
                rows={3}
              />
            </fieldset>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editingClient ? (
                t("clients.btn_save")
              ) : (
                t("clients.btn_create")
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
