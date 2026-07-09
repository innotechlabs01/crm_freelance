import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { getAuthUserId } from '@/lib/server-auth';
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

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientId,
      clientName,
      concepto,
      descripcion,
      valorBase,
      ivaPorcentaje,
      tipoRetencion,
      retRate,
      fechaEmision,
      fechaVencimiento,
      priority = 'medium',
    } = body;

    return withRateLimit(userId, rateLimitWrite, async () => {
      const userPlan = await getUserPlan(userId);
      if (userPlan) {
        const maxInvoices = userPlan.max_invoices_per_month as number;
        if (maxInvoices > 0) {
          const count = await getMonthlyInvoiceCount(userId);
          if (count >= maxInvoices) {
            return NextResponse.json(
              { success: false, error: 'Has alcanzado el limite mensual de facturas de tu plan' },
              { status: 400 }
            );
          }
        }
      }

      const countResult = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND date >= date(\'now\', \'start of year\')',
        args: [userId],
      });
      const nextNum = Number(countResult.rows[0]?.count || 0) + 1;
      const invoiceId = `FAC-${String(nextNum).padStart(3, '0')}`;

      const baseVal = valorBase;
      const ivaRate = ivaPorcentaje / 100;
      const ivaVal = Math.round(baseVal * ivaRate);
      const retVal = Math.round(baseVal * retRate);
      const totalVal = baseVal + ivaVal - retVal;

      await db.execute({
        sql: `INSERT INTO invoices (id, user_id, client_id, client_name, date, due_date, value, status, concept, priority, description, subtotal, tax_val, ret_val, total)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
        args: [invoiceId, userId, clientId, clientName, fechaEmision, fechaVencimiento, totalVal, concepto, priority, descripcion, baseVal, ivaVal, retVal, totalVal],
      });

      await db.execute({
        sql: 'UPDATE clients SET total_invoiced = total_invoiced + ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?',
        args: [totalVal, clientId, userId],
      });

      const invoice: Invoice = {
        id: invoiceId,
        client: clientName,
        clientId: clientId,
        date: fechaEmision,
        value: totalVal,
        status: 'pending',
        concept: concepto,
        priority: priority as Invoice['priority'],
        description: descripcion,
        subtotal: baseVal,
        taxVal: ivaVal,
        retVal,
        total: totalVal,
      };

      return NextResponse.json({ success: true, data: invoice });
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` },
        { status: 429 }
      );
    }
    console.error('[cuentas-cobro] error:', e);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
