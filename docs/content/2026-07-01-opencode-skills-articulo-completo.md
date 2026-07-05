# Como los Skills de OpenCode Transformaron Mi Forma de Trabajar con IA

> Un articulo sobre workflows estructurados, superpoderes para tu asistente de codigo, y como dejar de pelear con la IA para empezar a colaborar.

---

Hace unos meses empece a usar OpenCode como mi asistente de codigo principal. Los primeros dias fueron un sube y baja: momentos de "wow, esto es magia" seguidos de "por que hizo eso?". El patron era claro — cuando le pedia cosas pequenas y concretas, funcionaba de maravilla. Cuando el contexto crecia, los resultados se volvian impredecibles.

Entonces descubri los **skills**. Y todo cambio.

---

## Que son los skills (y por que no son solo prompts)

Un skill no es un prompt largo que copias y pegas. Es un **workflow estructurado** que se carga en el contexto del asistente y lo guia paso a paso por un proceso de trabajo definido.

Piensalo asi: sin skills, tu asistente de IA es un desarrollador junior con mucho conocimiento pero poca disciplina. Con skills, es un desarrollador senior que sigue metodologias probadas.

La diferencia clave:

- **Sin skills**: "Arreglame este bug" → el asistente adivina, parchea, a veces acierta.
- **Con skills**: "Arreglame este bug" → el skill de debugging se carga → formula hipotesis → recolecta evidencia → identifica causa raiz → propone solucion → verifica → solo entonces entrega.

Mismo problema, resultado radicalmente distinto.

---

## Como instalar skills en OpenCode

Antes de entrar en detalle, lo practico. Instalar skills toma literalmente 2 minutos:

### Skills del ecosistema Superpowers

Estos son los skills de desarrollo que mas uso. Se instalan con un solo comando:

```bash
npx superpowers install
```

Esto te da acceso a skills como `brainstorming`, `systematic-debugging`, `test-driven-development`, `verification-before-completion`, `writing-plans`, `executing-plans`, `requesting-code-review` y varios mas. Todos listos para usar inmediatamente.

### Skills del ecosistema abierto (skills.sh)

Hay un ecosistema completo de skills creados por la comunidad. Para buscar e instalar:

```bash
npx skills find <lo-que-necesites>
npx skills add <owner/repo@skill> -g -y
```

Por ejemplo, si trabajas con React y Next.js:

```bash
npx skills find react performance
```

Encuentras skills creados por Vercel Labs y otras empresas, listos para instalar.

### Skills especificos de dominio

Algunos skills vienen empaquetados con herramientas especificas. Por ejemplo, los skills de HyperFrames (animaciones, video) vienen con su propio CLI y se instalan automaticamente al iniciar el proyecto.

---

## Los 4 Skills que Mas Uso (y Como Me Cambiaron)

### 1. `brainstorming` — Disenar antes de codear

**Como lo instale:**

```bash
npx superpowers install
```

El skill `brainstorming` viene incluido en el paquete Superpowers. Una vez instalado, OpenCode lo detecta automaticamente y lo invoca cuando detecta que estas por iniciar trabajo creativo (nuevas features, componentes, funcionalidades).

**Que hace:**

Este skill me obliga a hacer algo que todos sabemos que deberiamos hacer pero rara vez hacemos: **pensar antes de picar codigo**. El proceso es:

1. Explora el proyecto actual (archivos, docs, git history)
2. Hace preguntas una por una para entender el problema real
3. Propone 2-3 enfoques con trade-offs claros
4. Presenta el diseno para tu aprobacion
5. Escribe la especificacion como documento
6. Solo entonces permite pasar a implementacion

**Caso real:**

Estaba trabajando en un sistema de facturacion por suscripcion para un CRM. Sin el skill, probablemente habria empezado a escribir endpoints y modelos directamente. Con `brainstorming`, el asistente me llevo por un proceso de diseno donde:

- Identificamos que habia 3 subsistemas independientes que debian separarse
- Propuso usar Stripe como proveedor (con argumentos solidos)
- Diseno el modelo de datos ANTES de escribir codigo
- Detecto edge cases que yo no habia considerado (prorrateo, downgrades, webhooks fallidos)

Resultado: una spec solida en 20 minutos, y la implementacion fue directa porque ya sabiamos exactamente que construir.

### 2. `systematic-debugging` — Del "no se que pasa" a "aqui esta el bug"

**Como lo instale:**

Igual que el anterior, `npx superpowers install`. El skill se activa automaticamente cuando OpenCode detecta que estas enfrentando un bug, test fallido o comportamiento inesperado.

**Que hace:**

En lugar de dejar que el asistente adivine soluciones, este skill lo fuerza a seguir un proceso de diagnostico:

1. Entender el comportamiento esperado vs el real
2. Formular hipotesis sobre la causa
3. Recolectar evidencia (logs, tests, traces)
4. Identificar la causa raiz
5. Proponer y aplicar la solucion
6. Verificar que el fix realmente funciona

**Caso real:**

Tenia un bug donde los webhooks de Stripe a veces fallaban silenciosamente en produccion. Sin el skill, probablemente habria revisado logs manualmente por horas. Con `systematic-debugging`:

- Formulo la hipotesis: "el signature verification esta fallando por diferencia de timestamps"
- Reviso el codigo de verificacion de firmas — todo parecia bien
- Pero el skill me hizo revisar mas: "que pasa si el raw body no se esta pasando correctamente?"
- Ahi estaba: el middleware de Next.js estaba parseando el body antes de que llegara al verificador de firmas
- Solucion: configurar `rawBody` en la config de la API route

