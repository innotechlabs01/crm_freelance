import type { Invoice, Freelancer } from '@/types'

export function generateInvoiceHtml(invoice: Invoice, freelancer: Freelancer): string {
  const base = invoice.subtotal || invoice.value
  const total = invoice.total || invoice.value

  return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;color:#0A0A0B">
  <div style="border-bottom:2px solid #E2E8F0;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between">
    <div>
      <h2 style="color:#2563EB;margin:0;font-size:22px">${freelancer.name || 'FreelanceCRM'}</h2>
      <p style="color:#64748B;font-size:12px;margin:4px 0 0">Cuenta de Cobro</p>
    </div>
    <div style="text-align:right">
      <p style="color:#2563EB;font-size:20px;font-weight:800;margin:0">${invoice.id}</p>
      <p style="color:#64748B;font-size:12px;margin:4px 0 0">${invoice.date}</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;font-size:13px">
    <div>
      <strong style="color:#64748B;font-size:11px;text-transform:uppercase;display:block;margin-bottom:4px">Cliente</strong>
      ${invoice.client}
    </div>
    <div>
      <strong style="color:#64748B;font-size:11px;text-transform:uppercase;display:block;margin-bottom:4px">Prestador</strong>
      ${freelancer.name}<br/>NIT: ${freelancer.nit}
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px">
    <thead>
      <tr>
        <th style="text-align:left;padding:8px 0;font-size:11px;text-transform:uppercase;color:#64748B;border-bottom:1px solid #E2E8F0">Concepto</th>
        <th style="text-align:left;padding:8px 0;font-size:11px;text-transform:uppercase;color:#64748B;border-bottom:1px solid #E2E8F0">Cant.</th>
        <th style="text-align:left;padding:8px 0;font-size:11px;text-transform:uppercase;color:#64748B;border-bottom:1px solid #E2E8F0">Valor</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:8px 0">${invoice.concept || 'Servicios profesionales'}</td>
        <td style="padding:8px 0">1</td>
        <td style="padding:8px 0">$${base.toLocaleString('es-CO')}</td>
      </tr>
    </tbody>
  </table>

  <div style="text-align:right;border-top:2px solid #E2E8F0;padding-top:12px;font-size:14px;font-weight:700">
    Total: <span style="color:#10B981;font-size:18px">$${total.toLocaleString('es-CO')}</span>
  </div>

  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:11px;color:#64748B;display:grid;grid-template-columns:1fr 1fr;gap:4px">
    <span><strong>Banco:</strong> Bancolombia</span>
    <span><strong>Tipo:</strong> Cuenta de Ahorros</span>
    <span><strong>Numero:</strong> 123-456789-01</span>
    <span><strong>Titular:</strong> ${freelancer.name || 'FreelanceCRM'}</span>
  </div>
</div>`
}

export function generateInvoiceText(invoice: Invoice, freelancer: Freelancer): string {
  const total = invoice.total || invoice.value
  return [
    `CUENTA DE COBRO - ${invoice.id}`,
    `Fecha: ${invoice.date}`,
    '',
    `Cliente: ${invoice.client}`,
    `Prestador: ${freelancer.name} (NIT: ${freelancer.nit})`,
    '',
    `Concepto: ${invoice.concept || 'Servicios profesionales'}`,
    `Valor: $${total.toLocaleString('es-CO')}`,
    '',
    `Banco: Bancolombia - Cuenta de Ahorros #123-456789-01`,
    `Titular: ${freelancer.name || 'FreelanceCRM'}`,
    '',
    `Generado por FreelanceCRM`,
  ].join('\n')
}

export function buildInvoiceMailto(
  to: string,
  invoice: Invoice,
  freelancer: Freelancer
): string {
  const subject = `Cuenta de Cobro ${invoice.id} - ${freelancer.name}`
  const body = generateInvoiceText(invoice, freelancer)
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export async function sendInvoiceEmail(
  to: string,
  invoice: Invoice,
  freelancer: Freelancer
): Promise<{ mailtoUrl: string }> {
  const mailtoUrl = buildInvoiceMailto(to, invoice, freelancer)
  return { mailtoUrl }
}

// -- Notification helpers (server-side) ------------------------------------
// These log to console for now. To enable real email delivery, configure an
// SMTP server via environment variables and use nodemailer or similar.

export async function sendWelcomeEmail(to: string, planName: string) {
  console.log(`[EMAIL] Welcome email to ${to} - Plan: ${planName}`)
}

export async function sendPaymentSuccessEmail(to: string, planName: string) {
  console.log(`[EMAIL] Payment success to ${to} - Plan: ${planName}`)
}

export async function sendPaymentFailedEmail(to: string, days: number) {
  console.log(`[EMAIL] Payment failed to ${to} - Grace: ${days} days`)
}

export async function sendSubscriptionCancelledEmail(to: string) {
  console.log(`[EMAIL] Subscription cancelled to ${to}`)
}
