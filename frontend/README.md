# BlockVote Frontend

Interfaz web de BlockVote construida con React y Vite. Este frontend cubre el acceso de usuarios y administradores, la visualización de elecciones, el panel de administración y la interacción con el contrato inteligente.

## Requisitos

- Node.js 16 o superior
- npm 7 o superior
- Backend de BlockVote en ejecución
- Dirección real del contrato desplegado

## Instalación

```bash
cd BlockVote/frontend
npm install
```

## Configuración

Crea un archivo `.env.local` en la raíz de `frontend/` con estas variables:

```env
VITE_CONTRACT_ADDRESS=0xTU_CONTRACT_ADDRESS_REAL
VITE_API_BASE_URL=http://localhost:3000
```

### Variables disponibles

- `VITE_CONTRACT_ADDRESS`: dirección del contrato de votación
- `VITE_API_BASE_URL`: URL base del backend
- `VITE_WS_URL`: opcional, reservada para futuras integraciones WebSocket

### Nota de configuración

El frontend consume variables `VITE_*` desde `src/config.js`.
Algunas utilidades de red en `src/api.js` todavía usan `http://localhost:3000` como valor por defecto, así que si cambias la URL del backend conviene revisar también ese archivo.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

- `npm run dev`: servidor de desarrollo con Vite
- `npm run build`: genera la versión de producción en `dist/`
- `npm run preview`: sirve localmente el build generado

## Estructura principal

```text
frontend/
├── public/
├── src/
│   ├── api.js
│   ├── App.jsx
│   ├── config.js
│   ├── main.jsx
│   ├── assets/
│   ├── pages/
│   ├── styles/
│   └── utils/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.cjs
└── eslint.config.js
```

## Pantallas principales

- `src/pages/auth/`: login y registro de usuarios y administradores
- `src/pages/user/`: panel de usuario
- `src/pages/admin/`: panel administrativo
- `src/pages/election/`: listado y detalle de elecciones
- `src/pages/common/`: componentes compartidos
- `src/pages/layout/`: layout y barra superior

## Tecnologías

- React
- Vite
- React Router DOM
- Tailwind CSS
- Framer Motion
- ECharts
- Axios
- Ethers.js
- React Hot Toast
- Lucide React

## Estado del proyecto

Este frontend no incluye scripts propios de lint o test. El flujo habitual es desarrollar con `npm run dev`, validar con `npm run build` y revisar la conexión con el backend y el contrato antes de desplegar.
