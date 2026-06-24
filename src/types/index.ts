export type InvoiceStatus = "pending" | "sent" | "paid" | "overdue";
export type Priority = "high" | "medium" | "low";
export type ClientStatus = "active" | "inactive";
export type TaxType = "regimen-comun" | "regimen-simplificado" | "gran-contribuyente";
export type AccountType = "ahorros" | "corriente";
export type WithholdingType = "ninguna" | "iva" | "ica" | "renta";

export interface Client {
  id: number;
  name: string;
  company: string;
  nit: string;
  email: string;
  phone: string;
  address?: string;
  taxType: TaxType;
  bank?: string;
  accountType?: AccountType;
  accountNumber?: string;
  notes?: string;
  totalInvoiced: number;
  status: ClientStatus;
  color: string;
  initials: string;
}

export interface Invoice {
  id: string;
  client: string;
  clientId: number;
  date: string;
  value: number;
  status: InvoiceStatus;
  concept: string;
  priority: Priority;
  description?: string;
  subtotal?: number;
  taxVal?: number;
  retVal?: number;
  total?: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export interface KpiData {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  iconBg: string;
  color: string;
  chartData: number[] | null;
}

export interface Freelancer {
  name: string;
  company?: string;
  nit: string;
  email: string;
  phone: string;
  address?: string;
  bank?: string;
  accountType?: AccountType;
  accountNumber?: string;
}
