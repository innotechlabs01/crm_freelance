'use server';

import { getAuthUserId } from '@/lib/server-auth';
import { db } from '@/db/client';
import { withRateLimit, rateLimitAuthenticated, RateLimitError } from '@/lib/rate-limit';
import { clerkClient } from '@clerk/nextjs/server';

async function requireAdmin(): Promise<{ authorized: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { authorized: false, error: 'No autorizado' };

  const result = await db.execute({
    sql: `SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = ? AND r.name IN ('SUPERADMIN', 'ENTERPRISE_OWNER')`,
    args: [userId],
  });

  if (result.rows.length === 0) {
    return { authorized: false, error: 'Acceso denegado: se requiere rol de administrador' };
  }

  return { authorized: true };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  created_at: string;
}

export interface AdminTicket {
  id: string;
  user_name: string;
  user_email: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  user_name: string;
  plan_name: string;
  status: string;
  starts_at: string;
  renewal_at: string;
  amount: number;
}

export interface AdminIncident {
  id: string;
  service: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  detected_at: string;
  resolved_at: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  target: string;
  metadata: string;
  ip_address: string;
  created_at: string;
}

// -- Users (via Clerk API) --
export async function getAdminUsers(): Promise<{ success: boolean; data?: AdminUser[]; error?: string }> {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) return { success: false, error: admin.error };

    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ limit: 50 });
    const allUsers = clerkUsers.data;

    // Get subscriptions for plan info
    const subResult = await db.execute({
      sql: `SELECT s.user_id, p.display_name as plan_name, s.status
            FROM subscriptions s JOIN plans p ON s.plan_id = p.id`,
      args: [],
    });
    const subMap = new Map<string, { plan: string; status: string }>();
    for (const row of subResult.rows) {
      subMap.set(row.user_id as string, {
        plan: (row.plan_name as string) || 'Free',
        status: (row.status as string) || 'active',
      });
    }

    const users: AdminUser[] = allUsers.map((u) => {
      const sub = subMap.get(u.id);
      return {
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.emailAddresses[0]?.emailAddress || 'N/A',
        email: u.emailAddresses[0]?.emailAddress || '',
        plan: sub?.plan || 'Free',
        status: sub?.status || 'active',
        created_at: new Date(u.createdAt).toISOString().split('T')[0],
      };
    });

    return { success: true, data: users };
  } catch (e) {
    return { success: false, error: 'Error interno del servidor' };
  }
}

// -- Tickets --
export async function getAdminTickets(): Promise<{ success: boolean; data?: AdminTicket[]; error?: string }> {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) return { success: false, error: admin.error };

    const result = await db.execute({
      sql: 'SELECT * FROM support_tickets ORDER BY created_at DESC',
      args: [],
    });

    if (result.rows.length === 0) {
      return { success: true, data: [] };
    }

    const data: AdminTicket[] = result.rows.map((r) => ({
      id: r.id as string,
      user_name: (r.user_name as string) || 'N/A',
      user_email: (r.user_email as string) || '',
      subject: r.subject as string,
      description: (r.description as string) || '',
      status: r.status as string,
      priority: r.priority as string,
      created_at: r.created_at as string,
    }));

    return { success: true, data };
  } catch (e) {
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function updateTicketStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) return { success: false, error: admin.error };

    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    return withRateLimit(userId, rateLimitAuthenticated, async () => {
      await db.execute({
        sql: 'UPDATE support_tickets SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
        args: [status, id],
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

// -- Subscriptions --
export async function getAdminSubscriptions(): Promise<{ success: boolean; data?: AdminSubscription[]; error?: string }> {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) return { success: false, error: admin.error };

    const result = await db.execute({
      sql: `SELECT s.id, s.user_id, p.display_name as plan_name, p.price, s.status, s.starts_at, s.renewal_at
            FROM subscriptions s JOIN plans p ON s.plan_id = p.id
            ORDER BY s.created_at DESC`,
      args: [],
    });

    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ limit: 50 });
    const userMap = new Map<string, string>();
    for (const u of clerkUsers.data) {
      userMap.set(u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.emailAddresses[0]?.emailAddress || 'N/A');
    }

    const data: AdminSubscription[] = result.rows.map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      user_name: userMap.get(r.user_id as string) || 'N/A',
      plan_name: (r.plan_name as string) || 'Free',
      status: r.status as string,
      starts_at: (r.starts_at as string) || '',
      renewal_at: (r.renewal_at as string) || '',
      amount: Number(r.price || 0),
    }));

    return { success: true, data };
  } catch (e) {
    return { success: false, error: 'Error interno del servidor' };
  }
}

// -- Incidents --
export async function getAdminIncidents(): Promise<{ success: boolean; data?: AdminIncident[]; error?: string }> {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) return { success: false, error: admin.error };

    const result = await db.execute({
      sql: 'SELECT * FROM incidents ORDER BY detected_at DESC',
      args: [],
    });

    const data: AdminIncident[] = result.rows.map((r) => ({
      id: r.id as string,
      service: r.service as string,
      severity: r.severity as string,
      title: r.title as string,
      description: (r.description as string) || '',
      status: r.status as string,
      detected_at: r.detected_at as string,
      resolved_at: (r.resolved_at as string) || '',
    }));

    return { success: true, data };
  } catch (e) {
    return { success: false, error: 'Error interno del servidor' };
  }
}

// -- Feature Flags --
export async function getFeatureFlags(): Promise<{ success: boolean; data?: FeatureFlag[]; error?: string }> {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) return { success: false, error: admin.error };

    const result = await db.execute({
      sql: 'SELECT * FROM feature_flags ORDER BY name ASC',
      args: [],
    });

    const data: FeatureFlag[] = result.rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string) || '',
      enabled: Boolean(r.enabled),
      updated_at: r.updated_at as string,
    }));

    return { success: true, data };
  } catch (e) {
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function toggleFeatureFlag(id: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) return { success: false, error: admin.error };

    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    return withRateLimit(userId, rateLimitAuthenticated, async () => {
      await db.execute({
        sql: 'UPDATE feature_flags SET enabled = ?, updated_at = datetime(\'now\') WHERE id = ?',
        args: [enabled ? 1 : 0, id],
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

// -- Audit Logs --
export async function getAuditLogs(): Promise<{ success: boolean; data?: AuditLogEntry[]; error?: string }> {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) return { success: false, error: admin.error };

    const result = await db.execute({
      sql: 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50',
      args: [],
    });

    const data: AuditLogEntry[] = result.rows.map((r) => ({
      id: r.id as string,
      user_id: (r.user_id as string) || '',
      action: r.action as string,
      target: (r.target as string) || '',
      metadata: (r.metadata as string) || '{}',
      ip_address: (r.ip_address as string) || '',
      created_at: r.created_at as string,
    }));

    return { success: true, data };
  } catch (e) {
    return { success: false, error: 'Error interno del servidor' };
  }
}
