# Migración de datos

Este documento explica cómo preparar y ejecutar las migraciones del backend. El flujo normal usa Prisma + PostgreSQL. Las rutas desde SQLite o `users.json` son opcionales y sólo aplican si estás rescatando datos antiguos.

## Antes de empezar

- Trabaja desde la carpeta `backend/`.
- Verifica que `DATABASE_URL` apunte a PostgreSQL.
- No guardes `RELAYER_PRIVATE_KEY` ni `ADMIN_JWT_SECRET` en repositorios públicos.
- Si no quieres migrar claves privadas, usa `SKIP_PRIVATEKEY=true` en los scripts que lo soportan.

## Flujo normal de migración

### 1. Generar el cliente de Prisma

Ejecuta esto después de instalar dependencias o cuando cambie `schema.prisma`:

```bash
npm run prisma:generate
```

### 2. Aplicar las migraciones a PostgreSQL

Asegúrate de que `DATABASE_URL` ya apunta a la base correcta y luego ejecuta:

```bash
npm run prisma:migrate
```

Esto crea o actualiza las tablas definidas en `backend/prisma/schema.prisma`.

### 3. Verificar que la base quedó lista

Después de migrar, revisa que el backend pueda conectar y que Prisma responda sin errores. Si el proyecto ya está levantado, una comprobación rápida es iniciar el API y revisar el healthcheck.

## Migrar datos antiguos desde SQLite

Usa esta ruta sólo si aún tienes una base local heredada en `prisma/dev.db` y quieres copiarla a PostgreSQL.

### Paso a paso

1. Confirma que PostgreSQL ya está migrado con `npm run prisma:migrate`.
2. Revisa que `DATABASE_URL` apunte al destino final.
3. Ejecuta el script de copia:

```bash
npm run db:copy-sqlite-to-postgres
```

4. Si no quieres copiar claves privadas, ejecuta la misma orden con:

```bash
SKIP_PRIVATEKEY=true npm run db:copy-sqlite-to-postgres
```

## Migrar usuarios desde `users.json`

Esta ruta sólo aplica si conservas un archivo legacy `users.json` y necesitas importar esos registros al modelo actual.

### Paso a paso

1. Verifica que el esquema de Prisma ya esté aplicado.
2. Confirma que `DATABASE_URL` apunta a la base final.
3. Ejecuta la migración:

```bash
npm run db:migrate:users
```

4. Si quieres evitar persistir claves privadas, usa:

```bash
SKIP_PRIVATEKEY=true npm run db:migrate:users
```

## Limpiar claves privadas migradas por error

Si algún script dejó claves privadas almacenadas y necesitas borrarlas, ejecuta:

```bash
npm run db:clear-private-keys
```

## Recomendación final

Para instalaciones nuevas, no necesitas copiar datos legacy. Basta con configurar `DATABASE_URL`, correr `npm run prisma:generate` y luego `npm run prisma:migrate`. Las rutas de SQLite y `users.json` existen sólo para recuperación o compatibilidad histórica.
