import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertTriangle, Zap } from 'lucide-react';

// Configuraciones constantes
const BACKEND_URL = 'http://localhost:3000/health';
const TIMEOUT_MS = 5000;
const CHECK_INTERVAL_MS = 30000;

const STATUS_CONFIGS = {
  offline_internet: {
    icon: WifiOff,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    message: 'Sin conexión a internet',
    detail: 'Algunas funciones pueden no estar disponibles.'
  },
  online: {
    icon: Wifi,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600',
    message: 'Conexión estable'
  },
  degraded: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    message: 'Servicio con limitaciones',
    detail: 'El servicio puede estar sobrecargado. Los datos pueden cargarse más lentamente.'
  },
  offline: {
    icon: WifiOff,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    message: 'Servicio no disponible',
    detail: 'Algunas funciones pueden no estar disponibles.'
  },
  unknown: {
    icon: Zap,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    iconColor: 'text-gray-600',
    message: 'Verificando conexión...'
  }
};

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [lastCheck, setLastCheck] = useState(Date.now());

  // Manejadores de eventos de conectividad
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Función para determinar el estado del backend
  const determineBackendStatus = (response, error) => {
    if (error) {
      return error.name === 'AbortError' ? 'degraded' : 'offline';
    }

    if (response.ok) return 'online';
    if ([429, 503].includes(response.status)) return 'degraded';
    return 'offline';
  };
  // Verificación del estado del backend
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(BACKEND_URL, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(TIMEOUT_MS)
        });

        setBackendStatus(determineBackendStatus(response));
      } catch (error) {
        setBackendStatus(determineBackendStatus(null, error));
      }
      setLastCheck(Date.now());
    };

    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Determinar la configuración del estado actual
  const getCurrentStatusConfig = () => {
    if (!isOnline) return STATUS_CONFIGS.offline_internet;
    return STATUS_CONFIGS[backendStatus] || STATUS_CONFIGS.unknown;
  };

  const config = getCurrentStatusConfig();
  const IconComponent = config.icon;

  // Solo mostrar si hay problemas de conectividad
  if (isOnline && backendStatus === 'online') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-20 right-4 z-50 rounded-lg border p-3 shadow-lg ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex items-center space-x-2">
          <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.message}
          </span>
        </div>

        {config.detail && (
          <div className={`mt-1 text-xs ${config.textColor} opacity-75`}>
            {config.detail}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default NetworkStatus;
