'use server';

import { getAuthUserId } from '@/lib/server-auth';
import { db } from '@/db/client';
import { getUserPlan, getMonthlyInvoiceCount } from '@/lib/auth';
import { withRateLimit, rateLimitWrite, RateLimitError } from '@/lib/rate-limit';
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
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    const result = await db.execute({
      sql: 'SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC',
      args: [userId],
    });

    const data = result.rows.map(rowToInvoice);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: 'Error interno del servidor' };
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
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    return withRateLimit(userId, rateLimitWrite, async () => {
      // Server-side plan limit enforcement
      const userPlan = await getUserPlan(userId);
      if (userPlan) {
        const maxInvoices = userPlan.max_invoices_per_month as number;
        if (maxInvoices > 0) {
          const count = await getMonthlyInvoiceCount(userId);
          if (count >= maxInvoices) {
            return { success: false, error: 'Has alcanzado el limite mensual de facturas de tu plan' };
          }
        }
      }

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

      // Update client total invoiced (with ownership check)
      await db.execute({
        sql: 'UPDATE clients SET total_invoiced = total_invoiced + ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?',
        args: [totalVal, payload.clientId, userId],
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
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { success: false, error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` };
    }
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function updateInvoiceStatus(id: string, status: Invoice['status']): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    return withRateLimit(userId, rateLimitWrite, async () => {
      await db.execute({
        sql: 'UPDATE invoices SET status = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?',
        args: [status, id, userId],
      });

      return { success: true };
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { success: false, error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` };
    }
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    return withRateLimit(userId, rateLimitWrite, async () => {
      await db.execute({
        sql: 'DELETE FROM invoices WHERE id = ? AND user_id = ?',
        args: [id, userId],
      });

      return { success: true };
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { success: false, error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` };
    }
    return { success: false, error: 'Error interno del servidor' };
  }
}
