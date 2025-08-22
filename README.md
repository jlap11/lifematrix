# LifeMatrix Personal

Dashboard personal de métricas mensuales y recomendaciones.

## Cómo ejecutar
- Desarrollo: `npm run dev` y abre `http://localhost:5173` (puerto puede variar).
- Build: `npm run build`; Preview: `npm run preview`.
- Lint: `npm run lint`.

## Uso
- Exportar JSON: botón "Exportar" en el header. Genera un `.json` con toda la información.
- Exportar PDF: botón "PDF mes" genera un PDF de resumen del mes seleccionado.
- Importar datos: botón "Importar" y selecciona un archivo `.json` válido (máx. ~2MB). El formato se valida y se muestran diferencias si no coincide. Puedes elegir sobrescribir o fusionar.
- Demo: botón "Cargar demo" carga `public/seed.json`.
- Configuración: en Acciones rápidas, abre "Configuración" para ajustar pesos y visibilidad de factores.

## Estructura de datos (resumen)
- Clave localStorage: `lifematrix-data`.
- Ver tipos en `src/lib/types.ts` y valores por defecto en `src/lib/data-utils.ts`.

## Tecnologías
React + Vite 6 + TypeScript + Tailwind v4, Radix + shadcn, framer-motion, recharts, jsPDF.

## Notas
- No hay backend. Los datos viven en `localStorage` del navegador.
- Modo oscuro con la clase `.dark-theme`.
