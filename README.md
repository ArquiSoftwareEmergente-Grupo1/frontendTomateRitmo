# Configuración de JSON Server para el Proyecto

## Instalación

1. **Instalar JSON Server globalmente:**
```bash
npm install -g json-server
```

2. **O instalar como dependencia de desarrollo:**
```bash
npm install --save-dev json-server
```

## Configuración

1. **Crear el archivo `db.json` en la raíz del proyecto** con el contenido proporcionado.

2. **Crear archivo `json-server.json` (opcional) para configuración:**
```json
{
  "port": 3000,
  "host": "localhost",
  "watch": true,
  "delay": 500,
  "cors": true,
  "quiet": false
}
```

## Ejecución

### Opción 1: Comando directo
```bash
json-server --watch db.json --port 3000
```

### Opción 2: Con archivo de configuración
```bash
json-server db.json
```

### Opción 3: Agregar script en package.json
```json
{
  "scripts": {
    "json-server": "json-server --watch db.json --port 3000",
    "api": "json-server --watch db.json --port 3000 --delay 500"
  }
}
```

Luego ejecutar:
```bash
npm run json-server
```

## Configuración del Environment

Actualizar el archivo `environment.ts` y `environment.prod.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

## Rutas Disponibles

Una vez ejecutando JSON Server, las siguientes rutas estarán disponibles:

### Usuarios y Autenticación
- `GET /users` - Obtener todos los usuarios
- `GET /users?email=test@test.com&password=123456` - Login
- `POST /users` - Registrar usuario
- `PUT /users/:id` - Actualizar usuario

### Cultivos
- `GET /cultivos` - Obtener todos los cultivos
- `GET /cultivos?userId=1` - Cultivos por usuario
- `POST /cultivos` - Crear cultivo
- `PUT /cultivos/:id` - Actualizar cultivo
- `DELETE /cultivos/:id` - Eliminar cultivo

### Análisis y Alertas
- `GET /alertasVisuales` - Obtener alertas
- `GET /alertasVisuales?estado=activa` - Alertas por estado
- `POST /alertasVisuales` - Crear alerta
- `PUT /alertasVisuales/:id` - Actualizar alerta

- `GET /analisisResultados` - Obtener análisis
- `POST /analisisResultados` - Crear análisis
- `PATCH /analisisResultados/:id` - Confirmar diagnóstico

### Dashboard
- `GET /dashboardData` - Datos del dashboard
- `GET /dashboardData?userId=1` - Dashboard por usuario
- `PUT /dashboardData/:id` - Actualizar dashboard

### Historial
- `GET /eventosHistoricos` - Eventos históricos
- `GET /eventosHistoricos?tipo=riego` - Eventos por tipo
- `POST /eventosHistoricos` - Crear evento
- `GET /datosGraficaAmbiental` - Datos para gráficas

### Riego
- `GET /riegoHistorial` - Historial de riego
- `GET /riegoManual` - Riegos manuales
- `POST /riegoManual` - Programar riego
- `GET /configuracionRiego` - Configuración
- `PUT /configuracionRiego/:id` - Actualizar configuración

### Suscripciones
- `GET /planes` - Obtener planes disponibles
- `GET /planes/:id` - Obtener plan específico
- `GET /suscripciones?userId=1&estado=activa` - Suscripción activa
- `POST /suscripciones` - Crear suscripción
- `PATCH /suscripciones/:id` - Cancelar suscripción
- `GET /transacciones?userId=1` - Historial de transacciones
- `POST /transacciones` - Crear transacción

## Características de JSON Server

### Filtros y Búsquedas
```bash
# Filtros básicos
GET /cultivos?userId=1
GET /alertas?estado=activa&severidad=alta

# Búsqueda de texto
GET /cultivos?nombre_like=Tomate

# Rangos de fechas
GET /eventos?fecha_gte=2025-06-01&fecha_lte=2025-06-07

# Ordenamiento
GET /cultivos?_sort=fechaPlantacion&_order=desc

# Paginación
GET /cultivos?_page=1&_limit=10
```

### Relaciones
```bash
# Expandir relaciones
GET /cultivos?_expand=user
GET /alertas?_embed=cultivo
```

## CORS y Configuración Adicional

Para desarrollo con Angular, JSON Server automáticamente habilita CORS. Si necesitas configuraciones específicas, puedes crear un archivo `middleware.js`:

```javascript
module.exports = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  next();
}
```

Y ejecutar:
```bash
json-server --watch db.json --middlewares middleware.js
```

## Scripts Recomendados para package.json

```json
{
  "scripts": {
    "start": "ng serve",
    "api": "json-server --watch db.json --port 3000 --delay 300",
    "dev": "concurrently \"npm run api\" \"npm run start\"",
    "build": "ng build",
    "test": "ng test"
  }
}
```

Para ejecutar Angular y JSON Server simultáneamente:
```bash
npm install --save-dev concurrently
npm run dev
```

## Datos de Prueba

### Usuario de prueba:
- **Email:** test@test.com
- **Contraseña:** 123456

### Endpoints útiles para testing:
- Dashboard: http://localhost:3000/dashboardData
- Cultivos: http://localhost:3000/cultivos
- Alertas: http://localhost:3000/alertasVisuales
- Planes: http://localhost:3000/planes

## Configuración del HttpClientModule

Asegúrate de tener configurado el HttpClientModule en tu `app.module.ts`:

```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    // ... otros imports
    HttpClientModule
  ],
  // ...
})
export class AppModule { }
```

## Manejo de Errores

Los servicios actualizados incluyen manejo de errores mejorado. Para debugging, puedes monitorear las requests en:
- Network tab del DevTools
- Console de JSON Server
- Logs de Angular

## Tips para Desarrollo

1. **Reiniciar JSON Server** cuando cambies el `db.json`
2. **Usar delay** para simular latencia real: `--delay 500`
3. **Backup del db.json** antes de hacer cambios importantes
4. **Usar snapshots** para diferentes estados de datos

## Estructura de Datos Recomendada

El archivo `db.json` está estructurado para simular una API REST real con:
- IDs consistentes
- Fechas en formato ISO
- Relaciones entre entidades
- Estados realistas
- Datos de ejemplo suficientes para testing

## Troubleshooting

### Error de CORS
Si tienes problemas de CORS, asegúrate de que JSON Server esté corriendo en el puerto correcto y que tu environment apunte a la URL correcta.

### Error 404
Verifica que las rutas en los servicios coincidan con las entidades en `db.json`.

### Datos no se actualizan
JSON Server escribe cambios al archivo `db.json` automáticamente. Si no se actualizan, verifica permisos de escritura.

### Puerto ocupado
Si el puerto 3000 está ocupado, usa: `json-server --watch db.json --port 3001`
