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

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del directorio backend:

```env
# Red Blockchain
BLOCKCHAIN_RPC_URL=https://carrot.megaeth.com/rpc
RPC_URL=https://carrot.megaeth.com/rpc

# Claves Privadas (SIN el prefijo 0x)
RELAYER_PRIVATE_KEY=tu_clave_privada_del_relayer_64_caracteres_hex
RELAYER_PK=tu_clave_privada_del_relayer_64_caracteres_hex

# API Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Contrato (se configurará después del despliegue)
VOTING_CONTRACT_ADDRESS=direccion_del_contrato_desplegado
```

### 4. Compilar Contratos

```bash
npx hardhat compile
```

### 5. Desplegar Contratos

```bash
npm run deploy
```

> **Nota**: Guarda la dirección del contrato desplegado y actualiza `VOTING_CONTRACT_ADDRESS` en tu archivo `.env`

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

| Método | Endpoint    | Descripción             |
| ------ | ----------- | ----------------------- |
| `POST` | `/register` | Registrar nuevo usuario |
| `POST` | `/login`    | Iniciar sesión          |

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
```

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

## 🛡️ Seguridad

### Consideraciones Importantes

- **Claves Privadas**: Nunca expongas claves privadas en código
- **Rate Limiting**: Implementado para prevenir spam
- **Validación**: Todas las firmas son validadas antes de procesamiento
- **Tiempos**: Las elecciones tienen ventanas de tiempo estrictas

### Variables Sensibles

Mantén estas variables seguras:

- `RELAYER_PRIVATE_KEY`
- `RELAYER_PK`

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
├── users.json              # Base de datos local de usuarios
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
