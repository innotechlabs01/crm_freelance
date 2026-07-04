import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL || 'Freelance CRM <noreply@freelancecrm.co>'

export async function sendWelcomeEmail(to: string, planName: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Bienvenido a Freelance CRM',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h1 style="color:#1a1a2e">Bienvenido a Freelance CRM</h1>
          <p>Tu suscripcion al plan <strong>${planName}</strong> ha sido activada.</p>
          <p>Ya puedes disfrutar de todas las funcionalidades de tu plan.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:12px">Ir al Dashboard</a>
        </div>
      `,
    })
  } catch (e) {
    console.error('sendWelcomeEmail error:', e instanceof Error ? e.message : 'Unknown')
  }
}

export async function sendPaymentSuccessEmail(to: string, planName: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Pago recibido - Freelance CRM',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h1 style="color:#1a1a2e">Pago recibido</h1>
          <p>Hemos recibido tu pago para el plan <strong>${planName}</strong>.</p>
          <p>Tu suscripcion sigue activa y tienes acceso a todas las funcionalidades.</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('sendPaymentSuccessEmail error:', e instanceof Error ? e.message : 'Unknown')
  }
}

export async function sendPaymentFailedEmail(to: string, days: number) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Problema con tu pago - Freelance CRM',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h1 style="color:#dc2626">Problema con tu pago</h1>
          <p>No pudimos procesar el ultimo pago de tu suscripcion.</p>
          <p>Tienes <strong>${days} dias</strong> para actualizar tu metodo de pago antes de que tu cuenta pase al plan gratuito.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/configuracion" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:12px">Actualizar metodo de pago</a>
        </div>
      `,
    })
  } catch (e) {
    console.error('sendPaymentFailedEmail error:', e instanceof Error ? e.message : 'Unknown')
  }
}

export async function sendSubscriptionCancelledEmail(to: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Suscripcion cancelada - Freelance CRM',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h1 style="color:#1a1a2e">Suscripcion cancelada</h1>
          <p>Tu suscripcion ha sido cancelada. Tu cuenta ha pasado al plan gratuito.</p>
          <p>Puedes volver a actualizar tu plan cuando quieras desde la pagina de configuracion.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/configuracion" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:12px">Ver planes</a>
        </div>
      `,
    })
  } catch (e) {
    console.error('sendSubscriptionCancelledEmail error:', e instanceof Error ? e.message : 'Unknown')
  }
}
