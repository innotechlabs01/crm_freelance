import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ReembolsosPage() {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60 py-3">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.03em] text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            FreelanceCRM
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">Volver al inicio</Button>
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        <article className="max-w-3xl mx-auto px-6 prose prose-neutral dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] mb-2">Política de Reembolso</h1>
          <p className="text-sm text-muted-foreground mb-10">Última actualización: 1 de julio de 2026</p>

          <h2>1. Período de Prueba Gratuito</h2>
          <p>
            Todos los planes de pago (Profesional y Empresarial) incluyen un período de prueba gratuito de
            14 días. Durante este período, usted puede evaluar todas las funcionalidades del plan sin ningún
            costo ni compromiso. No se requiere tarjeta de crédito para el plan Gratuito.
          </p>

          <h2>2. Reembolsos por Suscripciones Mensuales</h2>
          <p>
            Las suscripciones mensuales pueden ser canceladas en cualquier momento. Sin embargo, los pagos
            mensuales <strong>no son reembolsables</strong>, excepto en los siguientes casos:
          </p>
          <ul>
            <li>Si el Servicio ha estado indisponible por más de 72 horas consecutivas en un mes de
              facturación, puede solicitar un reembolso proporcional.</li>
            <li>Si se realizó un cargo por error o duplicado, el reembolso se procesará en un plazo
              de 5 a 10 días hábiles.</li>
          </ul>

          <h2>3. Reembolsos por Suscripciones Anuales</h2>
          <p>
            Para suscripciones anuales, ofrecemos un reembolso proporcional por los meses no utilizados
            si la cancelación se solicita dentro de los primeros 30 días posteriores al cargo anual. Después
            de este período, las suscripciones anuales no son reembolsables.
          </p>
          <p>
            El reembolso se calculará como el valor total pagado menos el valor correspondiente a los meses
            utilizados (calculados al precio mensual estándar del plan).
          </p>

          <h2>4. Cambios de Plan</h2>
          <p>
            Cuando actualiza de un plan inferior a uno superior (upgrade), se le cobrará la diferencia
            proporcional por el tiempo restante del período de facturación actual. Cuando cambia a un plan
            inferior (downgrade), el cambio se hará efectivo al finalizar el período de facturación actual
            y no se generan reembolsos por la diferencia.
          </p>

          <h2>5. Cómo Solicitar un Reembolso</h2>
          <p>Para solicitar un reembolso, debe seguir estos pasos:</p>
          <ol>
            <li>Iniciar sesión en su cuenta de FreelanceCRM.</li>
            <li>Ir a la sección de Configuración &gt; Facturación.</li>
            <li>Seleccionar &ldquo;Solicitar reembolso&rdquo; y completar el formulario.</li>
            <li>Nuestro equipo revisará su solicitud en un plazo de 2 a 5 días hábiles.</li>
          </ol>
          <p>
            También puede enviar su solicitud por correo electrónico a{' '}
            <a href="mailto:soporte@freelancecrm.com">soporte@freelancecrm.com</a> incluyendo
            el correo asociado a su cuenta y el motivo de la solicitud.
          </p>

          <h2>6. Procesamiento de Reembolsos</h2>
          <p>
            Una vez aprobada su solicitud, el reembolso se procesará a través del mismo método de pago
            utilizado en la compra original. El tiempo de acreditación depende de su entidad financiera
            y puede tardar entre 5 y 10 días hábiles.
          </p>

          <h2>7. Cancelación de Cuenta</h2>
          <p>
            Al cancelar su cuenta, perderá acceso a todas las funcionalidades y datos asociados. Le
            recomendamos exportar su información antes de cancelar. La cancelación de la cuenta no genera
            automáticamente un reembolso; debe seguir el proceso descrito en la sección 5.
          </p>

          <h2>8. Excepciones</h2>
          <p>No se otorgarán reembolsos en los siguientes casos:</p>
          <ul>
            <li>Violación de nuestros Términos y Condiciones.</li>
            <li>Uso fraudulento o no autorizado de la plataforma.</li>
            <li>Solicitudes presentadas más de 30 días después del cargo.</li>
            <li>Planes gratuitos (no aplican cargos).</li>
          </ul>

          <h2>9. Contacto</h2>
          <p>
            Si tiene preguntas sobre esta Política de Reembolso, contáctenos a través de{' '}
            <a href="mailto:soporte@freelancecrm.com">soporte@freelancecrm.com</a>.
          </p>
        </article>
      </main>

      <footer className="bg-card border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <span>&copy; 2026 FreelanceCRM. Todos los derechos reservados.</span>
        </div>
      </footer>
    </>
  )
}
