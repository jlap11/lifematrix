# Guía rápida para agentes de IA en este repo

Contexto: app React + Vite 6 + TypeScript + Tailwind v4, UI con Radix + shadcn. Objetivo: dashboard LifeMatrix con métricas mensuales y recomendaciones.

## Cómo ejecutar
- Desarrollo: `npm run dev` (Vite) y abre `http://localhost:5173` (puerto puede variar).
- Build: `npm run build` (tsc --noCheck + vite build). Preview: `npm run preview`.
- Lint: `npm run lint`.
- Nota Windows: el script `kill` usa `fuser` (Linux). Ignóralo en Windows.

## Arquitectura y flujo de datos
- Entradas: `index.html` monta `#root` y carga `src/main.tsx`.
- Bootstrap: `src/main.tsx` importa CSS (`main.css`, `styles/theme.css`, `index.css`) y envuelve `<App />` en `ErrorBoundary` (en DEV re-lanza para overlay de Vite).
- App: `src/App.tsx` renderiza `<Dashboard />` + `<Toaster />`.
- Estado/persistencia: `Dashboard` usa un hook local: `const [data, setData] = useLocalStorage<LifeMatrixData>('lifematrix-data', createDefaultData())`.
  - Clave de almacenamiento: `lifematrix-data` (persistencia localStorage; no hay backend).
  - Estructura principal en `src/lib/types.ts` y valores por defecto en `src/lib/data-utils.ts`.
- Cálculos: `LifeMatrixCalculator` (`src/lib/calculator.ts`) provee:
  - `calculateGlobalScore(factorScores, weights)`: promedio ponderado redondeado a 0.1.
  - `calculateTrend`, `calculateVariancePct`, `generateRecommendations`, utilidades de hábitos.
- Presentación: componentes atómicos en `src/components/ui/*` (shadcn/Radix), visuales propios en `src/components/*` (`Dashboard`, `FactorCard`, `ScoreCircle`, `MiniLineChart`). Animaciones con `framer-motion`. Mini charts con `recharts`.

## Convenciones clave
- Alias de paths: `@` → `src` (config en `vite.config.ts` y `tsconfig.json`). Importa como `@/lib/utils`.
- Claves de mes: `YYYY-MM`. Para indexar `records[year][month]` el mes es `MM` (2 dígitos). En `Dashboard` se usa `selectedMonth.split('-')[1]`.
- Estructura de datos:
  - `LifeMatrixData.records`: `Record<year, Record<MM, MonthRecord>>`.
  - `preferences.factorWeights` y `preferences.visibleFactors` gobiernan cálculo y UI.
  - `factorsCatalog` define metadatos por factor (label, description, submetrics, peso por defecto).
- Temas/estilos: Tailwind v4 con tokens Radix. Variables CSS bajo `:root` en `src/styles/theme.css` (incluye escalas de spacing y radio). Modo oscuro usando la clase `.dark-theme` o `data-appearance="dark"` (ver `tailwind.config.js`).
 Iconos: Phosphor en UI (`@phosphor-icons/react`). Algunas pantallas usan `lucide-react` en errores.

## Integraciones externas
- No hay dependencias de GitHub Spark. Evita añadir referencias a `@github/spark/*` y elimina cualquier import residual.

## Patrones prácticos (ejemplos)
- Añadir un nuevo factor:
  - Agrega entrada en `DEFAULT_FACTORS_CATALOG` (archivo `src/lib/data-utils.ts`).
  - Asegura un peso en `preferences.factorWeights` y visibilidad en `preferences.visibleFactors` si debe mostrarse.
  - La UI de `Dashboard` recorrerá `visibleFactors` y mostrará `FactorCard` + `MiniLineChart` automáticamente.
- Actualizar datos de un mes:
  - Lee `const y = getCurrentYearKey(); const m = getCurrentMonthKey().split('-')[1]`.
  - Usa `setData(prev => ({ ...prev, records: { ...prev.records, [y]: { ...prev.records[y], [m]: newMonthRecord } } }))`.
  - Calcula `global.score` con `LifeMatrixCalculator.calculateGlobalScore` y deriva `trend/variancePct` si procede.
- Exportar/importar: `Dashboard` implementa export (Blob) e import (input oculto). Antes de `setData` se valida con `validateLifeMatrixData` y se limita el tamaño (~2MB).

## Trampas comunes
- No asumas tests: no hay suite de pruebas. Si añades lógica pública, considera incluir pruebas mínimas o validar con un script ad-hoc.
- Las variables de tema viven en `:root`; respeta las capas de Tailwind (`layer(base|theme|preflight)`).
- `ErrorFallback`: en DEV re-lanza; en PROD muestra alerta con botón "Try Again".

## Archivos de referencia
- Bootstrap: `src/main.tsx`, `src/App.tsx`, `src/ErrorFallback.tsx`.
- Dominio y utils: `src/lib/types.ts`, `src/lib/data-utils.ts`, `src/lib/calculator.ts`, `src/lib/utils.ts`.
- UI: `src/components/Dashboard.tsx`, `src/components/FactorCard.tsx`, `src/components/ScoreCircle.tsx`, `src/components/MiniLineChart.tsx`, `src/components/ui/*`.
- Build/config: `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `src/styles/theme.css`.

¿Algo no quedó claro o falta (p. ej., flujo de importación de datos o comandos de despliegue)? Indica y ajusto esta guía.
