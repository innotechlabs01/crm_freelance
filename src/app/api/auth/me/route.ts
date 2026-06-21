import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user plan and subscription from Turso
  const planResult = await db.execute({
    sql: `SELECT p.*, s.id as sub_id, s.status as sub_status, s.stripe_subscription_id, s.renewal_at, s.stripe_customer_id
          FROM subscriptions s JOIN plans p ON s.plan_id = p.id
          WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 1`,
    args: [userId],
  });

  // Get permissions
  const permResult = await db.execute({
    sql: `SELECT DISTINCT p.name FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          JOIN roles r ON rp.role_id = r.id
          JOIN user_roles ur ON r.id = ur.role_id
          WHERE ur.user_id = ?`,
    args: [userId],
  });

  // Get client count
  const clientResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM clients WHERE user_id = ? AND status = ?',
    args: [userId, 'active'],
  });

  // Get monthly invoice count
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
}
