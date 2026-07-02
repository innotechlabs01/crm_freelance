import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TerminosPage() {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] mb-2">Términos y Condiciones</h1>
          <p className="text-sm text-muted-foreground mb-10">Última actualización: 1 de julio de 2026</p>

          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar FreelanceCRM (&ldquo;el Servicio&rdquo;) usted acepta estar sujeto a estos Términos y
            Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al Servicio.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            FreelanceCRM es una plataforma de gestión financiera para freelancers que permite generar cuentas de cobro,
            administrar clientes, registrar pagos y monitorear el flujo de caja. El Servicio se ofrece bajo diferentes
            planes de suscripción con características y límites específicos detallados en nuestra página de precios.
          </p>

          <h2>3. Registro y Cuenta</h2>
          <p>
            Para acceder al Servicio, debe crear una cuenta proporcionando información veraz, precisa y completa.
            Usted es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las
            actividades que ocurran bajo su cuenta. Debe notificarnos inmediatamente sobre cualquier uso no
            autorizado de su cuenta.
          </p>

          <h2>4. Planes y Pagos</h2>
          <p>
            Ofrecemos planes gratuitos y de pago. Los planes de pago se facturan mensual o anualmente según la
            opción seleccionada. Todos los precios se muestran en dólares estadounidenses (USD). Los pagos se
            procesan a través de Paddle, nuestro procesador de pagos autorizado.
          </p>
          <p>
            Las suscripciones se renuevan automáticamente al final de cada período de facturación, a menos que
            sean canceladas con al menos 24 horas de anticipación. Puede cancelar su suscripción en cualquier
            momento desde la configuración de su cuenta.
          </p>

          <h2>5. Período de Prueba</h2>
          <p>
            Los planes de pago incluyen un período de prueba gratuito de 14 días. Durante este período, puede
            utilizar todas las funcionalidades del plan seleccionado sin costo. Si no cancela antes de que finalice
            el período de prueba, se le cobrará automáticamente según el plan elegido.
          </p>

          <h2>6. Cancelación y Reembolsos</h2>
          <p>
            Puede cancelar su suscripción en cualquier momento. La cancelación tendrá efecto al finalizar el
            período de facturación actual. Consulte nuestra Política de Reembolso para más detalles sobre las
            condiciones de reembolso.
          </p>

          <h2>7. Uso Aceptable</h2>
          <p>Al utilizar el Servicio, usted se compromete a:</p>
          <ul>
            <li>No utilizar el Servicio para fines ilegales o no autorizados.</li>
            <li>No interferir con el funcionamiento adecuado del Servicio.</li>
            <li>No intentar acceder a áreas restringidas del sistema sin autorización.</li>
            <li>No utilizar el Servicio para enviar spam, virus o cualquier código malicioso.</li>
            <li>Cumplir con todas las leyes y regulaciones aplicables en su jurisdicción.</li>
          </ul>

          <h2>8. Propiedad Intelectual</h2>
          <p>
            El Servicio y todo su contenido, características y funcionalidades son propiedad exclusiva de
            FreelanceCRM y están protegidos por leyes de derechos de autor, marcas registradas y otras leyes
            de propiedad intelectual. Usted conserva todos los derechos sobre los datos e información que
            ingrese en la plataforma.
          </p>

          <h2>9. Limitación de Responsabilidad</h2>
          <p>
            FreelanceCRM se proporciona &ldquo;tal cual&rdquo; y &ldquo;según disponibilidad&rdquo;. No
            garantizamos que el Servicio sea ininterrumpido, seguro o libre de errores. En ningún caso
            FreelanceCRM será responsable por daños indirectos, incidentales, especiales o consecuentes
            derivados del uso o la imposibilidad de uso del Servicio.
          </p>

          <h2>10. Modificaciones a los Términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones
            entrarán en vigor inmediatamente después de su publicación. El uso continuado del Servicio después
            de dichas modificaciones constituye la aceptación de los nuevos términos.
          </p>

          <h2>11. Ley Aplicable</h2>
          <p>
            Estos Términos se rigen por las leyes de Colombia. Cualquier disputa relacionada con estos Términos
            será resuelta en los tribunales competentes de Bogotá D.C., Colombia.
          </p>

          <h2>12. Contacto</h2>
          <p>
            Si tiene preguntas sobre estos Términos, contáctenos a través de{' '}
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
