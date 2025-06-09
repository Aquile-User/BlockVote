import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Settings, 
  Database, 
  Activity,
  Users,
  Vote,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut
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
  }
  const tabs = [
    { id: 'overview', label: 'System Overview', icon: Activity },
    { id: 'elections', label: 'Election Management', icon: Vote }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Activity className="w-6 h-6" />
            <span>System Health</span>
          </h2>
          <button
            onClick={fetchSystemHealth}
            disabled={loading}
            className="btn-secondary p-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {systemHealth ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">API Status</p>
                  <p className="text-white text-sm">{systemHealth.status}</p>
                </div>
              </div>
            </div>

            <div className={`p-4 border rounded-lg ${
              systemHealth.relayer?.status === 'running' 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-center space-x-3">
                {systemHealth.relayer?.status === 'running' ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
                <div>
                  <p className={`font-medium ${
                    systemHealth.relayer?.status === 'running' ? 'text-green-400' : 'text-red-400'
                  }`}>Relayer</p>
                  <p className="text-white text-sm">{systemHealth.relayer?.status || 'Unknown'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-blue-400 font-medium">Blockchain</p>
                  <p className="text-white text-sm">Block #{systemHealth.blockchain?.blockNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-purple-400 font-medium">Registered Users</p>
                  <p className="text-white text-sm">{systemHealth.users?.registered || 0}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading system health...</p>
          </div>
        )}
      </motion.div>

      {/* Blockchain Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Shield className="w-6 h-6" />
          <span>Blockchain Configuration</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Network:</span>
              <span className="text-white">MegaETH Testnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Contract Address:</span>
              <span className="text-white font-mono text-xs">
                {systemHealth?.blockchain?.contractAddress || 'Loading...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Contract Status:</span>
              <span className={`${
                systemHealth?.blockchain?.contractDeployed ? 'text-green-400' : 'text-red-400'
              }`}>
                {systemHealth?.blockchain?.contractDeployed ? 'Deployed' : 'Not Found'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">API Version:</span>
              <span className="text-white">{systemHealth?.api?.version || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">API Port:</span>
              <span className="text-white">{systemHealth?.api?.port || 3000}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Relayer Port:</span>
              <span className="text-white">{systemHealth?.relayer?.port || 3001}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold text-white">EtherVote Admin</h1>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>        {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'elections' && <ElectionManagement />}
      </div>
    </div>
  );
};

export default AdminPage;
