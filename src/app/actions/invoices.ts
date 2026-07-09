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

  // Fetch all invoices for the authenticated user sorted by date descending.
  export async function getInvoices(): Promise<{ success: boolean; data?: Invoice[]; error?: string }> {
    try {
      const userId = await getAuthUserId();
      if (!userId) return { success: false, error: 'No autorizado' };

      const result = await db.execute({
        sql: 'SELECT * FROM invoices WHERE user_id = ? ORDER BY date DESC',
        args: [userId],
      });

      const data = result.rows.map(rowToInvoice);
      return { success: true, data };
    } catch (e) {
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  export async function createInvoice(form: Omit<Invoice, 'id'>): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    // Ensure server-side plan limit enforcement
    const userPlan = await getUserPlan(userId);
    if (userPlan) {
      const maxInvoices = userPlan.max_invoices as number;
      if (maxInvoices > 0) {
        const count = await getMonthlyInvoiceCount(userId, new Date());
        if (count >= maxInvoices) {
          return { success: false, error: 'Has alcanzado el límite de facturas mensuales de tu plan' };
        }
      }
    }

    return withRateLimit(userId, rateLimitWrite, async () => {
      const result = await db.execute({
        sql: `INSERT INTO invoices (user_id, client_id, client_name, concept, value, date, status, priority, description, subtotal, tax_val, ret_val, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          form.clientId,
          form.client,
          form.concept,
          form.value,
          form.date,
          form.status,
          form.priority,
          form.description,
          form.subtotal,
          form.taxVal,
          form.retVal,
          form.total,
        ],
      });

      const data: Invoice = {
        id: result.lastInsertRowid as unknown as string,
        client: form.client,
        clientId: form.clientId,
        date: form.date,
        value: form.value,
        status: form.status,
        concept: form.concept,
        priority: form.priority,
        description: form.description,
        subtotal: form.subtotal,
        taxVal: form.taxVal,
        retVal: form.retVal,
        total: form.total,
      };

      return { success: true, data };
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { success: false, error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` };
    }
    return { success: false, error: 'Error interno del servidor' };
  }
}
\n<{ success: boolean; error?: string }> {
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
