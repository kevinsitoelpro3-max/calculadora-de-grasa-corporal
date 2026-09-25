# Calculadora de grasa corporal

App web (React + Vite) que estima el % de grasa corporal con el **método U.S. Navy** y genera un
**plan básico de dieta y entrenamiento** por reglas. Todo corre en el navegador: no hay backend y
los datos no salen del dispositivo del usuario.

## Cómo correrla

Necesitás [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install     # instala las dependencias (una sola vez)
npm run dev     # abre la app en http://localhost:5173 y se recarga al guardar
npm test        # corre las pruebas de las fórmulas
npm run build   # genera la versión final en la carpeta dist/
```

## Publicarla gratis

**Vercel** (recomendado): entrá a [vercel.com](https://vercel.com), iniciá sesión con GitHub,
elegí "Add New → Project", seleccioná este repositorio y apretá "Deploy". Vercel detecta Vite solo.
Cada vez que subas cambios a `main`, la web se actualiza automáticamente.

**Netlify** funciona igual: comando de build `npm run build`, carpeta de publicación `dist`.

## Estructura

```
src/
├── lib/                  ← la lógica, sin nada de interfaz (fácil de probar)
│   ├── bodyfat.js        fórmula U.S. Navy, categorías, IMC, masa grasa/magra
│   ├── plan.js           calorías (Mifflin-St Jeor), macros y rutina por reglas
│   ├── validation.js     validación del formulario y conversión a cm/kg
│   ├── units.js          conversión pulgadas/libras
│   ├── historial.js      mediciones y formulario guardados en el navegador
│   ├── formato.js        fechas, pesos y cambios con signo
│   ├── supabase.js       conexión a Supabase (solo si están las variables de entorno)
│   ├── nube.js           cuentas y mediciones guardadas en la nube
│   ├── meta.js           meta de % de grasa: peso meta, tiempo y progreso
│   ├── menu.js           menú del día con porciones según tus macros
│   ├── rutina.js         rutina semanal según objetivo, días y lugar
│   └── *.test.js         pruebas automáticas (Vitest)
├── components/           ← la interfaz
│   ├── Formulario.jsx    formulario con ayudas para medirse
│   ├── GuiaMedicion.jsx  silueta que marca dónde medir el campo activo
│   ├── Historial.jsx     tabla con tus mediciones anteriores
│   ├── Cuenta.jsx        ingreso con enlace mágico por email
│   ├── PanelPremium.jsx  pestañas Progreso / Menú / Rutina y botón de PDF
│   ├── MetaGrasa.jsx, GraficoEvolucion.jsx, MenuDelDia.jsx, RutinaSemanal.jsx
│   ├── Campo.jsx         un campo numérico con unidad y error
│   ├── Selector.jsx      botones de opción (género, unidades, objetivo)
│   ├── Resultado.jsx     % de grasa, categoría, escala y métricas
│   └── Plan.jsx          plan de alimentación y entrenamiento
├── hooks/
│   └── useCuenta.js      sesión y sincronización del historial con la cuenta
├── App.jsx               une todo: valida → calcula → muestra
├── main.jsx              punto de entrada de React
└── styles.css            estilos mobile-first, con modo oscuro
supabase/migrations/      SQL para crear la tabla en Supabase
```

La regla principal es **separar la lógica (`lib/`) de la interfaz (`components/`)**. Así las
fórmulas se prueban solas y el plan por reglas se puede reemplazar por uno con IA sin tocar la
pantalla.

## Cómo funciona, paso a paso

1. **Formulario → validación.** `validation.js` lee lo que escribió el usuario (acepta coma
   decimal), convierte pulgadas/libras a cm/kg y rechaza valores fuera de rango (por ejemplo,
   una estatura de 17 cm por error de tipeo).
2. **% de grasa.** `bodyfat.js` aplica la fórmula U.S. Navy en su versión métrica:
   - Hombres: `495 / (1.0324 − 0.19077·log10(cintura − cuello) + 0.15456·log10(estatura)) − 450`
   - Mujeres: `495 / (1.29579 − 0.35004·log10(cintura + cadera − cuello) + 0.22100·log10(estatura)) − 450`
3. **Categoría.** Rangos del American Council on Exercise (ACE):

   | Categoría      | Hombres | Mujeres |
   | -------------- | ------- | ------- |
   | Grasa esencial | < 6 %   | < 14 %  |
   | Atlético       | 6–13 %  | 14–20 % |
   | Fitness        | 14–17 % | 21–24 % |
   | Aceptable      | 18–24 % | 25–31 % |
   | Obesidad       | ≥ 25 %  | ≥ 32 %  |

4. **Plan por reglas** (`plan.js`):
   - Metabolismo basal con Mifflin-St Jeor × factor de actividad = calorías de mantenimiento.
   - Bajar grasa: déficit del 20 % (25 % con obesidad, 10 % si ya es atlético).
     Ganar músculo: superávit del 5–10 %. Mantener: 0 %.
     Nunca baja de 1500 kcal (hombres) o 1200 kcal (mujeres).
   - Proteína: 2,0–2,2 g por kg de **masa magra**; grasas: 25 % de las calorías (mínimo
     0,6 g/kg); el resto, carbohidratos.
   - Avisos si el objetivo no conviene (por ejemplo, ganar músculo con obesidad).

5. **Historial en el navegador** (`historial.js`). Cada cálculo se guarda en `localStorage`
   (hasta 20 mediciones) junto con los últimos valores del formulario, para no volver a
   escribirlos. Al calcular de nuevo, la app muestra el cambio en % de grasa, peso, masa grasa y
   masa magra desde la medición anterior. Los datos no salen del dispositivo, y si el navegador
   bloquea el almacenamiento la app funciona igual, sin historial.
6. **Guía de medición** (`GuiaMedicion.jsx`). Una silueta (distinta para hombre y mujer) resalta
   dónde va la cinta según el campo que estés completando, con consejos para medir bien.

7. **Panel "Tu plan completo" (Premium)**. Todavía no hay cobro, así que el panel queda
   abierto para todos durante el lanzamiento, en pestañas:
   - **Progreso** (`meta.js`, `MetaGrasa.jsx`, `GraficoEvolucion.jsx`): elegís una meta de % de
     grasa (con un mínimo saludable por género) y la app calcula el peso meta conservando la
     masa magra, los kilos de grasa a perder y una fecha estimada bajando 0,7 % del peso por
     semana. Muestra una barra de progreso desde tu primera medición y un gráfico de evolución
     (% de grasa, peso o masa magra) con la línea de la meta y detalle al tocar cada punto.
   - **Menú** (`menu.js`, `MenuDelDia.jsx`): un día de ejemplo en 4 comidas con porciones en
     gramos que suman tus calorías y macros. Cada comida tiene varias opciones intercambiables
     y las porciones tienen un máximo realista (lo que falta se completa con fruta o pan).
   - **Rutina** (`rutina.js`, `RutinaSemanal.jsx`): de 3 a 5 días por semana, en gimnasio o en
     casa, con series y repeticiones según tu objetivo, descanso, cardio y consejos.
   - **PDF**: el botón imprime el resultado y el plan completo (se oculta el formulario).
   Las elecciones (meta, días, lugar, opciones del menú) se recuerdan en el navegador.

> ⚠️ El método U.S. Navy tiene un margen de error de ±3 a 4 puntos. La app lo muestra como
> **estimación** e incluye un aviso de que no reemplaza a un profesional de la salud.

## Cuentas con Supabase (opcional)

Sin configurar nada, la app funciona igual y el historial queda en el navegador. Para que los
usuarios puedan crear una cuenta y ver sus mediciones en cualquier dispositivo:

1. **Crear el proyecto.** Entrá a [supabase.com](https://supabase.com), creá una cuenta y un
   proyecto nuevo (plan gratis). Elegí la región más cercana a tus usuarios, por ejemplo São Paulo.
2. **Crear la tabla.** En el proyecto: **SQL Editor → New query**, pegá todo el contenido de
   `supabase/migrations/001_mediciones.sql` y apretá **Run**. Crea la tabla `mediciones` con
   seguridad por fila (cada usuario solo ve y borra lo suyo).
3. **Configurar el enlace mágico.** En **Authentication → URL Configuration**:
   - *Site URL*: tu dirección de Vercel (por ejemplo `https://calculadora-de-grasa-corporal.vercel.app`).
   - *Redirect URLs*: agregá esa misma dirección, `https://*-kevin-2887.vercel.app/**` (para las
     vistas previas) y `http://localhost:5173` (para probar en tu compu).
4. **Copiar las claves.** En **Project Settings → API** copiá la *Project URL* y la clave
   *anon public*. La clave anon es pública a propósito: la seguridad la da la política de filas.
   **Nunca** uses la clave `service_role` en la app.
5. **Cargarlas en Vercel.** En tu proyecto de Vercel: **Settings → Environment Variables**, agregá
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con esos valores y volvé a publicar
   (**Deployments → ⋯ → Redeploy**). Para probar en tu compu, copiá `.env.example` como
   `.env.local` y completalo.

Cómo funciona: la persona escribe su email y recibe un enlace. Al abrirlo queda conectada; sus
mediciones del navegador se suben a su cuenta (sin duplicarse) y, desde ahí, cada nueva medición
se guarda en la nube y en el navegador.

> ⚠️ **Límites del plan gratis:** Supabase envía pocos emails por hora con su servidor de
> prueba. Antes de tener usuarios reales, configurá un proveedor de email propio en
> **Authentication → Emails → SMTP Settings** (por ejemplo, Resend, que tiene plan gratis).
> Además, los proyectos gratis se pausan después de una semana sin uso: se reactivan desde el panel.

## Próximos pasos

### (a) Mejoras para las cuentas
- Guardar la meta y las preferencias del panel en la cuenta (hoy quedan en el navegador).
- Ingreso con Google además del enlace por email.

### (b) Planes personalizados con IA
- Crear una **función serverless** (por ejemplo, `api/plan.js` en Vercel) que llame a la API de
  Claude (`claude-haiku-4-5`, cerca de 1 centavo por plan). La API key va en una variable de
  entorno del servidor, **nunca en el código del navegador**.
- Los números siguen saliendo de `lib/`; la IA solo redacta el plan a partir de esos datos.
- Cobrar con **Stripe** ($1,99/mes o $9,99/año), limitar los planes con IA por mes y que la
  función verifique que la suscripción esté activa. Con el cobro activo, `PanelPremium.jsx`
  pasa a mostrarse completo solo a suscriptores (el resto ve una vista previa).
