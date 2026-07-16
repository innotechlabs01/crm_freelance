'use server';

import { getAuthUserId } from '@/lib/server-auth';
import { db } from '@/db/client';
import { getInitials, getClientColor } from '@/lib/mock-data';
import { getUserPlan, getClientCount } from '@/lib/auth';
import { withRateLimit, rateLimitWrite, RateLimitError } from '@/lib/rate-limit';
import type { Client } from '@/types';

function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: Number(row.id),
    name: row.name as string,
    company: (row.company as string) || '',
    nit: (row.nit as string) || '',
    email: (row.email as string) || '',
    phone: (row.phone as string) || '',
    address: (row.address as string) || '',
    taxType: (row.tax_type as Client['taxType']) || 'regimen-comun',
    bank: (row.bank as string) || '',
    accountType: (row.account_type as Client['accountType']) || 'ahorros',
    accountNumber: (row.account_number as string) || '',
    notes: (row.notes as string) || '',
    totalInvoiced: Number(row.total_invoiced || 0),
    status: (row.status as Client['status']) || 'active',
    color: row.color as string,
    initials: row.initials as string,
  };
}

export async function getClients(): Promise<{ success: boolean; data?: Client[]; error?: string }> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    const result = await db.execute({
      sql: 'SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC',
      args: [userId],
    });

    const data = result.rows.map(rowToClient);
    return { success: true, data };
  } catch (e) {
    console.error('[clients/list]', e);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function createClient(form: Omit<Client, 'id' | 'totalInvoiced' | 'status' | 'color' | 'initials'>): Promise<{ success: boolean; data?: Client; error?: string }> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    return withRateLimit(userId, rateLimitWrite, async () => {
      // Server-side plan limit enforcement
      const userPlan = await getUserPlan(userId);
      if (userPlan) {
        const maxClients = userPlan.max_clients as number;
        if (maxClients > 0) {
          const count = await getClientCount(userId);
          if (count >= maxClients) {
            return { success: false, error: 'Has alcanzado el limite de clientes de tu plan' };
          }
        }
      }

      const initials = getInitials(form.name);
      const color = getClientColor(form.name);

      const result = await db.execute({
        sql: `INSERT INTO clients (user_id, name, company, nit, email, phone, address, tax_type, bank, account_type, account_number, notes, status, color, initials)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        args: [userId, form.name ?? '', form.company ?? '', form.nit ?? '', form.email ?? '', form.phone ?? '', form.address || '', form.taxType ?? 'regimen-comun', form.bank || '', form.accountType || 'ahorros', form.accountNumber || '', form.notes || '', color, initials],
      });

      return { success: true, data: { ...form, id: Number(result.lastInsertRowid), totalInvoiced: 0, status: 'active', color, initials } };
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { success: false, error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` };
    }
    console.error('[clients/create]', e);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function updateClient(id: number, form: Omit<Client, 'id' | 'totalInvoiced' | 'status' | 'color' | 'initials'>): Promise<{ success: boolean; data?: Client; error?: string }> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    return withRateLimit(userId, rateLimitWrite, async () => {
      const initials = getInitials(form.name);
      const color = getClientColor(form.name);

      await db.execute({
        sql: `UPDATE clients SET name=?, company=?, nit=?, email=?, phone=?, address=?, tax_type=?, bank=?, account_type=?, account_number=?, notes=?, initials=?, color=?, updated_at=datetime('now')
              WHERE id=? AND user_id=?`,
        args: [form.name ?? '', form.company ?? '', form.nit ?? '', form.email ?? '', form.phone ?? '', form.address || '', form.taxType ?? 'regimen-comun', form.bank || '', form.accountType || 'ahorros', form.accountNumber || '', form.notes || '', initials, color, id, userId],
      });

      return { success: true, data: { ...form, id, totalInvoiced: 0, status: 'active', color, initials } };
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { success: false, error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` };
    }
    console.error('[clients/update]', e);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function deleteClient(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    return withRateLimit(userId, rateLimitWrite, async () => {
      await db.execute({
        sql: 'UPDATE clients SET status = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?',
        args: ['inactive', id, userId],
      });

      return { success: true };
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { success: false, error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` };
    }
    console.error('[clients/delete]', e);
    return { success: false, error: 'Error interno del servidor' };
  }
}
