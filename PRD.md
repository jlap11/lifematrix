# LifeMatrix - Product Requirements Document

LifeMatrix es una herramienta personal de seguimiento integral que permite medir, comprender y mejorar sistemáticamente las áreas clave de la vida personal con visualizaciones ricas, análisis profundo y recomendaciones accionables.

**Experience Qualities**:
1. **Reflexivo**: La interfaz invita a la introspección y auto-evaluación honesta con formularios intuitivos y visualizaciones claras
2. **Motivador**: Cada interacción refuerza el progreso personal con celebraciones de logros y insights constructivos
3. **Profesional**: Design system minimalista que transmite seriedad y confiabilidad en el seguimiento de datos personales

**Complexity Level**: Light Application (multiple features with basic state)
- Múltiples pantallas interconectadas con estado persistente local, formularios complejos y visualizaciones de datos, pero sin complejidad de cuentas o sincronización en tiempo real.

## Essential Features

### Dashboard Principal
- **Functionality**: Vista general del mes actual con scores por factor, tendencias y recomendaciones
- **Purpose**: Proporcionar snapshot inmediato del estado actual y progreso
- **Trigger**: Pantalla inicial de la aplicación
- **Progression**: Carga automática → Muestra KPIs globales → Sparklines por factor → Recomendaciones accionables
- **Success criteria**: Usuario puede evaluar su estado actual en menos de 10 segundos

### Registro Mensual por Factor
- **Functionality**: Formulario para capturar score (0-100), notas cualitativas, sub-métricas y objetivos
- **Purpose**: Documentar sistemáticamente el estado mensual de cada área de vida
- **Trigger**: Botón "Registrar mes" o navegación a factor específico
- **Progression**: Selecciona factor → Completa formulario → Valida datos → Guarda registro → Actualiza visualizaciones
- **Success criteria**: Registro completo toma menos de 3 minutos por factor

### Análisis y Visualizaciones
- **Functionality**: Gráficas de línea, radar charts, comparativas anuales y cálculos automáticos
- **Purpose**: Identificar patrones, tendencias y correlaciones entre factores
- **Trigger**: Navegación a vistas de análisis o después de registrar datos
- **Progression**: Selecciona vista → Renderiza gráficas → Aplica filtros → Exporta si necesario
- **Success criteria**: Visualizaciones cargan en menos de 2 segundos con datos claros

### Sistema de Objetivos y Hábitos
- **Functionality**: CRUD de objetivos con progreso, hábitos con streaks y heatmaps
- **Purpose**: Vincular métricas con acciones concretas y seguimiento de constancia
- **Trigger**: Sección dedicada o desde registro mensual
- **Progression**: Crea objetivo/hábito → Define frecuencia → Registra progreso → Ve estadísticas
- **Success criteria**: Streaks y progreso se actualizan automáticamente y motivan continuidad

### Import/Export de Datos
- **Functionality**: Importar y exportar JSON completo con validación de schema
- **Purpose**: Backup, migración y control total de datos personales
- **Trigger**: Menú de configuración
- **Progression**: Selecciona acción → Procesa archivo → Valida estructura → Confirma cambios
- **Success criteria**: Import/export completo sin pérdida de datos

## Edge Case Handling

- **Datos incompletos**: Permitir registros parciales con indicadores visuales de completitud
- **Scores fuera de rango**: Validación automática con mensajes informativos
- **Import de schema obsoleto**: Migraciones automáticas con log de cambios
- **Factores personalizados**: Interfaz para crear y editar factores custom
- **Períodos sin datos**: Interpolación inteligente y mensajes explicativos en gráficas

## Design Direction

La interfaz debe sentirse como una herramienta profesional de análisis personal - seria pero no intimidante, con elementos glassmórficos sutiles que sugieren transparencia y claridad en el auto-conocimiento. Minimal vs rich: interfaz minimal con visualizaciones ricas de datos.

## Color Selection

Analogous (adjacent colors on color wheel) - Paleta de azules y violetas que transmite calma, profesionalismo y introspección profunda.

- **Primary Color**: Azul profundo (oklch(0.45 0.15 250)) - Transmite confianza y estabilidad profesional
- **Secondary Colors**: Azul slate (oklch(0.35 0.08 250)) para elementos de apoyo y fondos secundarios  
- **Accent Color**: Violeta vibrante (oklch(0.55 0.20 280)) para CTAs importantes y celebración de logros
- **Foreground/Background Pairings**:
  - Background (oklch(0.08 0.02 250)): Texto blanco (oklch(0.98 0 0)) - Ratio 14.2:1 ✓
  - Card (oklch(0.12 0.03 250)): Texto gris claro (oklch(0.85 0.02 250)) - Ratio 8.9:1 ✓
  - Primary (oklch(0.45 0.15 250)): Texto blanco (oklch(0.98 0 0)) - Ratio 8.1:1 ✓
  - Accent (oklch(0.55 0.20 280)): Texto blanco (oklch(0.98 0 0)) - Ratio 6.2:1 ✓

## Font Selection

Tipografía que combine legibilidad técnica con calidez humana - Inter para interfaz y números, con variaciones de peso que establezcan jerarquía clara sin rigidez.

- **Typographic Hierarchy**:
  - H1 (Título principal): Inter Bold/32px/tight letter spacing
  - H2 (Factores): Inter Semibold/24px/normal spacing  
  - H3 (Secciones): Inter Medium/18px/normal spacing
  - Body (Contenido): Inter Regular/16px/relaxed line height
  - Caption (Métricas): Inter Medium/14px/tight spacing
  - Numbers (Scores): Inter Bold/20px/tabular nums

## Animations

Movimiento sutil que refuerza la sensación de progreso y crecimiento personal - transiciones que sugieren evolución temporal y logros incrementales.

- **Purposeful Meaning**: Animaciones de crecimiento para scores que mejoran, transiciones temporales para navegación entre períodos
- **Hierarchy of Movement**: Scores y métricas principales tienen animaciones más prominentes que elementos de navegación

## Component Selection

- **Components**: 
  - Cards con glassmorphism sutil para cada factor
  - Progress bars animadas para objetivos
  - Calendar heatmaps para hábitos  
  - Line charts y radar charts con Recharts
  - Forms con validación en tiempo real
  - Modals para registro mensual
- **Customizations**: 
  - ScoreCircle component para mostrar scores con animación
  - TrendArrow component para indicadores de tendencia
  - FactorCard component con estado hover/expanded
- **States**: Botones con estados loading para operaciones async, inputs con validación visual
- **Icon Selection**: Phosphor icons - TrendUp/Down, Calendar, Target, Brain, Heart, DollarSign
- **Spacing**: Sistema 4px base - padding p-4/p-6 para cards, gap-4 para grids
- **Mobile**: Stack vertical en móvil con cards full-width, gráficas responsivas con viewport scaling