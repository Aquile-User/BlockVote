# Migración de Datos (Legacy / Opcional)

Este documento contiene instrucciones detalladas para migrar datos desde la antigua base local (`users.json` o SQLite `dev.db`) hacia PostgreSQL usando Prisma. Estas instrucciones son opcionales y se mantienen solo para equipos que necesiten reproducir migraciones históricas. Para instalaciones nuevas, la base de datos por defecto es PostgreSQL y no es necesario seguir estos pasos.

## Consideraciones

- No se recomienda almacenar claves privadas en la base de datos en claro. Usa `SKIP_PRIVATEKEY=true` en los scripts si no quieres migrar private keys.
- Asegura `DATABASE_URL` y `RELAYER_PRIVATE_KEY` en un secret manager; no las comitees.

## Generar cliente Prisma

```bash
npm run prisma:generate
```

## Aplicar migraciones (Postgres)

Asegúrate de tener `DATABASE_URL` apuntando a tu base de datos Postgres y luego:

```bash
npm run prisma:migrate
```

## Copiar datos desde SQLite (opcional)

Si tienes una base de desarrollo `prisma/dev.db`, puedes copiar registros a Postgres con el script incluido:

```bash
npm run db:copy-sqlite-to-postgres
# Para evitar importar private keys:
SKIP_PRIVATEKEY=true npm run db:copy-sqlite-to-postgres
```

## Migrar `users.json` (opcional)

Si aún cuentas con `users.json` y necesitas insertar esos usuarios en la base de datos:

```bash
npm run db:migrate:users
# Usa SKIP_PRIVATEKEY=true para no persistir claves
SKIP_PRIVATEKEY=true npm run db:migrate:users
```

## Limpiar claves privadas en la DB

Si migraste claves por error, puedes borrarlas con:

```bash
npm run db:clear-private-keys
```

## Nota final

Estas instrucciones son para casos muy específicos (recuperación de datos, migraciones legacy, auditoría). Para cualquier despliegue nuevo, configura `DATABASE_URL` a una instancia PostgreSQL gestionada y usa las migraciones estándar de Prisma desde `prisma/`.
