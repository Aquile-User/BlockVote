# 🗳️ BlockVote Frontend

Interfaz de usuario moderna y responsive para el sistema de votación descentralizado BlockVote, construida con React y tecnologías de vanguardia.

## 🌟 Características

- **🎨 Interfaz Moderna**: Diseño limpio y profesional con Tailwind CSS
- **📱 Responsive Design**: Optimizada para desktop, tablet y móvil
- **⚡ Rendimiento Optimizado**: Componentes con lazy loading y optimización automática
- **🔐 Autenticación Segura**: Login con MetaMask o billeteras generadas automáticamente
- **🎭 Animaciones Fluidas**: Transiciones y efectos con Framer Motion
- **📊 Visualización de Datos**: Gráficos interactivos con ECharts
- **🌐 Internacionalización**: Soporte para múltiples idiomas
- **♿ Accesibilidad**: Cumple con estándares WCAG 2.1

## 🛠️ Stack Tecnológico

| Categoría         | Tecnología       | Versión  | Propósito                        |
| ----------------- | ---------------- | -------- | -------------------------------- |
| **Framework**     | React            | ^18.3.1  | Biblioteca principal de UI       |
| **Build Tool**    | Vite             | ^5.4.10  | Bundler y servidor de desarrollo |
| **Routing**       | React Router DOM | ^6.28.0  | Navegación SPA                   |
| **Styling**       | Tailwind CSS     | ^3.4.14  | Framework de CSS utility-first   |
| **Animations**    | Framer Motion    | ^11.11.9 | Animaciones y transiciones       |
| **Charts**        | ECharts          | ^5.5.0   | Visualización de datos           |
| **Icons**         | Lucide React     | ^0.460.0 | Biblioteca de iconos             |
| **HTTP Client**   | Axios            | ^1.7.7   | Peticiones HTTP                  |
| **Blockchain**    | Ethers.js        | ^6.13.4  | Interacción con blockchain       |
| **Notifications** | React Hot Toast  | ^2.4.1   | Sistema de notificaciones        |

## 📁 Estructura del Proyecto

```
frontend/
├── 📁 public/                  # Archivos estáticos
│   ├── favicon.ico
│   └── firewall.png
├── 📁 src/                     # Código fuente
│   ├── 📁 components/          # Componentes React organizados
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
│   │   ├── dominican.js
│   │   └── provinceUtils.js
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
- **Backend de BlockVote** ejecutándose en http://localhost:3000

### **1. Clonar e Instalar**

```bash
# Navegar al directorio frontend
cd BlockVote/frontend

# Instalar dependencias
npm install
```

### **2. Configurar Variables de Entorno**

Crea un archivo `.env.local` en la raíz del frontend:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Blockchain Configuration
VITE_BLOCKCHAIN_RPC_URL=https://carrot.megaeth.com/rpc
VITE_CHAIN_ID=6342
VITE_NETWORK_NAME=MegaETH Testnet

# Application Settings
VITE_APP_NAME=BlockVote
VITE_APP_VERSION=2.0.0
VITE_DEBUG_MODE=false

# MetaMask Integration
VITE_METAMASK_DEEP_LINK=https://metamask.app.link/dapp/
```

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

# Acceder a: http://localhost:5173
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

## 🎨 Guía de Componentes

### **🔐 Componentes de Autenticación**

#### **UserLogin.jsx**

- Login para usuarios regulares
- Validación de cédula dominicana
- Integración con localStorage

#### **UserRegister.jsx**

- Registro en 3 pasos
- Generación automática de billeteras
- Integración con MetaMask

#### **AdminLogin.jsx**

- Login administrativo con diseño futurista
- Animaciones avanzadas
- Autenticación especial

### **📊 Componentes de Dashboard**

#### **UserDashboard.jsx**

- Panel principal del usuario
- Estadísticas de votación
- Gráficos interactivos
- Estado de la red blockchain

#### **AdminDashboard.jsx**

- Panel de control administrativo
- Gestión de sistema
- Métricas avanzadas

### **🗳️ Componentes de Elecciones**

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

### **🎭 Componentes de Animación**

```jsx
// Ejemplo de animación con Framer Motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  <ComponenteContent />
</motion.div>
```

## 🔧 Configuración Avanzada

### **⚡ Optimización de Vite**

```javascript
// vite.config.js - Configuración optimizada
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["framer-motion", "lucide-react"],
        },
      },
    },
  },
});
```

### **🎨 Configuración de PostCSS**

```javascript
// postcss.config.cjs
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## 🔌 Integración con Backend

### **📡 Cliente API**

```javascript
// api.js - Configuración del cliente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
```

### **🌐 Endpoints Principales**

| Endpoint         | Método | Descripción          |
| ---------------- | ------ | -------------------- |
| `/elections`     | GET    | Listar elecciones    |
| `/elections/:id` | GET    | Detalles de elección |
| `/vote`          | POST   | Enviar voto          |
| `/register`      | POST   | Registrar usuario    |
| `/login`         | POST   | Iniciar sesión       |

## 🧪 Testing y Calidad

### **📋 Checklist de Calidad**

- ✅ **Responsive Design** - Funciona en todos los dispositivos
- ✅ **Performance** - Lighthouse Score > 90
- ✅ **Accessibility** - Cumple WCAG 2.1 AA
- ✅ **SEO** - Meta tags optimizados
- ✅ **Security** - Validación de inputs, sanitización
- ✅ **Error Handling** - Manejo robusto de errores

### **🔍 Herramientas de Análisis**

```bash
# Analizar bundle size
npm run build
npx vite-bundle-analyzer dist

# Lighthouse audit
npx lighthouse http://localhost:5173 --view
```

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

- **Componentes**: PascalCase (`UserDashboard.jsx`)
- **Funciones**: camelCase (`handleSubmit`)
- **Constantes**: UPPER_CASE (`API_BASE_URL`)
- **CSS Classes**: kebab-case (`user-dashboard`)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🔗 Enlaces Útiles

- [Documentación de React](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion)
- [ECharts Documentation](https://echarts.apache.org)
- [Ethers.js Documentation](https://docs.ethers.org)

---

**Desarrollado con ❤️ para un futuro descentralizado**

_BlockVote Frontend v2.0.0 - Sistema de Votación Blockchain_
