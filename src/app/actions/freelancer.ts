'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import type { Freelancer } from '@/types';

export async function getFreelancerProfile(): Promise<{ success: boolean; data?: Freelancer; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    const result = await db.execute({
      sql: 'SELECT * FROM freelancer_profiles WHERE user_id = ? LIMIT 1',
      args: [userId],
    });

    if (result.rows.length === 0) {
      return { success: true, data: { name: '', nit: '', email: '', phone: '' } };
    }

    const row = result.rows[0];
    const data: Freelancer = {
      name: (row.name as string) || '',
      company: (row.company as string) || '',
      nit: (row.nit as string) || '',
      email: (row.email as string) || '',
      phone: (row.phone as string) || '',
      address: (row.address as string) || '',
      bank: (row.bank as string) || '',
      accountType: (row.account_type as Freelancer['accountType']) || 'ahorros',
      accountNumber: (row.account_number as string) || '',
    };

    return { success: true, data };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function saveFreelancerProfile(profile: Freelancer): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    await db.execute({
      sql: `INSERT INTO freelancer_profiles (user_id, name, company, nit, email, phone, address, bank, account_type, account_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
            name=excluded.name, company=excluded.company, nit=excluded.nit, email=excluded.email,
            phone=excluded.phone, address=excluded.address, bank=excluded.bank,
            account_type=excluded.account_type, account_number=excluded.account_number,
            updated_at=datetime('now')`,
      args: [userId, profile.name, profile.company || '', profile.nit, profile.email, profile.phone, profile.address || '', profile.bank || '', profile.accountType || 'ahorros', profile.accountNumber || ''],
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getPaymentMethods(): Promise<{ success: boolean; data?: { id: string; name: string; bank: string; accountType: string; accountNumber: string; phone: string }[]; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    const result = await db.execute({
      sql: 'SELECT * FROM payment_methods WHERE user_id = ? AND is_active = 1 ORDER BY created_at ASC',
      args: [userId],
    });

    const data = result.rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      bank: r.bank as string,
      accountType: r.account_type as string,
      accountNumber: r.account_number as string,
      phone: (r.phone as string) || '',
    }));

    return { success: true, data };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getNotificationPrefs(): Promise<{ success: boolean; data?: { paymentReminders: boolean; paymentConfirmations: boolean; weeklySummary: boolean; systemUpdates: boolean }; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    const result = await db.execute({
      sql: 'SELECT * FROM notification_prefs WHERE user_id = ? LIMIT 1',
      args: [userId],
    });

    if (result.rows.length === 0) {
      return { success: true, data: { paymentReminders: true, paymentConfirmations: true, weeklySummary: false, systemUpdates: true } };
    }

    const row = result.rows[0];
    return {
      success: true,
      data: {
        paymentReminders: Boolean(row.payment_reminders),
        paymentConfirmations: Boolean(row.payment_confirmations),
        weeklySummary: Boolean(row.weekly_summary),
        systemUpdates: Boolean(row.system_updates),
      },
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function saveNotificationPrefs(prefs: { paymentReminders: boolean; paymentConfirmations: boolean; weeklySummary: boolean; systemUpdates: boolean }): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'No autorizado' };

    await db.execute({
      sql: `INSERT INTO notification_prefs (user_id, payment_reminders, payment_confirmations, weekly_summary, system_updates)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
            payment_reminders=excluded.payment_reminders,
            payment_confirmations=excluded.payment_confirmations,
            weekly_summary=excluded.weekly_summary,
            system_updates=excluded.system_updates,
            updated_at=datetime('now')`,
      args: [userId, prefs.paymentReminders ? 1 : 0, prefs.paymentConfirmations ? 1 : 0, prefs.weeklySummary ? 1 : 0, prefs.systemUpdates ? 1 : 0],
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
