import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  }, []);
  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      console.log('Fetching system health...');
      const response = await fetch('http://localhost:3000/health');

      if (!response.ok) {
        throw new Error(`Health API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('System health data:', data);
      setSystemHealth(data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      // Set a fallback health status
      setSystemHealth({
        status: "error",
        timestamp: new Date().toISOString(),
        services: {
          api: { status: "unknown", message: "Health check failed" },
          database: { status: "unknown", message: "Unknown" },
          blockchain: { status: "unknown", message: "Unknown" }
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
            <div>              <h2 className="text-2xl font-bold text-gray-800">Monitor del Sistema</h2>
              <p className="text-gray-600">Estado y rendimiento en tiempo real</p>
            </div>
          </div>          <motion.button
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
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-emerald-600/5"></div>              <div className="relative">                <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  Activo
                </span>
              </div>
                <h3 className="font-bold text-emerald-800 mb-1">Servicio API</h3>
                <p className="text-emerald-600 text-sm capitalize">{systemHealth.status}</p>
              </div>
            </motion.div>

            {/* Relayer Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`relative overflow-hidden rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 ${systemHealth.relayer?.status === 'running'
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50'
                : 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50'
                }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${systemHealth.relayer?.status === 'running'
                ? 'from-emerald-400/5 to-emerald-600/5'
                : 'from-red-400/5 to-red-600/5'
                }`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">                {systemHealth.relayer?.status === 'running' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${systemHealth.relayer?.status === 'running'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {systemHealth.relayer?.status === 'running' ? 'Ejecutándose' : 'Error'}
                  </span>
                </div>
                <h3 className={`font-bold mb-1 ${systemHealth.relayer?.status === 'running' ? 'text-emerald-800' : 'text-red-800'
                  }`}>Servicio Relayer</h3>
                <p className={`text-sm capitalize ${systemHealth.relayer?.status === 'running' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                  {systemHealth.relayer?.status === 'running' ? 'Activo' : (systemHealth.relayer?.status || 'Desconocido')}
                </p>
              </div>
            </motion.div>

            {/* Blockchain Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-indigo-600/5"></div>
              <div className="relative">                <div className="flex items-center justify-between mb-3">
                <Database className="w-8 h-8 text-indigo-600" />
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                  Sincronizado
                </span>
              </div>
                <h3 className="font-bold text-indigo-800 mb-1">Blockchain</h3>
                <p className="text-indigo-600 text-sm">Bloque #{systemHealth.blockchain?.blockNumber || 'N/A'}</p>
              </div>
            </motion.div>

            {/* Users Count */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200/50 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400/5 to-violet-600/5"></div>
              <div className="relative">                <div className="flex items-center justify-between mb-3">
                <Users className="w-8 h-8 text-violet-600" />
                <TrendingUp className="w-5 h-5 text-violet-600" />
              </div>
                <h3 className="font-bold text-violet-800 mb-1">Usuarios Registrados</h3>
                <p className="text-violet-600 text-sm font-semibold">{systemHealth.users?.registered || 0}</p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Loading system health...</p>
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
          <div>            <h2 className="text-2xl font-bold text-gray-800">Configuración Blockchain</h2>
            <p className="text-gray-600">Información de red y contratos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Network Information */}
          <div className="space-y-6">            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-primary-500" />
              Detalles de Red
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Red:</span>
                <span className="font-medium text-gray-800 bg-primary-50 px-3 py-1 rounded-full text-sm">
                  MegaETH Testnet
                </span>
              </div>                <div className="flex justify-between items-center">
                <span className="text-gray-600">Estado del Contrato:</span>
                <span className={`font-medium px-3 py-1 rounded-full text-sm ${systemHealth?.blockchain?.contractDeployed
                  ? 'text-emerald-700 bg-emerald-100'
                  : 'text-red-700 bg-red-100'
                  }`}>
                  {systemHealth?.blockchain?.contractDeployed ? 'Desplegado' : 'No Encontrado'}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-gray-600 block mb-2">Dirección del Contrato:</span>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 break-all border border-gray-100">
                  {systemHealth?.blockchain?.contractAddress || 'Cargando...'}
                </div>
              </div>
            </div>
          </div>
          </div>            {/* Service Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Server className="w-5 h-5 mr-2 text-primary-500" />
                Configuración del Servicio
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Versión API:</span>
                  <span className="font-medium text-gray-800">{systemHealth?.api?.version || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Puerto API:</span>
                  <span className="font-medium text-gray-800">{systemHealth?.api?.port || 3000}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Puerto Relayer:</span>
                  <span className="font-medium text-gray-800">{systemHealth?.relayer?.port || 3001}</span>
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
      <div className="relative backdrop-blur-sm bg-white/80 border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-300 to-primary-500 rounded-xl opacity-20 blur-sm -z-10"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  BlockVote Admin
                </h1>
                <p className="text-sm text-gray-500">Sistema de Administración</p>
              </div>
            </motion.div>            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm transition-colors duration-300"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </motion.button>
          </div>
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
                  transition={{ delay: index * 0.1 }} onClick={() => setActiveTab(tab.id)} className={`relative flex items-center space-x-3 py-6 px-4 font-medium text-sm transition-all duration-300 group ${activeTab === tab.id
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
