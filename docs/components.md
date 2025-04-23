# Documentación de Componentes

## ProjectInitiationForm

El componente `ProjectInitiationForm` es un formulario complejo para la creación de actas de inicio de proyecto. Está diseñado para ser renderizado solo en el cliente para evitar problemas de hidratación.

### Características Principales

1. **Formulario Multi-paso**
   - Navegación entre pasos con validación
   - Barra de progreso
   - Validación de campos requeridos
   - Manejo de errores

2. **Tipos de Proyecto**
   - Desarrollo de Software
   - Implementación
   - Consultoría
   - Infraestructura
   - Investigación
   - Otro

3. **Sección de Solución**
   - Solo visible cuando el tipo de proyecto es "Implementación"
   - Muestra información detallada de la solución seleccionada
   - Incluye características y descripción

4. **Generación de PDF**
   - Convierte el formulario en un documento PDF
   - Incluye todas las secciones del formulario
   - Añade pie de página con numeración
   - Mantiene el formato y estilo

### Estructura del Componente

1. **Estado y Hooks**
   - `useForm`: Manejo del formulario con validación Zod
   - `useState`: Control de pasos y estado del formulario
   - `useCallback`: Optimización de funciones
   - `useMemo`: Cálculos optimizados

2. **Validación**
   - Esquema Zod para validación de campos
   - Mensajes de error personalizados
   - Validación en tiempo real

3. **Navegación**
   - Botones de anterior/siguiente
   - Indicador de progreso
   - Validación antes de avanzar

4. **Generación de PDF**
   - Uso de html2canvas para captura
   - jsPDF para generación del documento
   - Manejo de múltiples páginas
   - Estilos consistentes

### Uso

```tsx
import ProjectInitiationFormWrapper from "@/components/project-initiation-form"

export default function Home() {
  return (
    <main>
      <ProjectInitiationFormWrapper />
    </main>
  )
}
```

### Consideraciones

1. **Rendimiento**
   - El componente está optimizado para evitar re-renderizados innecesarios
   - Uso de memoización para cálculos costosos
   - Lazy loading de componentes pesados

2. **Accesibilidad**
   - Etiquetas ARIA
   - Mensajes de error claros
   - Navegación por teclado

3. **Responsividad**
   - Diseño adaptable a diferentes tamaños de pantalla
   - Optimización para dispositivos móviles

4. **Seguridad**
   - Validación de datos
   - Sanitización de entrada
   - Manejo seguro de archivos

### Dependencias

- react-hook-form: Manejo de formularios
- zod: Validación de esquemas
- date-fns: Manejo de fechas
- html2canvas: Captura de contenido
- jsPDF: Generación de PDFs
- lucide-react: Iconos
- tailwindcss: Estilos 