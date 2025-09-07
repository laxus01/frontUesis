# DataTable Component

Un componente de tabla global y reutilizable para mostrar listados de datos con funcionalidades avanzadas como búsqueda, ordenamiento, paginación y acciones personalizadas.

## Características

- ✅ **Búsqueda**: Filtrado en tiempo real por múltiples columnas
- ✅ **Ordenamiento**: Ordenamiento ascendente/descendente por columnas
- ✅ **Paginación**: Navegación por páginas con información de registros
- ✅ **Acciones**: Botones de acción personalizables por fila
- ✅ **Responsive**: Adaptable a diferentes tamaños de pantalla
- ✅ **TypeScript**: Tipado completo para mejor experiencia de desarrollo
- ✅ **Material-UI**: Integración completa con el sistema de diseño
- ✅ **Personalizable**: Múltiples opciones de configuración

## Uso Básico

```tsx
import DataTable, { TableColumn } from '../components/common/DataTable';

interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

const users: User[] = [
  { id: 1, name: 'Juan Pérez', email: 'juan@example.com', active: true },
  { id: 2, name: 'María García', email: 'maria@example.com', active: false },
];

const columns: TableColumn<User>[] = [
  { id: 'id', label: 'ID', sortable: true },
  { id: 'name', label: 'Nombre', sortable: true, searchable: true },
  { id: 'email', label: 'Email', sortable: true, searchable: true },
  { id: 'active', label: 'Activo', sortable: true },
];

function UserList() {
  return (
    <DataTable
      data={users}
      columns={columns}
      title="Lista de Usuarios"
    />
  );
}
```

## Propiedades

### DataTableProps

| Propiedad | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `data` | `T[]` | ✅ | Array de datos a mostrar |
| `columns` | `TableColumn<T>[]` | ✅ | Configuración de columnas |
| `loading` | `boolean` | ❌ | Estado de carga |
| `searchable` | `boolean` | ❌ | Habilitar búsqueda (default: true) |
| `sortable` | `boolean` | ❌ | Habilitar ordenamiento (default: true) |
| `paginated` | `boolean` | ❌ | Habilitar paginación (default: true) |
| `pageSize` | `number` | ❌ | Registros por página (default: 10) |
| `actions` | `TableAction<T>[]` | ❌ | Acciones por fila |
| `onRowClick` | `(row: T) => void` | ❌ | Callback al hacer clic en una fila |
| `emptyMessage` | `string` | ❌ | Mensaje cuando no hay datos |
| `title` | `string` | ❌ | Título de la tabla |
| `dense` | `boolean` | ❌ | Tabla compacta |
| `stickyHeader` | `boolean` | ❌ | Encabezado fijo |
| `maxHeight` | `number \| string` | ❌ | Altura máxima |

### TableColumn

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `id` | `keyof T \| string` | Identificador de la columna |
| `label` | `string` | Texto del encabezado |
| `minWidth` | `number` | Ancho mínimo en píxeles |
| `align` | `'left' \| 'right' \| 'center'` | Alineación del contenido |
| `sortable` | `boolean` | Si la columna es ordenable |
| `searchable` | `boolean` | Si la columna es buscable |
| `format` | `(value: any, row: T) => React.ReactNode` | Función de formateo |
| `render` | `(value: any, row: T) => React.ReactNode` | Función de renderizado personalizada |

### TableAction

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `label` | `string` | Texto del tooltip |
| `icon` | `React.ReactNode` | Icono del botón |
| `onClick` | `(row: T) => void` | Función al hacer clic |
| `color` | Material-UI color | Color del botón |
| `disabled` | `(row: T) => boolean` | Función para deshabilitar |
| `show` | `(row: T) => boolean` | Función para mostrar/ocultar |

## Ejemplos Avanzados

### Con Acciones Personalizadas

```tsx
import { tableActions } from '../components/common/DataTable';

const actions = [
  tableActions.view((row) => console.log('Ver:', row)),
  tableActions.edit((row) => console.log('Editar:', row)),
  tableActions.delete((row) => console.log('Eliminar:', row)),
];

<DataTable
  data={data}
  columns={columns}
  actions={actions}
/>
```

### Con Renderizado Personalizado

```tsx
const columns: TableColumn<User>[] = [
  {
    id: 'name',
    label: 'Usuario',
    render: (value, row) => (
      <Box>
        <Typography variant="body2" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.email}
        </Typography>
      </Box>
    ),
  },
  {
    id: 'active',
    label: 'Estado',
    render: (value) => (
      <Chip
        label={value ? 'Activo' : 'Inactivo'}
        color={value ? 'success' : 'default'}
        size="small"
      />
    ),
  },
];
```

### Con Configuración Preestablecida

```tsx
import { tablePresets } from '../utils/tableUtils';

<DataTable
  data={data}
  columns={columns}
  {...tablePresets.compact} // Para espacios pequeños
/>
```

## Utilidades Incluidas

### Columnas Comunes
```tsx
import { commonColumns } from '../utils/tableUtils';

const columns = [
  commonColumns.id<User>(),
  commonColumns.name<User>(),
  commonColumns.email<User>(),
  commonColumns.status<User>(),
];
```

### Funciones de Utilidad
```tsx
import { tableUtils } from '../utils/tableUtils';

// Formatear moneda
tableUtils.formatCurrency(1000); // "$1.000,00"

// Formatear porcentaje
tableUtils.formatPercentage(0.15); // "15.00%"

// Truncar texto
tableUtils.truncateText("Texto muy largo...", 20);
```

## Integración con Hooks Existentes

El componente se integra perfectamente con los hooks existentes como `useOwners`:

```tsx
import { OwnerTable } from '../components/common/DataTableExample';
import { useOwners } from '../hooks/useOwners';

function OwnersPage() {
  const { /* propiedades del hook */ } = useOwners();
  
  return (
    <OwnerTable
      owners={owners}
      loading={loading}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
```

## Personalización de Estilos

El componente utiliza el tema de Material-UI y puede personalizarse mediante:

- Props de Material-UI (`sx`, `style`)
- Tema global de Material-UI
- CSS personalizado para casos específicos

## Rendimiento

- **Búsqueda optimizada**: Debounce automático en búsquedas
- **Renderizado eficiente**: Solo renderiza filas visibles
- **Memorización**: Uso de `useMemo` para cálculos costosos
- **Paginación inteligente**: Reduce el DOM para grandes conjuntos de datos
