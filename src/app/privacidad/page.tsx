import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacidadPage() {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] mb-2">Política de Privacidad</h1>
          <p className="text-sm text-muted-foreground mb-10">Última actualización: 1 de julio de 2026</p>

          <h2>1. Información que Recopilamos</h2>
          <p>
            En FreelanceCRM recopilamos información que usted nos proporciona directamente al crear una cuenta,
            utilizar nuestros servicios o comunicarse con nosotros. Esta información puede incluir:
          </p>
          <ul>
            <li><strong>Información de cuenta:</strong> nombre, dirección de correo electrónico, contraseña.</li>
            <li><strong>Información de perfil:</strong> datos de su empresa o actividad profesional, NIT,
              información fiscal y bancaria necesaria para la generación de cuentas de cobro.</li>
            <li><strong>Información de clientes:</strong> nombres, empresas, datos de contacto e historial
              financiero de sus clientes que usted ingresa en la plataforma.</li>
            <li><strong>Información de transacciones:</strong> registros de cuentas de cobro, pagos y estados
              financieros generados a través de la plataforma.</li>
            <li><strong>Información de uso:</strong> datos sobre cómo interactúa con el Servicio, incluyendo
              páginas visitadas, funciones utilizadas y tiempo de sesión.</li>
          </ul>

          <h2>2. Cómo Utilizamos su Información</h2>
          <p>Utilizamos la información recopilada para los siguientes fines:</p>
          <ul>
            <li>Proporcionar, mantener y mejorar el Servicio.</li>
            <li>Procesar suscripciones y pagos a través de nuestros procesadores de pago.</li>
            <li>Generar cuentas de cobro y documentos financieros según sus instrucciones.</li>
            <li>Enviar notificaciones relacionadas con el Servicio, incluyendo recordatorios de pago.</li>
            <li>Personalizar su experiencia y ofrecer contenido relevante.</li>
            <li>Proteger la seguridad e integridad de nuestra plataforma.</li>
            <li>Cumplir con obligaciones legales y regulatorias aplicables.</li>
          </ul>

          <h2>3. Compartición de Información</h2>
          <p>
            No vendemos, alquilamos ni compartimos su información personal con terceros, excepto en las
            siguientes circunstancias:
          </p>
          <ul>
            <li><strong>Procesadores de pago:</strong> compartimos información de facturación con Paddle,
              nuestro procesador de pagos, para gestionar suscripciones y transacciones.</li>
            <li><strong>Proveedores de servicios:</strong> utilizamos servicios de terceros para
              infraestructura (Turso, Upstash), autenticación (Clerk) y análisis. Estos proveedores
              solo acceden a la información necesaria para prestar sus servicios.</li>
            <li><strong>Obligaciones legales:</strong> podemos divulgar información si es requerido por
              ley o en respuesta a solicitudes legales válidas de autoridades gubernamentales.</li>
            <li><strong>Consentimiento:</strong> con su autorización explícita para cualquier otro fin.</li>
          </ul>

          <h2>4. Seguridad de los Datos</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para proteger su información contra
            acceso no autorizado, alteración, divulgación o destrucción. Utilizamos cifrado en tránsito (TLS)
            y en reposo, autenticación segura a través de Clerk y monitoreo continuo de nuestra infraestructura.
            Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro.
          </p>

          <h2>5. Retención de Datos</h2>
          <p>
            Conservamos su información personal durante el tiempo que su cuenta esté activa o según sea necesario
            para proporcionarle el Servicio. Cuando cancele su cuenta, conservaremos cierta información según lo
            requieran las leyes aplicables o para fines legítimos de negocio, como resolver disputas y hacer
            cumplir nuestros acuerdos.
          </p>

          <h2>6. Sus Derechos</h2>
          <p>Dependiendo de su jurisdicción, usted puede tener los siguientes derechos:</p>
          <ul>
            <li>Acceder a sus datos personales.</li>
            <li>Rectificar datos inexactos o incompletos.</li>
            <li>Solicitar la eliminación de sus datos (&ldquo;derecho al olvido&rdquo;).</li>
            <li>Restringir u oponerse al procesamiento de sus datos.</li>
            <li>Solicitar la portabilidad de sus datos a otro proveedor.</li>
            <li>Retirar su consentimiento en cualquier momento.</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, contáctenos a través de{' '}
            <a href="mailto:privacidad@freelancecrm.com">privacidad@freelancecrm.com</a>.
          </p>

          <h2>7. Cookies y Tecnologías Similares</h2>
          <p>
            Utilizamos cookies y tecnologías similares para mantener su sesión, recordar sus preferencias y
            analizar el uso del Servicio. Puede configurar su navegador para rechazar cookies, aunque esto
            puede afectar la funcionalidad del Servicio.
          </p>

          <h2>8. Transferencias Internacionales</h2>
          <p>
            Su información puede ser transferida y procesada en países distintos al suyo. Utilizamos
            proveedores que cumplen con estándares internacionales de protección de datos y establecemos
            las salvaguardas contractuales adecuadas para proteger su información.
          </p>

          <h2>9. Cambios a esta Política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios
            significativos a través del Servicio o por correo electrónico. El uso continuado del Servicio
            después de dichos cambios constituye la aceptación de la nueva política.
          </p>

          <h2>10. Contacto</h2>
          <p>
            Si tiene preguntas sobre esta Política de Privacidad o sobre el tratamiento de sus datos,
            contáctenos a través de{' '}
            <a href="mailto:privacidad@freelancecrm.com">privacidad@freelancecrm.com</a>.
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
