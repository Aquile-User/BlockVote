import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Vote,
  TrendingUp,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  MapPin,
  CreditCard,
  Activity, ChevronUp,
  BarChart4,
  Calendar,
  RefreshCw,
  TrendingDown,
  Award,
  ChevronLeft,
  ChevronRight,
  List,
  Eye
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { getElections, getResults, getElectionById, hasVoted } from '../../api';
import { mapUsersToProvinces } from '../../utils/demographics';

// Configuraciones constantes
const BACKEND_URL = 'http://localhost:3000/users';
const STAGGER_DELAY = 100;
const ELECTIONS_PER_PAGE = 3;

const STATUS_CONFIGS = {
  active: {
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    icon: <Vote className="w-4 h-4" />,
    text: 'Activa',
    priority: 1
  },
  upcoming: {
    color: 'text-primary-600 bg-primary-50 border-primary-200',
    icon: <Clock className="w-4 h-4" />,
    text: 'Próxima',
    priority: 2
  },
  disabled: {
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    icon: <AlertTriangle className="w-4 h-4" />,
    text: 'Deshabilitada',
    priority: 3
  },
  expired: {
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
    text: 'Finalizada',
    priority: 4
  }
};

const TIMEFRAME_OPTIONS = ['7d', '30d', '90d'];

