import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { withRateLimit, rateLimitAuthenticated, RateLimitError } from '@/lib/rate-limit';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return withRateLimit(userId, rateLimitAuthenticated, async () => {
      const planResult = await db.execute({
        sql: `SELECT p.*, s.id as sub_id, s.status as sub_status, s.lemonsqueezy_subscription_id, s.renewal_at
              FROM subscriptions s JOIN plans p ON s.plan_id = p.id
              WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 1`,
        args: [userId],
      });

      const permResult = await db.execute({
        sql: `SELECT DISTINCT p.name FROM permissions p
              JOIN role_permissions rp ON p.id = rp.permission_id
              JOIN roles r ON rp.role_id = r.id
              JOIN user_roles ur ON r.id = ur.role_id
              WHERE ur.user_id = ?`,
        args: [userId],
      });

      const clientResult = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM clients WHERE user_id = ? AND status = ?',
        args: [userId, 'active'],
      });

      const invoiceResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM invoices 
              WHERE user_id = ? AND date >= date('now', 'start of month')`,
        args: [userId],
      });

      const planRow = planResult.rows[0];
      const plan = planRow ? {
        id: planRow.id,
        name: planRow.name,
        display_name: planRow.display_name,
        max_clients: planRow.max_clients,
        max_invoices_per_month: planRow.max_invoices_per_month,
        price: planRow.price,
      } : null;

      const subscription = planRow ? {
        status: planRow.sub_status,
        renewal_at: planRow.renewal_at,
      } : null;

      const permissions = permResult.rows.map(r => r.name as string);
      const clientCount = Number(clientResult.rows[0]?.count || 0);
      const monthlyInvoiceCount = Number(invoiceResult.rows[0]?.count || 0);

      return NextResponse.json({ plan, subscription, permissions, clientCount, monthlyInvoiceCount });
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` },
        { status: 429, headers: { 'Retry-After': String(e.retryAfter) } }
      );
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
