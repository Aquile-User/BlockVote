# 🗳️ BlockVote Backend

Sistema de votación descentralizado sin gas (gasless) implementado en la red de pruebas MegaETH usando meta-transacciones.

## 🌟 Características

- **Meta-Transacciones**: Los usuarios firman votos off-chain; un Relayer paga el gas en su nombre
- **API RESTful**: Express.js con documentación Swagger automática
- **Contratos Inteligentes**: Solidity con Hardhat para despliegue y pruebas
- **Gestión Temporal**: Elecciones con tiempos de inicio y fin configurables
- **Seguridad**: Sistema de autenticación basado en wallets y verificación de firmas
- **Red de Alto Rendimiento**: Optimizado para MegaETH testnet

## 🛠️ Stack Tecnológico

| Componente             | Tecnología                       |
| ---------------------- | -------------------------------- |
| **Blockchain**         | MegaETH Testnet (EVM Compatible) |
| **Smart Contracts**    | Solidity ^0.8.20                 |
| **Framework**          | Hardhat                          |
| **Backend**            | Node.js + Express.js             |
| **Blockchain Library** | Ethers.js v6                     |
| **Documentation**      | Swagger/OpenAPI                  |

## 📋 Prerrequisitos

- **Node.js** v16 o superior
- **npm** o **yarn**
- Cuenta financiada en MegaETH testnet para el Relayer/deployer
- Variables de entorno configuradas (ver `.env.example`)

### 💰 Obtener ETH de Prueba

Obtén ETH de testnet desde: [MegaETH Faucet](https://faucet.trade/megaeth-testnet-eth-faucet)

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd BlockVote/backend
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Crear y validar la configuración

```bash
npm run setup:env
```

Este comando hace la parte pesada por ti:

- crea `.env` desde `.env.example` si todavía no existe
- genera una clave privada nueva para el relayer si no había una válida
- valida que tengas RPC y dirección del contrato
- revisa en red si el relayer tiene fondos y si el contrato existe en esa dirección

Si el script te marca que falta algo, solo completa esos valores en `.env` y vuelve a ejecutarlo.
La clave del relayer queda guardada localmente en tu `.env`; no se comparte ni se publica.

### 4. Desplegar el contrato si hace falta

```bash
npm run deploy
```

Cuando termine, la dirección del contrato se escribe automáticamente en `.env` como `VOTING_CONTRACT_ADDRESS` y `CONTRACT_ADDRESS`.

### 5. Verificación final

```bash
npm run setup:env
```

Si este segundo pase no muestra errores de red, ya tienes la base lista para arrancar API y relayer.

## 🏃‍♂️ Ejecución

### Modo Desarrollo

Ejecuta ambos servicios simultáneamente:

```bash
# Terminal 1: Ejecutar API
npm run api

# Terminal 2: Ejecutar Relayer
npm run relayer
```

### Acceso a Servicios

- **API REST**: http://localhost:3000
- **Documentación Swagger**: http://localhost:3000/api-docs
- **Relayer**: Puerto configurado en el servicio

## 📡 API Endpoints

### 🔐 Autenticación

Este servicio provee dos tipos de autenticación: usuarios (wallets) y administradores (panel/API).

Usuarios (wallets):

- `POST /register` — Registrar nuevo usuario (firma + datos)
- `POST /login` — Iniciar sesión de usuario (wallet)

Administradores (panel/API):

- `POST /admin/login` — Inicia sesión de admin; el servidor devuelve una cookie `admin_token` HttpOnly (no accesible por JavaScript).
- `GET /admin/me` — Devuelve datos del admin autenticado (usa cookie o header `Authorization: Bearer ...`).
- `POST /admin/logout` — Borra la cookie `admin_token` en el servidor.
- `POST /admin/revoke` — (protegido) Invalida tokens incrementando `tokenVersion` en la base de datos.

Notas de seguridad importantes:

- El JWT de admin se firma con la variable de entorno `ADMIN_JWT_SECRET`.
- La cookie `admin_token` se entrega con atributos `HttpOnly` y `SameSite=Lax`.
- El middleware `requireAdmin` valida el token y compara `tokenVersion` para permitir revocación de sesiones.
- Las llamadas desde el frontend a rutas de administración deben usar `fetch(..., { credentials: 'include' })`.

### 🗳️ Gestión de Elecciones

| Método   | Endpoint         | Descripción                  |
| -------- | ---------------- | ---------------------------- |
| `GET`    | `/elections`     | Listar todas las elecciones  |
| `POST`   | `/elections`     | Crear nueva elección         |
| `GET`    | `/elections/:id` | Obtener detalles de elección |
| `PUT`    | `/elections/:id` | Actualizar elección          |
| `DELETE` | `/elections/:id` | Deshabilitar elección        |

### 🗳️ Votación

| Método | Endpoint                    | Descripción                    |
| ------ | --------------------------- | ------------------------------ |
| `POST` | `/vote`                     | Enviar voto (meta-transacción) |
| `GET`  | `/elections/:id/results`    | Obtener resultados             |
| `GET`  | `/elections/:id/candidates` | Listar candidatos              |

### 📊 Utilidades

| Método | Endpoint        | Descripción           |
| ------ | --------------- | --------------------- |
| `GET`  | `/health`       | Estado del servicio   |
| `GET`  | `/network-info` | Información de la red |

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   Blockchain    │
│   (React)       │◄──►│   (Express)     │◄──►│   (MegaETH)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Relayer       │
                       │   (Meta-TX)     │
                       └─────────────────┘
```

### Componentes Principales

#### 🤖 **Relayer Service** (`relayer/index.js`)

- Procesa meta-transacciones
- Paga gas en nombre de los usuarios
- Valida firmas y ejecuta transacciones

#### 🌐 **API Server** (`api/index.js`)

- Endpoints RESTful
- Gestión de usuarios y autenticación
- Interfaz con el contrato inteligente

#### 📜 **Smart Contract** (`contracts/Voting.sol`)

- Lógica de votación en blockchain
- Gestión de elecciones y candidatos
- Control de tiempos y permisos

## 🔧 Scripts Disponibles

```bash
# Despliegue
npm run deploy              # Desplegar contratos en MegaETH

# Desarrollo
npm run api                 # Ejecutar servidor API
npm run relayer            # Ejecutar servicio relayer

# Utilities
npx hardhat run scripts/checkBalance.js    # Verificar balance del relayer
npx hardhat run scripts/verifyElections.js # Verificar elecciones activas
```

Además disponibles:

```bash
# Crear el primer admin desde CLI
npm run create:admin        # Ejecuta scripts/createAdmin.js

# Prisma
npm run prisma:generate     # Generar cliente Prisma
npm run prisma:migrate      # Flujo local de migraciones (usar con precaución)
```

Base de datos — migraciones Prisma

Este proyecto usa Prisma con PostgreSQL. En desarrollo se puede usar `prisma db push` para sincronizar el esquema rápidamente, pero para entornos de staging/producción es recomendable usar migraciones versionadas en `prisma/migrations`.

Pasos recomendados:

1. Haz un backup de la base de datos antes de aplicar migraciones en staging/producción (`pg_dump`).
2. En desarrollo, generar y aplicar migración:

```bash
cd backend
npx prisma migrate dev --name add_admin_table
```

3. En staging/producción, aplicar migraciones ya generadas:

```bash
cd backend
npx prisma migrate deploy
```

4. Generar el cliente Prisma tras cambios de esquema:

```bash
npx prisma generate
```

Si el historial de migraciones en `prisma/migrations` no coincide con el estado real de la BD, `migrate dev` puede pedir un reset — no hagas reset en producción sin respaldo.

````

## 🧪 Testing

### Probar API con cURL

```bash
# Crear elección
curl -X POST http://localhost:3000/elections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elección de Prueba",
    "candidates": ["Candidato A", "Candidato B"],
    "startTime": 1640995200,
    "endTime": 1641081600
  }'