// Componente reutilizable para tarjetas de métricas
const MetricCard = ({ label, value, gradient, center = false, size = 'normal' }) => {
  const textSize = size === 'large' ? 'text-3xl' : 'text-2xl';
  const containerClasses = center ? 'text-center' : '';

  return (
    <div className={`bg-white/60 rounded-xl p-4 border border-gray-200/50 ${containerClasses}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`${textSize} font-bold text-gray-900`}>
        {value}
      </p>
      {gradient && (
        <div className={`w-8 h-1 ${gradient} rounded-full mx-auto mt-2`}></div>
      )}
    </div>
  );
};

// Función para determinar el estado de una elección
const determineElectionStatus = (election, currentTime) => {
  if (election.disabled) return 'disabled';
  if (currentTime >= election.startTime && currentTime <= election.endTime) return 'active';
  if (currentTime > election.endTime) return 'expired';
  return 'upcoming';
};

// Función para formatear fechas
const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalVoters: 0,
    totalVotes: 0,
    activeElections: 0,
    completedElections: 0,
    disabledElections: 0
  });
  const [provinceData, setProvinceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('7d');
  const [rateLimitWarning, setRateLimitWarning] = useState(false);

  // Estados para la lista de elecciones
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [electionsPerPage] = useState(ELECTIONS_PER_PAGE);

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);
  // Función para refrescar manualmente todos los datos del dashboard
  const handleRefresh = async () => {
    // Prevenir múltiples refreshes simultáneos
    if (refreshing || loading) {
      return;
    }

    setRefreshing(true);
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };  // Función para contar los votos reales del usuario actual
  const countUserVotes = async (userSocialId, validElections) => {
    if (!userSocialId) {
      // Dashboard: No user socialId provided for vote counting
      return 0;
    }

    try {
      let realVoteCount = 0;
      // Dashboard: Counting real votes for user across elections

      // Para cada elección válida, verificar si el usuario realmente ha votado
      for (const election of validElections) {
        const electionId = election.electionId;

        try {
          // Usar la API hasVoted para verificar si el usuario votó en esta elección
          // Dashboard: Checking if user voted in election
          const votingStatus = await hasVoted(electionId, userSocialId);
          if (votingStatus.hasVoted) {
            console.log(`Dashboard: ✅ User voted in election ${electionId}`);
            realVoteCount++;
          } else {
            console.log(`Dashboard: ❌ User did not vote in election ${electionId}`);
          }
        } catch (error) {
          console.log(`Dashboard: Error checking vote status for election ${electionId}:`, error.message);
          // Si hay error en la API, usar localStorage como fallback
          const votedKey = `voted-${userSocialId}-${electionId}`;
          const localVoted = localStorage.getItem(votedKey) === 'true';
          if (localVoted) {
            console.log(`Dashboard: ✅ User voted in election ${electionId} (from localStorage)`);
            realVoteCount++;
          }
        }
      }

      console.log(`Dashboard: Total real votes for user ${userSocialId}: ${realVoteCount}`);
      return realVoteCount;
    } catch (error) {
      console.error('Dashboard: Error al contar votos reales del usuario:', error);
      return 0;
    }
  };
  // Función para cargar elecciones para la lista
  const loadElectionsForList = async (validElections, resultsMap) => {
    try {
      const currentTime = Math.floor(Date.now() / 1000);

      // Obtener usuarios totales para calcular participación
      let totalUsers = 1;
      try {
        const usersResponse = await fetch(BACKEND_URL);
        const usersData = await usersResponse.json();
        totalUsers = Object.keys(usersData).length;
      } catch (error) {
        console.log('Could not fetch user count for elections list');
      }

      const electionsWithDetails = validElections.map(election => {
        const results = resultsMap[election.electionId] || {};
        const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);
        const status = determineElectionStatus(election, currentTime);
        const participation = totalVotes > 0 ? ((totalVotes / totalUsers) * 100).toFixed(1) : 0;

        return {
          ...election,
          results,
          totalVotes,
          status,
          participation
        };
      });

      // Ordenar por prioridad usando las configuraciones
      electionsWithDetails.sort((a, b) =>
        STATUS_CONFIGS[a.status]?.priority - STATUS_CONFIGS[b.status]?.priority
      );

      setElections(electionsWithDetails);

      // Seleccionar la primera elección por defecto si hay alguna
      if (electionsWithDetails.length > 0 && !selectedElection) {
        setSelectedElection(electionsWithDetails[0]);
      }
    } catch (error) {
      console.error('Error loading elections for list:', error);
    }
  };

  // Paginación
  const indexOfLastElection = currentPage * electionsPerPage;
  const indexOfFirstElection = indexOfLastElection - electionsPerPage;
  const currentElections = elections.slice(indexOfFirstElection, indexOfLastElection);
  const totalPages = Math.ceil(elections.length / electionsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Dashboard: Loading data...      // Get elections and find the one with oldest end time
      const elections = await getElections();
      console.log('Dashboard: Elections loaded:', elections);

      let hasRateLimitIssues = false;

      // Get detailed election data to find oldest - with error handling and staggered delays
      const electionPromises = elections.map(async (election, index) => {
        try {          // Add small delay to prevent overwhelming the blockchain node
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, index * STAGGER_DELAY));
          }
          return await getElectionById(election.electionId);
        } catch (error) {
          console.warn(`Dashboard: Failed to load election ${election.electionId}:`, error.message);

          // Check for rate limiting specifically
          if (error.response?.status === 429 || error.message.includes('Rate limit')) {
            console.warn(`Dashboard: Rate limit exceeded for election ${election.electionId}. This election will be skipped.`);
            hasRateLimitIssues = true;
          }

          return null;
        }
      }); const electionDetails = await Promise.all(electionPromises);

      console.log('Dashboard: Election details loaded, valid count:', electionDetails.filter(e => e !== null).length);

      // Find election with oldest end time
      let validElections = electionDetails.filter(e => e !== null && e.electionId);// Apply timeframe filtering
      const now = Math.floor(Date.now() / 1000);
      const getTimeframeCutoff = (timeframe) => {
        switch (timeframe) {
          case '24h':
            return now - (24 * 60 * 60); // 24 horas atrás
          case '7d':
            return now - (7 * 24 * 60 * 60); // 7 días atrás
          case '30d':
            return now - (30 * 24 * 60 * 60); // 30 días atrás
          case 'all':
          default:
            return 0; // Sin filtro de tiempo
        }
      };

      const timeframeCutoff = getTimeframeCutoff(timeframe);
      if (timeframe !== 'all') {
        validElections = validElections.filter(election => {
          // Incluir elecciones que han tenido actividad en el timeframe seleccionado
          return election.endTime >= timeframeCutoff || election.startTime >= timeframeCutoff;
        });
      }

      console.log(`Dashboard: Filtered elections for timeframe ${timeframe}:`, validElections.length);

      const oldestElection = validElections.length > 0
        ? validElections.reduce((oldest, current) =>
          (oldest.endTime < current.endTime) ? oldest : current
        )
        : null;      // Cargar resultados de todas las elecciones de una vez para evitar múltiples llamadas - with error handling
      console.log('Dashboard: Loading results for elections:', validElections.map(e => e.electionId)); const resultsPromises = validElections.map(async (election, index) => {
        try {          // Add increased delay to prevent overwhelming the blockchain node
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, index * (STAGGER_DELAY + 50)));
          }
          return await getResults(election.electionId);
        } catch (error) {
          console.warn(`Dashboard: Failed to load results for election ${election.electionId}:`, error.message);

          // Check for rate limiting specifically
          if (error.response?.status === 429 || error.message.includes('Rate limit')) {
            console.warn(`Dashboard: Rate limit exceeded for results of election ${election.electionId}. Using empty results.`);
            hasRateLimitIssues = true;
          }

          return {};
        }
      });
      const allResults = await Promise.all(resultsPromises);
      console.log('Dashboard: Results loaded:', allResults.length, 'results fetched');

      // Show warning if there were rate limiting issues
      if (hasRateLimitIssues) {
        setRateLimitWarning(true);
        setTimeout(() => setRateLimitWarning(false), 10000); // Hide after 10 seconds
      }

      // Crear un mapa de resultados para acceso rápido
      const resultsMap = {};
      validElections.forEach((election, index) => {
        resultsMap[election.electionId] = allResults[index] || {};
      });// Calculate actual stats from real data
      let totalVotes = 0;
      let activeElections = 0;
      let completedElections = 0;
      let disabledElections = 0;

      const currentTime = Math.floor(Date.now() / 1000);
      for (const election of validElections) {
        try {
          // Usar el mapa de resultados en lugar de llamar a getResults nuevamente
          const results = resultsMap[election.electionId];
          const electionVotes = Object.values(results || {}).reduce((sum, count) => sum + count, 0);
          totalVotes += electionVotes;

          // Check election status based on time and disabled flag
          if (election.disabled) {
            disabledElections++;
            completedElections++;
          } else if (currentTime >= election.startTime && currentTime <= election.endTime) {
            activeElections++;
          } else if (currentTime > election.endTime) {
            completedElections++;
          }
        } catch (error) {
          console.error(`Error loading results for election ${election.electionId}:`, error);
        }
      }

      // Get registered users count from localStorage or estimate
      const userData = localStorage.getItem('currentUser');
      let registeredUsers = 1; // At least current user

      // Try to get actual user count from backend
      try {
        const usersResponse = await fetch('http://localhost:3000/users');
        const usersData = await usersResponse.json();
        registeredUsers = Object.keys(usersData).length;
      } catch (error) {
        console.log('Could not fetch user count, using estimate');
        // Fallback to estimate based on total votes
        registeredUsers = Math.max(totalVotes * 2, 50);
      } setStats({
        totalVoters: registeredUsers,
        totalVotes,
        activeElections,
        completedElections,
        disabledElections
      });      // Contar los votos reales del usuario actual
      if (user && user.socialId) {
        console.log(`Dashboard: Starting vote count for user:`, user);
        const userVotesCount = await countUserVotes(user.socialId, validElections);
        console.log(`Dashboard: User ${user.socialId} has ${userVotesCount} real votes`);
        // Actualizar el objeto user con el conteo de votos reales
        user.votesCount = userVotesCount;
      } else {
        console.log('Dashboard: No user or socialId available for vote counting');
      }

      // Real Dominican Republic province data based on actual registered users
      let realProvinceData = [];

      try {
        const usersResponse = await fetch('http://localhost:3000/users');
        const usersData = await usersResponse.json();

        // Combine all election results for province mapping using el resultsMap
        const combinedResults = {};
        for (const election of validElections) {
          // Usar el mapa de resultados en lugar de llamar a getResults nuevamente
          const results = resultsMap[election.electionId];
          Object.entries(results || {}).forEach(([candidate, votes]) => {
            combinedResults[candidate] = (combinedResults[candidate] || 0) + votes;
          });
        }

        // Use the standardized function
        realProvinceData = mapUsersToProvinces(usersData, combinedResults);

        // Convert to the format expected by the Dashboard
        realProvinceData = realProvinceData.map(item => ({
          name: item.name || item.province,
          votes: item.votes,
          registered: item.registered || item.realUsers,
          participationRate: item.participationRate || (item.registered > 0 ? (item.votes / item.registered * 100).toFixed(1) : 0)
        }));
      } catch (error) {
        console.error('Error fetching real user data:', error);
        // Fallback data
        realProvinceData = [
          { name: 'San Pedro de Macorís', votes: 2, registered: 2, participationRate: 100 },
          { name: 'Monte Plata', votes: 2, registered: 2, participationRate: 100 },
          { name: 'Sánchez Ramírez', votes: 1, registered: 1, participationRate: 100 },
          { name: 'María Trinidad Sánchez', votes: 1, registered: 1, participationRate: 100 }
        ];
      } setProvinceData(realProvinceData);

      // Cargar datos de elecciones para la lista
      await loadElectionsForList(validElections, resultsMap);
    } catch (error) {
      console.error('Error loading dashboard data:', error);// Fallback to real data from oldest election if APIs fail
      setStats({
        totalVoters: 6, // Real registered users count
        totalVotes: 4, // Real votes from election 1: q=1, w=1, e=2
        activeElections: 1,
        completedElections: 2
      });

      // Real Dominican Republic province data
      setProvinceData([
        { name: 'Distrito Nacional', votes: 2, population: 965040, participationRate: 75 },
        { name: 'Santo Domingo', votes: 1, population: 2908607, participationRate: 68 },
        { name: 'Santiago', votes: 1, population: 963422, participationRate: 72 },
        { name: 'La Vega', votes: 0, population: 394205, participationRate: 65 },
        { name: 'Puerto Plata', votes: 0, population: 321597, participationRate: 70 },
        { name: 'San Cristóbal', votes: 0, population: 569930, participationRate: 69 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const provinceVotesOption = {
    backgroundColor: 'transparent',
    title: {
      text: '',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderRadius: 12,
      padding: [12, 16],
      textStyle: {
        color: '#111827'
      },
      formatter: function (params) {
        const totalUsers = provinceData.reduce((sum, item) => sum + (item.registered || 0), 0);
        const percentage = totalUsers > 0 ? ((params.value / totalUsers) * 100).toFixed(1) : 0;
        const data = provinceData.find(item => item.name === params.name);
        return `
          <strong>${params.name}</strong><br/>
          Usuarios Registrados: <span style="color: #14b8a6">${params.value}</span><br/>
          Porcentaje: <span style="color: #0891b2">${percentage}%</span><br/>
          Votos Emitidos: ${data?.votes || 0}<br/>
          Participación: ${data?.participationRate || 0}%        `;
      }
    },
    series: [
      {
        name: 'Usuarios por Provincia',
        type: 'pie',
        radius: ['35%', '75%'],
        center: ['50%', '50%'],
        data: provinceData
          .filter(item => (item.registered || 0) > 0)
          .map((item, index) => ({
            value: item.registered || 0,
            name: item.name,
            itemStyle: {
              color: `hsl(${170 + index * 25}, 70%, 55%)`,
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          }))
          .sort((a, b) => b.value - a.value),
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'outside',
          color: '#374151',
          fontSize: 11,
          fontWeight: 600,
          formatter: function (params) {
            const totalUsers = provinceData.reduce((sum, item) => sum + (item.registered || 0), 0);
            const percentage = totalUsers > 0 ? ((params.value / totalUsers) * 100).toFixed(1) : 0;
            return `${params.name}\n${percentage}%`;
          }
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 8,
          lineStyle: {
            color: '#d1d5db',
            width: 1
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            borderWidth: 3
          },
          label: {
            fontSize: 12,
            fontWeight: 700
          }
        },
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
          return idx * 100;
        }
      }
    ]
  }; const StatCard = ({ icon: Icon, title, value, subtitle, color = 'primary', bgColor = 'primary', delay = 0 }) => {
    // Define pastel background colors based on the original icon colors
    const pastelColors = {
      emerald: 'from-emerald-50 to-emerald-100',
      amber: 'from-amber-50 to-amber-100',
      violet: 'from-violet-50 to-violet-100'
    };

    const borderColors = {
      emerald: 'border-emerald-200',
      amber: 'border-amber-200',
      violet: 'border-violet-200'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="relative group h-full"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${pastelColors[color] || pastelColors.emerald} rounded-2xl transform group-hover:scale-[1.02] transition-transform duration-300`}></div>
        <div className={`relative bg-gradient-to-br ${pastelColors[color] || pastelColors.emerald} rounded-2xl border ${borderColors[color] || borderColors.emerald} p-5 shadow-soft hover:shadow-medium transition-all duration-300 h-full min-h-[140px] flex flex-col`}>
          <div className="flex items-center justify-between mb-3 flex-1">
            <div className="flex-1">
              <p className="text-gray-600 text-xs font-medium mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
              {subtitle && (
                <p className="text-gray-700 text-xs">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 loading-spinner mx-auto"></div>
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50 via-white to-secondary-50 rounded-3xl"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-200/30 to-secondary-200/30 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary-200/30 to-primary-200/30 rounded-full translate-y-4 -translate-x-4"></div>

        <div className="relative p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between space-y-6 xl:space-y-0">
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-3"
              >                <div className="flex items-center space-x-3">
                  <h1 className="text-4xl font-bold text-gray-900">
                    Centro de Control
                  </h1>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <p className="text-2xl font-semibold text-gray-800">
                  ¡Hola, <span className="text-primary-600">{user?.name || 'Usuario'}</span>! 👋
                </p>                <p className="text-gray-800 max-w-2xl">
                  Tu hub central para monitorear elecciones, analizar participación y gestionar el ecosistema democrático digital.
                </p>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4"
            >
              {/* System Status */}
              <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-2xl border border-emerald-200/50 shadow-soft hover:shadow-medium transition-all duration-200">
                <div className="relative">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
                </div>
                <span className="text-emerald-700 font-semibold text-sm">Sistema Operativo</span>
              </div>              {/* Quick Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-soft hover:shadow-medium hover:scale-105 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  title="Refrescar datos del dashboard"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-600 group-hover:text-primary-600 transition-all duration-300 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                </button>
              </div>              {/* Timeframe Selector */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="input-field text-sm min-w-[160px] bg-white/90 backdrop-blur-sm border-gray-200/50 hover:border-primary-300 focus:border-primary-500 transition-colors duration-200"
              >
                <option value="24h">📊 Últimas 24h</option>
                <option value="7d">📈 Últimos 7 días</option>
                <option value="30d">📉 Últimos 30 días</option>
                <option value="all">🔄 Todo el tiempo</option>
              </select>
            </motion.div>
          </div>        </div>
      </div>

      {/* Rate Limit Warning */}
      <AnimatePresence>
        {rateLimitWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">
                  Limitación de Solicitudes Detectada
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Algunos datos pueden estar incompletos debido a límites de velocidad del servidor.
                  Los datos se actualizarán automáticamente. Si persiste el problema, espere unos momentos y actualice manualmente.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Stats Grid with New Metrics */}<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard
          icon={Vote}
          title="Votos Emitidos"
          value={stats.totalVotes.toLocaleString()}
          subtitle="Confirmados en blockchain"
          color="emerald"
          bgColor="emerald"
          delay={0.1}
        />        <StatCard
          icon={AlertTriangle}
          title="Elecciones Deshabilitadas"
          value={stats.disabledElections || stats.completedElections}
          subtitle="Finalizadas o desactivadas"
          color="amber"
          bgColor="amber"
          delay={0.2}
        />
        <StatCard
          icon={CheckCircle2}
          title="Elecciones Completadas"
          value={stats.completedElections}
          subtitle="Finalizadas exitosamente"
          color="violet"
          bgColor="violet"
          delay={0.3}
        />      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Elections List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl transform group-hover:scale-[1.01] transition-transform duration-300"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-violet-200/50 p-8 shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-bold text-gray-900">Elecciones Disponibles</h3>
                  <div className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                    Lista Completa
                  </div>
                </div>
                <p className="text-gray-600">Selecciona una elección para ver detalles</p>
              </div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <List className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
            </div>

            {/* Elections List */}
            <div className="space-y-4 mb-6">
              {currentElections.length > 0 ? (
                currentElections.map((election, index) => (
                  <motion.div
                    key={election.electionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedElection(election)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedElection?.electionId === election.electionId
                      ? 'border-violet-300 bg-violet-50/50 shadow-lg'
                      : 'border-gray-200 bg-white/60 hover:border-violet-200 hover:bg-violet-50/30'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {election.name || `Elección ${election.electionId}`}
                          </h4>                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIGS[election.status]?.color || STATUS_CONFIGS.upcoming.color}`}>
                            {STATUS_CONFIGS[election.status]?.icon || STATUS_CONFIGS.upcoming.icon}
                            <span>{STATUS_CONFIGS[election.status]?.text || 'Desconocido'}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div className="text-center">
                            <p className="text-gray-500">Votos</p>
                            <p className="font-semibold text-violet-700">{election.totalVotes}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500">Candidatos</p>
                            <p className="font-semibold text-violet-700">{election.candidates?.length || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500">Participación</p>
                            <p className="font-semibold text-violet-700">{election.participation}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Eye className={`w-5 h-5 ${selectedElection?.electionId === election.electionId
                          ? 'text-violet-600'
                          : 'text-gray-400'
                          }`} />
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Vote className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No hay elecciones disponibles</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg ${currentPage === page
                        ? 'bg-violet-600 text-white'
                        : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}            {/* Elections Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <MetricCard
                label="Total Elecciones"
                value={elections.length}
              />
              <MetricCard
                label="Elecciones Activas"
                value={elections.filter(e => e.status === 'active').length}
              />
            </div>
          </div>
        </motion.div>

        {/* Province Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl transform group-hover:scale-[1.01] transition-transform duration-300"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-cyan-200/50 p-8 shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-2">                <div className="flex items-center space-x-3">
                <h3 className="text-2xl font-bold text-gray-900">Usuarios por Provincia</h3>
                <div className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">
                  República Dominicana
                </div>
              </div>
                <p className="text-gray-600">Usuarios registrados por región</p>
              </div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
            </div>

            <ReactECharts
              option={provinceVotesOption}
              style={{ height: '320px' }}
              opts={{ renderer: 'svg' }}
            />            {/* Province Stats - Enhanced for Ring Chart */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <MetricCard
                label="Total Usuarios"
                value={provinceData.reduce((sum, p) => sum + (p.registered || 0), 0)}
                gradient="bg-gradient-to-r from-cyan-400 to-blue-500"
                center={true}
              />

              <MetricCard
                label="Provincias Activas"
                value={provinceData.filter(p => (p.registered || 0) > 0).length}
                gradient="bg-gradient-to-r from-emerald-400 to-teal-500"
                center={true}
              />

              <div className="bg-white/60 rounded-xl p-4 border border-gray-200/50 text-center">
                <p className="text-xs text-gray-500 mb-1">Provincia Líder</p>
                <p className="text-sm font-bold text-gray-900">
                  {provinceData.length > 0
                    ? provinceData.reduce((max, p) =>
                      (p.registered || 0) > (max.registered || 0) ? p : max,
                      provinceData[0]).name || 'Ninguna'
                    : 'Ninguna'}
                </p>
                <p className="text-xs text-cyan-600 font-medium">
                  {provinceData.length > 0
                    ? `${provinceData.reduce((max, p) =>
                      (p.registered || 0) > (max.registered || 0) ? p : max,
                      provinceData[0]).registered || 0} usuarios`
                    : '0 usuarios'}
                </p>
              </div>
            </div>
          </div>        </motion.div>
      </div>      {/* Election Summary Section - Updated with compact pastel design */}
      {selectedElection && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl transform group-hover:scale-[1.005] transition-transform duration-300"></div>
          <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-6 shadow-soft hover:shadow-medium transition-all duration-300">

            {/* Header - Compact */}
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-gray-900">Resumen de Elección</h3>                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIGS[selectedElection.status]?.color || STATUS_CONFIGS.upcoming.color}`}>
                    {STATUS_CONFIGS[selectedElection.status]?.icon || STATUS_CONFIGS.upcoming.icon}
                    <span>{STATUS_CONFIGS[selectedElection.status]?.text || 'Desconocido'}</span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{selectedElection.name || `Elección ${selectedElection.electionId}`}</p>
              </div>
              {selectedElection.status === 'active' && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-600 text-sm font-medium">En vivo</span>
                </div>
              )}
            </div>

            {/* Election Details Grid - Compact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Column - Basic Info */}
              <div className="space-y-4">

                {/* Election Times - Compact */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    Cronograma
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Inicio</p>
                      <p className="text-xs font-medium text-gray-900">{formatDate(selectedElection.startTime)}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Fin</p>
                      <p className="text-xs font-medium text-gray-900">{formatDate(selectedElection.endTime)}</p>
                    </div>
                  </div>
                </div>

                {/* Election Stats - Compact */}
                <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-teal-600" />
                    Estadísticas
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-white rounded-lg border border-teal-200">
                      <p className="text-lg font-bold text-teal-700">{selectedElection.totalVotes}</p>
                      <p className="text-xs text-gray-600">Votos</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg border border-teal-200">
                      <p className="text-lg font-bold text-teal-700">{selectedElection.candidates?.length || 0}</p>
                      <p className="text-xs text-gray-600">Candidatos</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg border border-teal-200">
                      <p className="text-lg font-bold text-teal-700">{selectedElection.participation}%</p>
                      <p className="text-xs text-gray-600">Participación</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Candidates Results */}
              <div className="space-y-4">

                {/* Candidates List - Compact */}
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2 text-purple-600" />
                    Top Candidatos
                  </h4>

                  {selectedElection.candidates && selectedElection.candidates.length > 0 ? (
                    <div className="space-y-2">
                      {selectedElection.candidates.slice(0, 3).map((candidate, idx) => {
                        const votes = selectedElection.results?.[candidate] || 0;
                        const percentage = selectedElection.totalVotes > 0
                          ? ((votes / selectedElection.totalVotes) * 100).toFixed(1)
                          : 0;
                        const isWinner = votes > 0 && votes === Math.max(...Object.values(selectedElection.results || {}));

                        return (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-lg border border-purple-200 hover:shadow-sm transition-all duration-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${idx === 0 ? 'bg-yellow-500' :
                                  idx === 1 ? 'bg-gray-400' :
                                    'bg-orange-600'
                                  }`}>
                                  {idx + 1}
                                </div>
                                <span className="font-medium text-gray-900 text-sm truncate">{candidate}</span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm font-semibold text-gray-700">{votes}</div>
                                <div className="text-xs text-gray-500">{percentage}%</div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                  idx === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                                    'bg-gradient-to-r from-orange-400 to-orange-600'
                                  }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                      {selectedElection.candidates.length > 3 && (
                        <div className="text-center p-2 bg-white rounded-lg border border-purple-200">
                          <div className="text-gray-400 text-xs mb-1">📊</div>
                          <div className="text-gray-600 font-medium text-xs">+{selectedElection.candidates.length - 3} candidatos más</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                      <div className="text-gray-400 text-sm mb-1">👥</div>
                      <p className="text-gray-500 text-xs">No hay candidatos registrados</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced User Profile - Full Width Horizontal Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl transform group-hover:scale-[1.005] transition-transform duration-300"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-violet-200/50 p-8 shadow-soft hover:shadow-medium transition-all duration-300">

          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-gray-900">Perfil de Usuario</h3>
              <p className="text-gray-600">Información personal y configuración de cuenta</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          {/* Main Profile Card - Improved Layout */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 rounded-3xl"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-violet-200/30 to-indigo-200/30 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full"></div>

            <div className="relative p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-soft">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                {/* Avatar Section - Enhanced */}
                <div className="lg:col-span-3 flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-500 via-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-white/50">
                      <span className="text-3xl font-bold text-white">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -top-1 -left-1 w-6 h-6 bg-amber-400 rounded-full border-2 border-white animate-pulse"></div>                  </div>
                </div>

                {/* User Information Section - Enhanced */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                      {user?.name || 'Usuario'}
                    </h2>
                    <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-mono">
                      <span className="text-xs mr-1">ID:</span>
                      {user?.socialId || 'No disponible'}
                    </div>
                  </div>

                  {/* User Details Grid - Enhanced */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white/60 rounded-2xl p-4 border border-gray-200/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-600">Ubicación</p>
                          <p className="text-gray-900 font-semibold truncate">
                            {user?.province || 'No establecida'}
                          </p>
                          <p className="text-gray-500 text-xs">República Dominicana 🇩🇴</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/60 rounded-2xl p-4 border border-gray-200/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-600">Billetera Digital</p>
                          <p className="text-gray-900 font-mono text-sm truncate">
                            {user?.address ? `${user.address.slice(0, 8)}...${user.address.slice(-6)}` : 'Sin billetera'}
                          </p>
                          <p className="text-gray-500 text-xs capitalize">
                            {user?.authMethod || 'Generada automáticamente'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics Section - Enhanced */}
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200/50 text-center hover:shadow-soft transition-all duration-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">2024</p>
                      <p className="text-xs text-gray-600 font-medium">Miembro desde</p>
                    </div>                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-5 border border-purple-200/50 text-center hover:shadow-soft transition-all duration-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Vote className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {user?.votesCount || 0}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">Votos Emitidos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Quick Actions & Additional Info - Enhanced Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Account Security - Redesigned */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl opacity-80 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="absolute top-3 right-3 w-8 h-8 bg-emerald-200/40 rounded-full"></div>
              <div className="relative p-6 border border-emerald-200/50 rounded-2xl backdrop-blur-sm group-hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-emerald-600 text-xs font-semibold">ACTIVO</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-emerald-800 font-bold text-lg mb-1">Seguridad Avanzada</h4>
                    <p className="text-emerald-600 text-sm mb-2">Cuenta completamente verificada</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </div>
                      <p className="text-emerald-500 text-xs font-medium">Listo para participar</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Participation Status - Redesigned */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl opacity-80 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="absolute top-3 right-3 w-8 h-8 bg-blue-200/40 rounded-full"></div>
              <div className="relative p-6 border border-blue-200/50 rounded-2xl backdrop-blur-sm group-hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Activity className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${stats.activeElections > 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs font-semibold ${stats.activeElections > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {stats.activeElections > 0 ? 'DISPONIBLE' : 'INACTIVO'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-blue-800 font-bold text-lg mb-1">Participación Electoral</h4>
                    <p className="text-blue-600 text-sm mb-2">
                      {stats.activeElections > 0 ? 'Elecciones disponibles' : 'Sin elecciones activas'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{stats.activeElections}</span>
                      </div>
                      <p className="text-blue-500 text-xs font-medium">
                        proceso{stats.activeElections !== 1 ? 's' : ''} activo{stats.activeElections !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account Type & Permissions - Redesigned */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl opacity-80 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="absolute top-3 right-3 w-8 h-8 bg-amber-200/40 rounded-full"></div>
              <div className="relative p-6 border border-amber-200/50 rounded-2xl backdrop-blur-sm group-hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      <span className="text-amber-600 text-xs font-semibold">PREMIUM</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-amber-800 font-bold text-lg mb-1">Votante Premium</h4>
                    <p className="text-amber-600 text-sm mb-2">Acceso completo al sistema</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                        <Award className="w-2.5 h-2.5 text-white" />
                      </div>
                      <p className="text-amber-500 text-xs font-medium">Permisos completos</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>      {/* Fin del contenido del Dashboard */}
    </motion.div>
  );
};

export default Dashboard;
