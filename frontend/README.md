# 🗳️ BlockVote Frontend

Interfaz de usuario moderna y responsive para el sistema de votación descentralizado BlockVote, construida con React y tecnologías de vanguardia.

> **Nombre del proyecto**: `ether-vote-frontend` (package.json) | **Nombre público**: BlockVote Frontend

## 🌟 Características

- **🎨 Interfaz Moderna**: Diseño limpio y profesional con Tailwind CSS y componentes animados
- **📱 Responsive Design**: Experiencia optimizada para desktop, tablet y móvil
- **⚡ Dashboard Interactivo**: Panel de usuario con estadísticas en tiempo real y visualizaciones
- **🔐 Autenticación Segura**: Login con verificación de identidad y registro simplificado
- **🎭 Animaciones Fluidas**: Transiciones y efectos con Framer Motion para mejor experiencia
- **📊 Visualización de Datos**: Gráficos interactivos con ECharts para análisis de votaciones
- **🗳️ Gestión de Elecciones**: Administración completa con wizard de creación y análisis detallado
- **📈 Estadísticas Demográficas**: Análisis de participación por provincias

## 🛠️ Stack Tecnológico

| Categoría         | Tecnología        | Versión  | Propósito                        |
| ----------------- | ----------------- | -------- | -------------------------------- |
| **Framework**     | React             | ^18.3.1  | Biblioteca principal de UI       |
| **Build Tool**    | Vite              | ^5.4.10  | Bundler y servidor de desarrollo |
| **Routing**       | React Router DOM  | ^6.28.0  | Navegación SPA                   |
| **Styling**       | Tailwind CSS      | ^3.4.14  | Framework de CSS utility-first   |
| **Animations**    | Framer Motion     | ^11.11.9 | Animaciones y transiciones       |
| **Charts**        | ECharts           | ^5.5.0   | Visualización de datos           |
| **Charts React**  | ECharts for React | ^3.0.2   | Wrapper de ECharts para React    |
| **Icons**         | Lucide React      | ^0.460.0 | Biblioteca de iconos             |
| **HTTP Client**   | Axios             | ^1.7.7   | Peticiones HTTP                  |
| **Blockchain**    | Ethers.js         | ^6.13.4  | Interacción con blockchain       |
| **Notifications** | React Hot Toast   | ^2.4.1   | Sistema de notificaciones        |
| **Linting**       | ESLint            | ^9.x     | Análisis de código y estilo      |

## 📁 Estructura del Proyecto

```
frontend/
├── 📁 public/                  # Archivos estáticos
│   ├── favicon.ico
│   └── firewall.png
├── 📁 src/                     # Código fuente
│   ├── 📁 pages/               # Páginas y componentes React organizados
│   │   │                       # (Anteriormente 'components' - reorganizado por páginas)
│   │   ├── 📁 auth/            # Autenticación
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── UserLogin.jsx
│   │   │   ├── UserRegister.jsx
│   │   │   └── AuthWrapper.jsx
│   │   ├── 📁 admin/           # Panel administrativo
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ElectionManagement.jsx
│   │   ├── 📁 user/            # Componentes de usuario
│   │   │   └── UserDashboard.jsx
│   │   ├── 📁 election/        # Gestión de elecciones
│   │   │   ├── ElectionList.jsx
│   │   │   └── ElectionDetail.jsx
│   │   ├── 📁 layout/          # Componentes de layout
│   │   │   └── Topbar.jsx
│   │   └── 📁 common/          # Componentes compartidos
│   │       └── NetworkStatus.jsx
│   ├── 📁 assets/              # Recursos multimedia
│   │   ├── firewallAqua.png
│   │   └── MetaMask-icon-fox.svg
│   ├── 📁 styles/              # Estilos globales
│   │   └── main.css
│   ├── 📁 utils/               # Utilidades
│   │   ├── dominicanRepublic.js # Datos y validación de República Dominicana
│   │   └── demographics.js     # Mapeo demográfico y poblacional
│   ├── api.js                  # Cliente API
│   ├── config.js               # Configuración
│   ├── App.jsx                 # Componente principal
│   └── main.jsx                # Punto de entrada
├── 📄 index.html               # Template HTML
├── 📄 package.json             # Dependencias y scripts
├── 📄 vite.config.js           # Configuración de Vite
├── 📄 tailwind.config.js       # Configuración de Tailwind
├── 📄 postcss.config.cjs       # Configuración de PostCSS
└── 📄 eslint.config.js         # Configuración de ESLint
```

