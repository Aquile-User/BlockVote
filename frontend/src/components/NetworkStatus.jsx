import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertTriangle, Zap } from 'lucide-react';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState('unknown'); // 'online', 'offline', 'degraded', 'unknown'
  const [lastCheck, setLastCheck] = useState(Date.now());

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

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000) // 5 segundos timeout
        });

        if (response.ok) {
          setBackendStatus('online');
        } else if (response.status === 429) {
          setBackendStatus('degraded');
        } else if (response.status === 503) {
          setBackendStatus('degraded');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          setBackendStatus('degraded');
        } else {
          setBackendStatus('offline');
        }
      }
      setLastCheck(Date.now());
    };

    // Check immediately
    checkBackendStatus();

    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
        message: 'Sin conexión a internet'
      };
    }

    switch (backendStatus) {
      case 'online':
        return {
          icon: Wifi,
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          message: 'Conexión estable'
        };
      case 'degraded':
        return {
          icon: AlertTriangle,
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          message: 'Servicio con limitaciones'
        };
      case 'offline':
        return {
          icon: WifiOff,
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          message: 'Servicio no disponible'
        };
      default:
        return {
          icon: Zap,
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          message: 'Verificando conexión...'
        };
    }
  };

  const config = getStatusConfig();
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

        {backendStatus === 'degraded' && (
          <div className={`mt-1 text-xs ${config.textColor} opacity-75`}>
            El servicio puede estar sobrecargado. Los datos pueden cargarse más lentamente.
          </div>
        )}

        {(backendStatus === 'offline' || !isOnline) && (
          <div className={`mt-1 text-xs ${config.textColor} opacity-75`}>
            Algunas funciones pueden no estar disponibles.
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default NetworkStatus;
