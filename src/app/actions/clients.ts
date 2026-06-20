'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { getInitials, getClientColor } from '@/lib/mock-data';
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
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    const result = await db.execute({
      sql: 'SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC',
      args: [userId],
    });

    const data = result.rows.map(rowToClient);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createClient(form: Omit<Client, 'id' | 'totalInvoiced' | 'status' | 'color' | 'initials'>): Promise<{ success: boolean; data?: Client; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    const initials = getInitials(form.name);
    const color = getClientColor(form.name);

    const result = await db.execute({
      sql: `INSERT INTO clients (user_id, name, company, nit, email, phone, address, tax_type, bank, account_type, account_number, notes, status, color, initials)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      args: [userId, form.name, form.company, form.nit, form.email, form.phone, form.address || '', form.taxType, form.bank || '', form.accountType || 'ahorros', form.accountNumber || '', form.notes || '', color, initials],
    });

    return { success: true, data: { ...form, id: Number(result.lastInsertRowid), totalInvoiced: 0, status: 'active', color, initials } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateClient(id: number, form: Omit<Client, 'id' | 'totalInvoiced' | 'status' | 'color' | 'initials'>): Promise<{ success: boolean; data?: Client; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    const initials = getInitials(form.name);
    const color = getClientColor(form.name);

    await db.execute({
      sql: `UPDATE clients SET name=?, company=?, nit=?, email=?, phone=?, address=?, tax_type=?, bank=?, account_type=?, account_number=?, notes=?, initials=?, color=?, updated_at=datetime('now')
            WHERE id=? AND user_id=?`,
      args: [form.name, form.company, form.nit, form.email, form.phone, form.address || '', form.taxType, form.bank || '', form.accountType || 'ahorros', form.accountNumber || '', form.notes || '', initials, color, id, userId],
    });

    return { success: true, data: { ...form, id, totalInvoiced: 0, status: 'active', color, initials } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteClient(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    await db.execute({
      sql: 'UPDATE clients SET status = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?',
      args: ['inactive', id, userId],
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
