'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import type { Invoice } from '@/types';

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    client: (row.client_name as string) || '',
    clientId: Number(row.client_id || 0),
    date: (row.date as string) || '',
    value: Number(row.value || 0),
    status: (row.status as Invoice['status']) || 'pending',
    concept: (row.concept as string) || '',
    priority: (row.priority as Invoice['priority']) || 'medium',
    description: (row.description as string) || '',
    subtotal: Number(row.subtotal || 0),
    taxVal: Number(row.tax_val || 0),
    retVal: Number(row.ret_val || 0),
    total: Number(row.total || 0),
  };
}

export async function getInvoices(): Promise<{ success: boolean; data?: Invoice[]; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    const result = await db.execute({
      sql: 'SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC',
      args: [userId],
    });

    const data = result.rows.map(rowToInvoice);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createInvoice(payload: {
  clientId: number;
  clientName: string;
  concepto: string;
  descripcion: string;
  valorBase: number;
  ivaPorcentaje: number;
  tipoRetencion: string;
  retRate: number;
  fechaEmision: string;
  fechaVencimiento: string;
  priority: string;
}): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    // Generate invoice number
    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND date >= date(\'now\', \'start of year\')',
      args: [userId],
    });
    const nextNum = Number(countResult.rows[0]?.count || 0) + 1;
    const invoiceId = `FAC-${String(nextNum).padStart(3, '0')}`;

    const baseVal = payload.valorBase;
    const ivaRate = payload.ivaPorcentaje / 100;
    const ivaVal = Math.round(baseVal * ivaRate);
    const retVal = Math.round(baseVal * payload.retRate);
    const totalVal = baseVal + ivaVal - retVal;

    await db.execute({
      sql: `INSERT INTO invoices (id, user_id, client_id, client_name, date, due_date, value, status, concept, priority, description, subtotal, tax_val, ret_val, total)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      args: [invoiceId, userId, payload.clientId, payload.clientName, payload.fechaEmision, payload.fechaVencimiento, totalVal, payload.concepto, payload.priority, payload.descripcion, baseVal, ivaVal, retVal, totalVal],
    });

    // Update client total invoiced
    await db.execute({
      sql: 'UPDATE clients SET total_invoiced = total_invoiced + ?, updated_at = datetime(\'now\') WHERE id = ?',
      args: [totalVal, payload.clientId],
    });

    const invoice: Invoice = {
      id: invoiceId,
      client: payload.clientName,
      clientId: payload.clientId,
      date: payload.fechaEmision,
      value: totalVal,
      status: 'pending',
      concept: payload.concepto,
      priority: payload.priority as Invoice['priority'],
      description: payload.descripcion,
      subtotal: baseVal,
      taxVal: ivaVal,
      retVal,
      total: totalVal,
    };

    return { success: true, data: invoice };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateInvoiceStatus(id: string, status: Invoice['status']): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    await db.execute({
      sql: 'UPDATE invoices SET status = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?',
      args: [status, id, userId],
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    await db.execute({
      sql: 'DELETE FROM invoices WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