# Obtener elecciones
curl http://localhost:3000/elections

# Votar (requiere registro previo)
curl -X POST http://localhost:3000/vote \
  -H "Content-Type: application/json" \
  -d '{
    "electionId": 1,
    "candidate": "Candidato A",
    "voterAddress": "0x...",
    "signature": "0x..."
  }'
````

## 🔍 Solución de Problemas

### Problemas Comunes

| Problema              | Solución                                    |
| --------------------- | ------------------------------------------- |
| Error de conexión RPC | Verificar `BLOCKCHAIN_RPC_URL` en `.env`    |
| Insufficient funds    | Agregar ETH de testnet al relayer           |
| Contract not deployed | Ejecutar `npm run deploy`                   |
| Invalid signature     | Verificar formato de clave privada (sin 0x) |

### Logs y Debugging

```bash
# Ver logs del API
npm run api

# Ver logs del relayer con detalle
DEBUG=* npm run relayer

# Verificar estado de la red
npx hardhat run scripts/checkBalance.js --network megaeth
```

### 🛡️ Seguridad

### Consideraciones Importantes

- **Claves Privadas**: Nunca expongas claves privadas en código o en repositorios. Este proyecto **no** guarda claves privadas de usuarios en la base de datos por defecto. Si necesitas custodiar claves, usa un KMS/HSM o cifra con una clave maestra y almacénala en un secret manager.
- **Rate Limiting**: Implementado para prevenir spam.
- **Validación**: Todas las firmas son validadas antes de procesamiento.
- **Tiempos**: Las elecciones tienen ventanas de tiempo estrictas.

### Variables Sensibles

Mantén estas variables seguras y fuera del repositorio (usa `.env` que está en `.gitignore` o un secret manager):

- `RELAYER_PRIVATE_KEY` (relayer custodial — proteger con KMS)
- `DATABASE_URL` (cadena de conexión a Postgres)

Nota: No comitees `.env` ni archivos con secretos. Usa `.env.example` como plantilla y copia a `.env` con valores reales en tu entorno local o en tu CI/CD.

## 📁 Estructura del Proyecto

```
backend/
├── 📁 api/                 # Servidor API REST
│   └── index.js
├── 📁 artifacts/           # Artefactos compilados de Hardhat
├── 📁 contracts/           # Contratos inteligentes
│   └── Voting.sol
├── 📁 relayer/             # Servicio de meta-transacciones
│   └── index.js
├── 📁 scripts/             # Scripts de utilidad
│   ├── deploy.js
│   ├── checkBalance.js
│   └── verifyElections.js
├── hardhat.config.js       # Configuración de Hardhat
├── package.json
└── README.md
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🔗 Enlaces Útiles

- [MegaETH Testnet](https://megaeth.io)
- [Faucet MegaETH](https://faucet.trade/megaeth-testnet-eth-faucet)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org)

---

**Desarrollado con ❤️ para un futuro descentralizado**
