import { db } from '@/db/client';

export async function getUserPermissions(userId: string): Promise<string[]> {
  const result = await db.execute({
    sql: `SELECT DISTINCT p.name FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          JOIN roles r ON rp.role_id = r.id
          JOIN user_roles ur ON r.id = ur.role_id
          WHERE ur.user_id = ?`,
    args: [userId],
  });
  return result.rows.map((row) => row.name as string);
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.includes(permission);
}

export async function getUserPlan(userId: string) {
  const result = await db.execute({
    sql: `SELECT p.*, s.status as sub_status, s.stripe_subscription_id, s.renewal_at
          FROM subscriptions s JOIN plans p ON s.plan_id = p.id
          WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 1`,
    args: [userId],
  });
  return result.rows[0] || null;
}

export async function getClientCount(userId: string): Promise<number> {
  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM clients WHERE user_id = ? AND status = ?',
    args: [userId, 'active'],
  });
  return Number(result.rows[0]?.count || 0);
}

export async function getMonthlyInvoiceCount(userId: string): Promise<number> {
  const result = await db.execute({
    sql: `SELECT COUNT(*) as count FROM invoices
          WHERE user_id = ? AND date >= date('now', 'start of month')`,
    args: [userId],
  });
  return Number(result.rows[0]?.count || 0);
}