## 🚀 Instalación y Configuración

### **Prerrequisitos**

- **Node.js** v16.0.0 o superior
- **npm** v7.0.0 o superior (incluido con Node.js)
- **Backend de BlockVote** configurado con `npm run setup:env` y, si hace falta, `npm run deploy`
- La address del contrato en el frontend debe coincidir con la que quedó guardada en el backend

### **1. Clonar e Instalar**

```bash
# Navegar al directorio frontend
cd BlockVote/frontend

# Instalar dependencias
npm install
```

Antes de abrir el frontend, asegúrate de que el backend ya tenga su `.env` creado y el contrato desplegado. El script del backend puede dejarte lista la parte de la configuración y guardar la address del contrato en su `.env`.

### **1.1 Configurar la address del contrato**

Crea un archivo `.env.local` en la raíz de `frontend/` con esta variable:

```env
VITE_CONTRACT_ADDRESS=0xTU_CONTRACT_ADDRESS_REAL
VITE_API_BASE_URL=http://localhost:3000
```

Usa exactamente la misma address que quedó guardada en `backend/.env` como `VOTING_CONTRACT_ADDRESS`. Si redeployas el contrato, actualiza este valor también.

El frontend lee estas variables desde `src/config.js`:

```javascript
// src/config.js - Configuración principal
export const CONFIG = {
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || "",
  API_BASE: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
};
```

### **1.2 Variables soportadas en el frontend**

- `VITE_CONTRACT_ADDRESS`: address del contrato desplegado en MegaETH
- `VITE_API_BASE_URL`: URL del backend HTTP
- `VITE_WS_URL`: opcional, si luego conectas WebSockets

### **1.3 .env vs .env.local**

- `.env`: base compartida para variables generales del proyecto
- `.env.local`: overrides locales de tu máquina; este proyecto lo usa para el frontend y normalmente no se sube al repositorio

En este proyecto, el frontend debe usar `.env.local` para que cada persona pueda apuntar al contrato real sin tocar `src/config.js`.

### **2. Ejecutar en Desarrollo**

```bash
# Iniciar servidor de desarrollo
npm run dev

# Acceder a: http://localhost:5173
```

### **3. Construir para Producción**

```bash
# Crear build optimizado
npm run build

# Vista previa del build
npm run preview
```

Si `VITE_CONTRACT_ADDRESS` no está definida, el frontend no tendrá una address de contrato válida para votar o leer resultados.

### **3. Configurar Tailwind CSS (ya configurado)**

El proyecto ya incluye la configuración de Tailwind con temas personalizados:

```javascript
// tailwind.config.js - Configuración personalizada incluida
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          /* colores personalizados */
        },
        light: {
          /* tema claro */
        },
      },
    },
  },
};
```

## 🏃‍♂️ Comandos de Desarrollo

### **Desarrollo Local**

```bash
# Servidor de desarrollo con hot reload
npm run dev

# Acceder a: http://localhost:5173 (o puerto alternativo si está ocupado)
```

### **Build para Producción**

```bash
# Crear build optimizado
npm run build

# Vista previa del build
npm run preview
```

### **Scripts Disponibles**

| Comando           | Descripción            | Uso                    |
| ----------------- | ---------------------- | ---------------------- |
| `npm run dev`     | Servidor de desarrollo | Desarrollo local       |
| `npm run build`   | Build de producción    | Despliegue             |
| `npm run preview` | Vista previa del build | Testing pre-despliegue |

> **Nota**: No se incluyen scripts de linting o testing en la configuración actual.

## 🎨 Guía de Páginas y Componentes

### **� Área de Usuario**

#### **UserDashboard.jsx**

- Dashboard interactivo con métricas de participación
- Visualización de estadísticas en tiempo real
- Gráfico de participación por provincias
- Listado de elecciones activas, próximas y finalizadas
- Resumen detallado de elecciones seleccionadas

### **🗳️ Gestión de Elecciones**

#### **ElectionList.jsx**

- Listado avanzado de elecciones con filtros
- Tarjetas interactivas con animaciones
- Indicadores de estado y participación
- Buscador y filtros de estado
- Interfaz optimizada con animaciones fluidas

#### **ElectionDetail.jsx**

- Vista detallada de cada elección
- Resultados en tiempo real con gráficos
- Información completa de candidatos y fechas
- Sistema de votación con confirmación

