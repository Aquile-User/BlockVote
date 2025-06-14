import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CONFIG } from "../config";
import {
  ShieldCheck,
  Settings,
  Database,
  Activity,
  Users,
  Vote,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Sparkles,
  Globe,
  Server,
  Lock,
  TrendingUp,
  Clock,
  Monitor,
  Zap
} from "lucide-react";
import AdminLogin from "./AdminLogin";
import ElectionManagement from "./ElectionManagement";

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Check if admin is already logged in
    const adminAuth = localStorage.getItem('adminAuthenticated');
    const adminSession = localStorage.getItem('adminSession');
    if (adminAuth === 'true' || adminSession === 'true') {
      setIsAuthenticated(true);
      fetchSystemHealth();
    }
  }, []); const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      console.log('Obteniendo estado del sistema...');
      const response = await fetch('http://localhost:3000/health');

      if (!response.ok) {
        throw new Error(`Error al obtener estado del sistema: ${response.status}`);
      }

      const data = await response.json();
      console.log('Estado del sistema:', data); setSystemHealth(data);
    } catch (error) {
      console.error('Error al obtener estado del sistema:', error);
      setSystemHealth({
        status: "error",
        timestamp: new Date().toISOString(),
        api: {
          status: "error",
          message: "Error al conectar con la API",
          version: "N/A",
          port: 3000
        },
        relayer: {
          status: "unknown",
          message: "No se pudo verificar el estado del relayer",
          port: 3001
        },
        blockchain: {
          network: "Desconocido",
          chainId: 0,
          blockNumber: 0,
          connected: false,
          contractAddress: null,
          contractDeployed: false
        },
        users: {
          registered: 0
        },
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminSession');
    setIsAuthenticated(false);
    setActiveTab('overview');
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  } const tabs = [
    { id: 'overview', label: 'Vista General', icon: Activity },
    { id: 'elections', label: 'Gestión de Elecciones', icon: Vote }
  ];
  const renderOverview = () => (
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
            {/* API Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-emerald-600/5"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    {systemHealth.services.api.status}
                  </span>
                </div>
                <h3 className="font-bold text-emerald-800 mb-1">Servicio API</h3>
                <p className="text-emerald-600 text-sm capitalize">{systemHealth.services.api.message}</p>
              </div>
            </motion.div>

            {/* Database Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-indigo-600/5"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <Database className="w-8 h-8 text-indigo-600" />
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                    {systemHealth.services.database.status}
                  </span>
                </div>
                <h3 className="font-bold text-indigo-800 mb-1">Base de Datos</h3>
                <p className="text-indigo-600 text-sm">{systemHealth.services.database.userCount} usuarios</p>
              </div>
            </motion.div>

            {/* Blockchain Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-blue-600/5"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <ShieldCheck className="w-8 h-8 text-blue-600" />
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {systemHealth.services.blockchain.status}
                  </span>
                </div>
                <h3 className="font-bold text-blue-800 mb-1">Blockchain</h3>
                <p className="text-blue-600 text-sm">Bloque #{systemHealth.services.blockchain.currentBlock || 'N/A'}</p>
              </div>
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-amber-600/5"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <Monitor className="w-8 h-8 text-amber-600" />
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    {systemHealth.status}
                  </span>
                </div>
                <h3 className="font-bold text-amber-800 mb-1">Estado General</h3>
                <p className="text-amber-600 text-sm capitalize">Sistema {systemHealth.status}</p>
              </div>
            </motion.div>
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
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-primary-500" />
                Detalles de Red
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Red:</span>
                  <span className="font-medium text-gray-800 bg-primary-50 px-3 py-1 rounded-full text-sm">
                    {systemHealth?.services?.blockchain?.message?.includes('Connected') ? 'MegaETH Testnet' : 'Desconectado'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-medium px-3 py-1 rounded-full text-sm ${systemHealth?.services?.blockchain?.status === 'online'
                    ? 'text-emerald-700 bg-emerald-100'
                    : 'text-red-700 bg-red-100'
                    }`}>
                    {systemHealth?.services?.blockchain?.message || 'Sin conexión'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bloque Actual:</span>
                  <span className="font-medium text-gray-800">
                    #{systemHealth?.services?.blockchain?.currentBlock || 'N/A'}
                  </span>
                </div>                <div className="pt-2">
                  <span className="text-gray-600 block mb-2">Dirección del Contrato:</span>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 break-all border border-gray-100">
                    {systemHealth?.services?.blockchain?.contractAddress || CONFIG.CONTRACT_ADDRESS || 'No disponible'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Server className="w-5 h-5 mr-2 text-primary-500" />
                Configuración del Servicio
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Versión API:</span>
                  <span className="font-medium text-gray-800">{systemHealth?.services?.api?.version || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estado API:</span>
                  <span className={`font-medium px-3 py-1 rounded-full text-sm ${systemHealth?.services?.api?.status === 'online'
                    ? 'text-emerald-700 bg-emerald-100'
                    : 'text-red-700 bg-red-100'
                    }`}>
                    {systemHealth?.services?.api?.message || 'Sin conexión'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Usuarios Registrados:</span>
                  <span className="font-medium text-gray-800">{systemHealth?.services?.database?.userCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Última Verificación:</span>
                  <span className="font-medium text-gray-800 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
              </div>
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
