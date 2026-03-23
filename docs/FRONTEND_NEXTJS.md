# Frontend Documentation: SMIAB (Next.js)

El frontend de SMIAB es una aplicación reactiva construida con **Next.js 15/16** y **React 19**, enfocada en la visualización de datos de telemetría.

## 📁 Estructura de Carpetas

La arquitectura del frontend sigue un patrón modular:

```text
src/
├── app/             # Rutas y layouts (Next.js App Router)
├── components/      # Componentes UI reutilizables
│   ├── charts/      # Gráficos con Recharts
│   └── ui/          # Componentes básicos (clases utilitarias Tailwind)
├── hooks/           # Custom hooks para lógica de negocio
├── services/        # Capa de API (Axios + TanStack Query)
└── store/           # Gestión de estado global con Zustand
```

---

## ⚡ Estado y Caché (React Query)

Para garantizar una experiencia de usuario fluida y evitar peticiones excesivas al servidor, SMIAB utiliza **TanStack Query (React Query)**:

-   **Stale Time & Caching:** Los datos de las impresoras (que no cambian cada segundo) se configuran con un `staleTime` de 5 minutos.
-   **Invalidación Proactiva:** Al realizar una sincronización manual (`sync`), se invalidan automáticamente las queries relacionadas para forzar la recarga de datos frescos.

```javascript
// Ejemplo de uso proactivo
const { data, isLoading } = useQuery({
  queryKey: ['printers', unitId],
  queryFn: () => getPrintersByUnit(unitId),
  staleTime: 1000 * 60 * 5, // 5 minutos de caché
});
```

---

## 🎨 Componentes Clave y Visualización

### Programación Defensiva (UI)
Para evitar saturar el backend con peticiones inválidas o innecesarias, el sistema implementa bloqueos a nivel de interfaz:
-   **Validación de Estado:** El botón "Solicitar Consumibles" se deshabilita automáticamente si la impresora tiene un estado `Offline`.
-   **Umbral de Consumo:** El botón se bloquea si el nivel de tóner es adecuado (`> 30%`), previniendo "peticiones basura" de insumos que aún tienen vida útil considerable.
-   **Feedback Inmediato:** Se utilizan estados de carga (`loading states`) y notificaciones `toast` para informar al usuario sobre el éxito o fallo de la petición sin interrumpir el flujo visual.

---

> [!TIP]
> Para el diseño visual, se utiliza **Tailwind CSS 4**, lo que permite una personalización total sin la carga de archivos CSS tradicionales, manteniendo la consistencia institucional.
