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
│   └── *.test.js         pruebas automáticas (Vitest)
├── components/           ← la interfaz
│   ├── Formulario.jsx    formulario con ayudas para medirse
│   ├── Campo.jsx         un campo numérico con unidad y error
│   ├── Selector.jsx      botones de opción (género, unidades, objetivo)
│   ├── Resultado.jsx     % de grasa, categoría, escala y métricas
│   └── Plan.jsx          plan de alimentación y entrenamiento
├── App.jsx               une todo: valida → calcula → muestra
├── main.jsx              punto de entrada de React
└── styles.css            estilos mobile-first, con modo oscuro
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

> ⚠️ El método U.S. Navy tiene un margen de error de ±3 a 4 puntos. La app lo muestra como
> **estimación** e incluye un aviso de que no reemplaza a un profesional de la salud.

## Próximos pasos

### (a) Cuentas e historial
- **Supabase** (gratis para empezar): inicio de sesión con email o Google y una tabla
  `mediciones` (usuario, fecha, medidas, % de grasa).
- Activar *Row Level Security* para que cada usuario vea solo sus datos.
- Agregar una pantalla de historial con un gráfico de evolución.

### (b) Planes personalizados con IA
- Crear una **función serverless** (por ejemplo, `api/plan.js` en Vercel) que llame a la API de
  Claude (`claude-haiku-4-5`, cerca de 1 centavo por plan). La API key va en una variable de
  entorno del servidor, **nunca en el código del navegador**.
- Los números siguen saliendo de `lib/`; la IA solo redacta el plan a partir de esos datos.
- Cobrar con **Stripe** ($1,99/mes o $9,99/año), limitar los planes con IA por mes y que la
  función verifique que la suscripción esté activa.