### **⚙️ Administración**

#### **ElectionManagement.jsx**

- Creación de elecciones con wizard de 4 pasos
- Gestión de candidatos y fechas
- Panel de control administrativo
- Estadísticas detalladas de participación
- Habilitación/deshabilitación de elecciones

### **🔐 Autenticación**

#### **UserLogin.jsx / AdminLogin.jsx**

- Login para usuarios y administradores
- Validación de identidad
- Interfaz intuitiva con feedback visual
- Integración con MetaMask

#### **AdminLogin.jsx**

- Login administrativo con diseño futurista
- Animaciones avanzadas
- Autenticación especial

## 🏃‍♂️ Características Técnicas Principales

### **🎭 Sistema de Animaciones**

El frontend utiliza Framer Motion para ofrecer una experiencia de usuario fluida:

```jsx
// Ejemplo de animaciones en componentes
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="card-container"
>
  <ElectionCard />
</motion.div>
```

### **📊 Visualización de Datos**

Implementación de gráficos interactivos con ECharts:

```jsx
// Ejemplo de configuración de gráficos
const provinceVotesOption = {
  series: [
    {
      name: "Usuarios por Provincia",
      type: "pie",
      radius: ["35%", "75%"],
      data: provinceData.map((item) => ({
        value: item.registered || 0,
        name: item.name,
      })),
    },
  ],
};

<ReactECharts option={provinceVotesOption} />;
```

### **⚡ Optimización de Rendimiento**

- **API con stagger delay**: Previene sobrecarga de la blockchain
- **Carga inteligente**: Prioriza datos esenciales
- **Manejo de errores robusto**: Fallbacks para escenarios sin conexión

### **💼 Estados de Elecciones**

Manejo avanzado de estados con configuraciones visuales:

```jsx
// Sistema unificado de estados
const STATUS_CONFIGS = {
  active: {
    color: "text-emerald-600 bg-emerald-50",
    icon: <Vote className="w-4 h-4" />,
    text: "Activa",
    priority: 1,
  },
  upcoming: {
    color: "text-primary-600 bg-primary-50",
    icon: <Clock className="w-4 h-4" />,
    text: "Próxima",
    priority: 2,
  },
  // Más estados...
};
```

### **📱 Diseño Responsive**

- Interfaz adaptativa para móvil, tablet y desktop
- Componentes con diseño fluido
- Optimizado para pantallas de cualquier tamaño

### **📊 Páginas de Dashboard**

#### **UserDashboard.jsx**

- Panel principal del usuario
- Estadísticas de votación
- Gráficos interactivos
- Estado de la red blockchain

#### **AdminDashboard.jsx**

- Panel de control administrativo
- Gestión de sistema
- Métricas avanzadas

### **🗳️ Páginas de Elecciones**

#### **ElectionList.jsx**

- Lista paginada de elecciones
- Filtros y búsqueda
- Estados de elección en tiempo real

#### **ElectionDetail.jsx**

- Detalles completos de elección
- Interfaz de votación
- Resultados en tiempo real

## 🎯 Funcionalidades Principales

### **1. 🔐 Sistema de Autenticación**

```javascript
// Ejemplo de uso del sistema de auth
const handleLogin = async (credentials) => {
  const user = await loginUser(credentials);
  setUser(user);
  setIsConnected(true);
};
```

### **2. 🗳️ Proceso de Votación**

```javascript
// Flujo de votación con meta-transacciones
const vote = async (electionId, candidate) => {
  const signature = await signVote(user, electionId, candidate);
  await submitVote(electionId, candidate, signature);
};
```

### **3. 📊 Visualización de Datos**

```javascript
// Configuración de gráficos ECharts
const chartOption = {
  tooltip: { trigger: "item" },
  series: [
    {
      type: "pie",
      data: electionResults,
    },
  ],
};
```

## 🎨 Sistema de Diseño

### **🎨 Paleta de Colores**

```css
/* Colores principales */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;

/* Colores secundarios */
--emerald-50: #ecfdf5;
--emerald-500: #10b981;
--emerald-600: #059669;
```

### **📱 Breakpoints Responsive**

| Dispositivo   | Ancho          | Clase Tailwind |
| ------------- | -------------- | -------------- |
| Mobile        | < 640px        | `sm:`          |
| Tablet        | 640px - 768px  | `md:`          |
| Desktop       | 768px - 1024px | `lg:`          |
| Large Desktop | > 1024px       | `xl:`          |