Tiempo total: 15 minutos. Sin el proceso estructurado, facil me habria tomado 2 horas.

### 3. `verification-before-completion` — "Ya quedo" con evidencia

**Como lo instale:**

`npx superpowers install`. Este skill se activa al final de cualquier tarea de implementacion, antes de que el asistente declare el trabajo como terminado.

**Que hace:**

Antes de decir "listo", el asistente DEBE:

1. Ejecutar los tests y confirmar que pasan
2. Correr el linter/formatter y confirmar cero errores
3. Correr typecheck si el proyecto usa TypeScript
4. Mostrar la evidencia (output de los comandos)

Si algo falla, vuelve a iterar hasta que todo pase. No se acepta "deberia funcionar".

**Caso real:**

Esto evito que subiera codigo roto al menos 5 veces en las ultimas dos semanas. La mas memorable: hice un cambio en la logica de rate limiting, el asistente dijo "ya quedo", pero el skill lo obligo a correr tests. Fallaron 3 tests. El asistente los arreglo, corrio de nuevo, todo verde, y solo entonces marco la tarea como completada.

Sin este skill, esos 3 tests rotos habrian llegado a PR review (o peor, a produccion).

### 4. `test-driven-development` — Tests primero, siempre

**Como lo instale:**

`npx superpowers install`. Se activa cuando empiezas a implementar una feature o bugfix.

**Que hace:**

El ciclo clasico Red-Green-Refactor, pero ejecutado por la IA:

1. **Red**: Escribe un test que falla (porque la feature no existe aun)
2. **Green**: Escribe el codigo minimo para que el test pase
3. **Refactor**: Mejora el codigo sin romper los tests

**Caso real:**

Necesitaba un endpoint para calcular el monto prorrateado de una suscripcion al hacer upgrade/downgrade. Con TDD:

- Primero se escribieron 6 tests cubriendo casos: upgrade mid-ciclo, downgrade mid-ciclo, cambio el mismo dia, cambio a plan gratuito, plan con descuento, plan anual
- Todos en rojo
- Luego la implementacion — una funcion de ~30 lineas
- Todos los tests en verde
- Refactor: se extrajo la logica de prorrateo a un helper reutilizable

El resultado fue codigo que funciono a la primera, con cobertura completa de edge cases. Si hubiera escrito la implementacion primero y los tests despues, garantizado que al menos 2 edge cases se me habrian escapado.

---

## Otros Skills Que Vale la Pena Mencionar

- **`writing-plans`** y **`executing-plans`**: Para features grandes, primero se crea un plan de implementacion paso a paso, luego se ejecuta. Perfecto para trabajo multi-dia.

- **`requesting-code-review`** y **`receiving-code-review`**: El asistente revisa tu codigo ANTES de que hagas PR, y cuando recibes feedback, te ayuda a procesarlo con rigor tecnico.

- **`finishing-a-development-branch`**: Cuando terminas una feature, te guia en el proceso de merge/PR/cleanup.

- **`dispatching-parallel-agents`**: Si tienes 2+ tareas independientes, las ejecuta en paralelo con subagentes. Productividad x3.

---

## Mi Flujo de Trabajo Actual con Skills

Asi se ve mi dia a dia ahora:

1. **Nueva feature** → `brainstorming` disena → `writing-plans` planifica → `executing-plans` implementa → `verification-before-completion` verifica → `requesting-code-review` revisa → `finishing-a-development-branch` mergea

2. **Bug reportado** → `systematic-debugging` diagnostica → `test-driven-development` escribe test que reproduce el bug → implementa fix → `verification-before-completion` verifica

3. **Code review recibido** → `receiving-code-review` procesa el feedback con rigor, no acepta cambios sin entenderlos

Lo que antes era "a ver que sale" ahora es un proceso predecible y repetible.

---

## Como Empezar Tu

1. **Instala Superpowers**:

```bash
npx superpowers install
```

2. **Explora skills de la comunidad**:

```bash
npx skills find testing
npx skills find deployment
```

3. **Deja que OpenCode los use**: Los skills se activan automaticamente cuando el asistente detecta el contexto adecuado. No tienes que hacer nada especial — solo trabajar normalmente. El asistente invocara el skill correcto en el momento correcto.

4. **Crea tus propios skills**: Si tienes un workflow repetitivo, puedes crear tu propio skill con `npx skills init mi-skill`.

---

## Conclusion

Los skills no son magia. Son disciplina empaquetada.

La IA es increiblemente capaz, pero sin estructura, es como un Ferrari sin volante: mucha potencia, poca direccion. Los skills le dan ese volante.

Desde que los uso, mis sesiones de desarrollo son mas cortas, el codigo que produzco es mas robusto, y — quizas lo mas importante — tengo confianza en lo que el asistente entrega. Ya no estoy en modo "a ver si funciona", estoy en modo "se que funciona porque siguio el proceso".

Si estas usando OpenCode (o cualquier asistente de IA para codigo) y no estas usando skills, te estas perdiendo la mitad de la herramienta.

---

**Tu turno**: Que skills estas usando? Cuales te gustaria que existieran? Dejame tu comentario.

---

*Publicado originalmente en [tu-linkedin-url]*
