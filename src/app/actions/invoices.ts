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