## 📋 Oportunidades de Mejora

El proyecto está constantemente evolucionando. Algunas áreas en las que se está trabajando:

### **🚀 Optimización de Rendimiento**

- Implementación de React Query/SWR para cache inteligente
- Lazy loading de componentes pesados
- Virtualización de listas extensas

### **🎨 Mejoras de UX**

- Skeleton loaders para mejor experiencia durante carga
- Mensajes contextuales más detallados
- Tutoriales integrados para usuarios nuevos

### **📱 Mejoras en Mobile**

- Gestos optimizados para navegación táctil
- Modo offline con sincronización posterior
- Mejora en formularios adaptados a pantallas pequeñas

### **🔧 Mejoras Técnicas**

- Separación de componentes grandes en archivos independientes
- Debounce en búsquedas y filtros
- Optimización de re-renderizados con useMemo/useCallback

## 🔌 API y Blockchain

El frontend se conecta a un backend en Node.js y a la blockchain a través del smart contract de votación:

```javascript
// api.js - Cliente API con manejo de rate limiting
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Retry lógico para rate limiting (429)
    if (response?.status === 429 && !config._retryCount) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < 3) {
        // Implementación de backoff exponencial...
        return axios(config);
      }
    }
    return Promise.reject(error);
  }
);

// Funciones principales de la API
export const getElections = async () => {
  /* ... */
};
export const getResults = async (electionId) => {
  /* ... */
};
export const vote = async (electionId, candidate, userAddress) => {
  /* ... */
};
```

## 🧪 Despliegue y Testing

### **� Build y Despliegue**

```bash
# Construir para producción
npm run build

# Vista previa local
npm run preview

# Deployment a Vercel/Netlify
# Configurar en plataformas respectivas
```

### **🔍 Verificación de Compatibilidad**

La aplicación está probada en:

- Chrome/Edge/Firefox/Safari en desktop
- iOS y Android en dispositivos móviles
- Tablets con diferentes resoluciones

## 🚀 Despliegue

### **🌐 Opciones de Hosting**

#### **Vercel (Recomendado)**

```bash
npm install -g vercel
vercel --prod
```

#### **Netlify**

```bash
npm run build
# Subir carpeta dist/ a Netlify
```

#### **GitHub Pages**

```bash
npm install --save-dev gh-pages
npm run build
npx gh-pages -d dist
```

### **🔧 Variables de Entorno para Producción**

```env
VITE_API_BASE_URL=https://api.blockvote.com
VITE_BLOCKCHAIN_RPC_URL=https://mainnet.blockchain.com
VITE_DEBUG_MODE=false
```

## 🛠️ Solución de Problemas

### **Problemas Comunes**

| Problema                  | Solución                            |
| ------------------------- | ----------------------------------- |
| **Puerto 5173 ocupado**   | Cambiar puerto en `vite.config.js`  |
| **Error de CORS**         | Verificar configuración del backend |
| **MetaMask no detectado** | Instalar extensión de MetaMask      |
| **Build falla**           | Verificar imports y dependencies    |

### **🔍 Debugging**

```javascript
// Habilitar modo debug
localStorage.setItem("debug", "true");

// Ver logs detallados
console.log("Estado de la aplicación:", appState);
```

## 📊 Métricas de Rendimiento

### **⚡ Build Statistics**

- **Bundle Size**: ~637 KB (gzipped)
- **Initial Load**: < 2s en 3G
- **First Paint**: < 1s
- **Interactive**: < 3s

### **📱 Compatibilidad**

| Navegador | Versión Mínima | Soporte     |
| --------- | -------------- | ----------- |
| Chrome    | 88+            | ✅ Completo |
| Firefox   | 85+            | ✅ Completo |
| Safari    | 14+            | ✅ Completo |
| Edge      | 88+            | ✅ Completo |

## 🤝 Contribución

### **📋 Guía de Contribución**

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Abre** un Pull Request

### **📏 Estándares de Código**

- **Páginas/Componentes**: PascalCase (`UserDashboard.jsx`)
- **Funciones**: camelCase (`handleSubmit`)
- **Constantes**: UPPER_CASE (`API_BASE_URL`)
- **CSS Classes**: kebab-case (`user-dashboard`)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para un futuro electoral transparente y descentralizado**

_BlockVote Frontend v2.0.0 - © 2025_
