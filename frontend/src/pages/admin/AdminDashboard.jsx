import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CONFIG } from "../../config";
import {
  ShieldCheck,
  Settings,
  Database,
  Activity,
  Vote,
  RefreshCw,
  LogOut,
  Globe,
  Server,
  Clock,
  Monitor,
  Cpu
} from "lucide-react";
import AdminLogin from "../auth/AdminLogin";
import ElectionManagement from "./ElectionManagement";

// Componente reutilizable para las cards de estado del sistema
const StatusCard = ({ icon: Icon, title, status, description, colorClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClass} border p-6 hover:shadow-lg transition-all duration-300`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-current/5 to-current/5"></div>
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-8 h-8 ${colorClass.includes('indigo') ? 'text-indigo-600' :
          colorClass.includes('blue') ? 'text-blue-600' :
            colorClass.includes('purple') ? 'text-purple-600' : 'text-amber-600'}`} />
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass.includes('indigo') ? 'bg-indigo-100 text-indigo-700' :
            colorClass.includes('blue') ? 'bg-blue-100 text-blue-700' :
              colorClass.includes('purple') ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
          }`}>
          {status}
        </span>
      </div>
      <h3 className={`font-bold mb-1 ${colorClass.includes('indigo') ? 'text-indigo-800' :
          colorClass.includes('blue') ? 'text-blue-800' :
            colorClass.includes('purple') ? 'text-purple-800' : 'text-amber-800'
        }`}>
        {title}
      </h3>
      <p className={`text-sm ${colorClass.includes('indigo') ? 'text-indigo-600' :
          colorClass.includes('blue') ? 'text-blue-600' :
            colorClass.includes('purple') ? 'text-purple-600' : 'text-amber-600'
        }`}>
        {description}
      </p>
    </div>
  </motion.div>
);

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado por defecto para errores
  const defaultErrorState = {
    status: "error",
    timestamp: new Date().toISOString(),
    circuitBreaker: { state: "UNKNOWN", failureCount: 0 },
    api: { status: "error", version: "N/A", port: 3000 },
    blockchain: { status: "error", network: "Desconocido", blockNumber: 0, contractDeployed: false },
    users: { registered: 0, storage: "unknown" },
    relayer: { status: "unreachable", port: 3001 },
    uptime: 0
  };

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuthenticated');
    const adminSession = localStorage.getItem('adminSession');
    if (adminAuth === 'true' || adminSession === 'true') {
      setIsAuthenticated(true);
      fetchSystemHealth();
    }
  }, []);

  const fetchSystemHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/health');
      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error('Error al obtener estado del sistema:', error);
      setSystemHealth({ ...defaultErrorState, error: error.message });
    } finally {
      setLoading(false);
    }
  }; const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminSession');
    setIsAuthenticated(false);
    setActiveTab('overview');
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  // Configuración de los datos para las cards de estado
  const getStatusCardsData = () => {
    if (!systemHealth) return [];

    return [
      {
        icon: Database,
        title: "Base de Datos",
        status: systemHealth.users ? 'active' : systemHealth.status === 'healthy' ? 'active' : 'unknown',
        description: systemHealth.users ?
          `Usuarios: ${systemHealth.users.registered}\nTipo: ${systemHealth.users.storage}` :
          `Estado: ${systemHealth.status}`,
        colorClass: "from-indigo-50 to-indigo-100/50 border-indigo-200/50",
        delay: 0.2
      },
      {
        icon: ShieldCheck,
        title: "Blockchain",
        status: systemHealth.blockchain?.status || (systemHealth.status === 'healthy' ? 'connected' : 'unknown'),
        description: systemHealth.blockchain ?
          `Red: ${systemHealth.blockchain.network}\nBloque: #${systemHealth.blockchain.blockNumber}\nContrato: ${systemHealth.blockchain.contractDeployed ? '✅ Desplegado' : '❌ No encontrado'}` :
          `Estado: ${systemHealth.status}`,
        colorClass: "from-blue-50 to-blue-100/50 border-blue-200/50",
        delay: 0.3
      },
      {
        icon: Cpu,
        title: "Servicio Relayer",
        status: systemHealth.relayer?.status || 'unknown',
        description: systemHealth.relayer ?
          `Estado: ${systemHealth.relayer.status}\nPuerto: ${systemHealth.relayer.port}` :
          'Sin información',
        colorClass: "from-purple-50 to-purple-100/50 border-purple-200/50",
        delay: 0.35
      },
      {
        icon: Monitor,
        title: "Estado General",
        status: systemHealth.status,
        description: `Circuit Breaker: ${systemHealth.circuitBreaker?.state || 'N/A'}\nUptime: ${systemHealth.uptime ? `${Math.floor(systemHealth.uptime)}s` : 'N/A'}`,
        colorClass: "from-amber-50 to-amber-100/50 border-amber-200/50",
        delay: 0.4
      }
    ];
  };

  const tabs = [
    { id: 'overview', label: 'Vista General', icon: Activity },
    { id: 'elections', label: 'Gestión de Elecciones', icon: Vote }
  ]; const renderOverview = () => (
    <div className="space-y-8">
      {/* System Health Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Activity className="w-8 h-8 text-primary" />
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Monitor del Sistema</h2>
              <p className="text-gray-600">Estado y rendimiento en tiempo real</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchSystemHealth}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg shadow-sm transition-colors duration-300"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="ml-2">Actualizar</span>
          </motion.button>
        </div>

        {systemHealth ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getStatusCardsData().map((card, index) => (
              <StatusCard key={index} {...card} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando estado del sistema...</p>
          </div>
        )}
      </motion.div>

      {/* Blockchain Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="relative">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div className="absolute -inset-1 bg-primary/20 rounded-full blur animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Configuración Blockchain</h2>
            <p className="text-gray-600">Información de red y contratos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Network Information */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-primary-500" />
              Detalles de Red
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Red', value: systemHealth?.blockchain?.network || 'Desconectado', isStatus: true },
                { label: 'Estado', value: systemHealth?.blockchain?.status || 'Sin conexión', isStatus: true },
                { label: 'Bloque Actual', value: `#${systemHealth?.blockchain?.blockNumber || 'N/A'}` },
              ].map(({ label, value, isStatus }, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-600">{label}:</span>
                  <span className={`font-medium ${isStatus ?
                    `px-3 py-1 rounded-full text-sm ${value.includes('connected') || value.includes('Desconectado') ?
                      value.includes('connected') ? 'text-emerald-700 bg-emerald-100' : 'text-primary-700 bg-primary-50' :
                      'text-red-700 bg-red-100'}` : 'text-gray-800'}`}>
                    {value}
                  </span>
                </div>
              ))}
              <div className="pt-2">
                <span className="text-gray-600 block mb-2">Dirección del Contrato:</span>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 break-all border border-gray-100">
                  {systemHealth?.blockchain?.contractAddress || CONFIG.CONTRACT_ADDRESS || 'No disponible'}
                </div>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2 text-primary-500" />
              Configuración del Servicio
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Versión API', value: systemHealth?.api?.version || 'N/A' },
                { label: 'Estado API', value: systemHealth?.api?.status || 'Sin conexión', isStatus: true },
                { label: 'Puerto API', value: systemHealth?.api?.port || 'N/A' },
                {
                  label: 'Última Verificación',
                  value: systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleTimeString() : 'N/A',
                  hasIcon: true
                },
              ].map(({ label, value, isStatus, hasIcon }, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-600">{label}:</span>
                  <span className={`font-medium flex items-center ${isStatus ?
                    `px-3 py-1 rounded-full text-sm ${value === 'online' ?
                      'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}` : 'text-gray-800'}`}>
                    {hasIcon && <Clock className="w-4 h-4 mr-1" />}
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      {/* Header */}
      <div className="relative p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-3"
            >
              <Settings className="w-7 h-7 text-primary-600" />
              <h1 className="text-4xl font-bold text-primary-700">
                Panel de Administración
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-600 text-lg max-w-2xl"
            >
              Gestiona el sistema de votación y monitorea la seguridad de la plataforma
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 lg:mt-0"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm transition-colors duration-300"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative backdrop-blur-sm bg-white/60 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-3 py-6 px-4 font-medium text-sm transition-all duration-300 group ${activeTab === tab.id
                    ? 'text-primary-600 bg-primary-50/80'
                    : 'text-gray-600 hover:text-primary-600'
                    }`}
                >
                  <Icon className={`w-5 h-5 transition-all duration-300 ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'
                    }`} />
                  <span className="relative z-10">{tab.label}</span>

                  {/* Active indicator */}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-full shadow-sm"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Hover background */}
                  <div className={`absolute inset-0 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 ${activeTab === tab.id
                    ? 'bg-primary-100/0'
                    : 'bg-primary-50/80'
                    }`}></div>
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'elections' && <ElectionManagement />}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;
