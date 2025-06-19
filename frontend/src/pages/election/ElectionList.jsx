import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Vote,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  MapPin,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  Eye,
  TrendingUp,
  AlertTriangle,
  Activity,
  Zap,
  Globe,
  Target
} from 'lucide-react';
import { getElections, getResults, getElectionById } from '../../api';

// Configuraciones constantes
const BACKEND_URL = 'http://localhost:3000/users';
const FALLBACK_USER_COUNT = 6;
const STAGGER_DELAY_DETAILS = 50;
const STAGGER_DELAY_RESULTS = 75;

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

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'upcoming', label: 'Próximas' },
  { value: 'expired', label: 'Finalizadas' },
  { value: 'disabled', label: 'Deshabilitadas' }
];

// Utility function to get total registered users
const getTotalRegisteredUsers = async () => {
  try {
    const response = await fetch(BACKEND_URL);
    const users = await response.json();
    return Object.keys(users).length;
  } catch (error) {
    console.error('Error fetching user count:', error);
    return FALLBACK_USER_COUNT;
  }
};

// Función para determinar el estado de una elección
const determineElectionStatus = (details) => {
  if (details.disabled) return 'disabled';

  const now = Math.floor(Date.now() / 1000);
  if (now >= details.startTime && now <= details.endTime) return 'active';
  if (now > details.endTime) return 'expired';
  return 'upcoming';
};

// Componente reutilizable para candidatos
const CandidateMetric = ({ candidate, votes, percentage, rank }) => {
  const rankColors = {
    0: 'bg-yellow-500',
    1: 'bg-gray-400',
    2: 'bg-orange-600'
  };

  const progressColors = {
    0: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
    1: 'bg-gradient-to-r from-gray-300 to-gray-400',
    2: 'bg-gradient-to-r from-orange-400 to-orange-600'
  };

  return (
    <div className="bg-white p-3 rounded-lg border border-purple-200 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${rankColors[rank] || 'bg-gray-500'}`}>
            {rank + 1}
          </div>
          <span className="font-medium text-gray-900 text-sm truncate">{candidate}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-gray-700">{votes}</div>
          <div className="text-xs text-gray-500">{percentage}%</div>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${progressColors[rank] || 'bg-gradient-to-r from-gray-400 to-gray-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const Elections = ({ user }) => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadElections();
  }, []); const loadElections = async () => {
    try {
      setLoading(true);

      const electionsList = await getElections();

      // Funciones optimizadas para cargar datos con manejo de errores
      const loadElectionDetails = async (election, index) => {
        try {
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, index * STAGGER_DELAY_DETAILS));
          }
          return await getElectionById(election.electionId);
        } catch (error) {
          console.warn(`Failed to load details for election ${election.electionId}:`, error.message);
          return null;
        }
      };

      const loadElectionResults = async (election, index) => {
        try {
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, index * STAGGER_DELAY_RESULTS));
          }
          return await getResults(election.electionId);
        } catch (error) {
          console.warn(`Failed to load results for election ${election.electionId}:`, error.message);
          return {};
        }
      };

      // Ejecutar todas las promesas en paralelo
      const [detailsArray, resultsArray, totalUsers] = await Promise.all([
        Promise.all(electionsList.map(loadElectionDetails)),
        Promise.all(electionsList.map(loadElectionResults)),
        getTotalRegisteredUsers()
      ]);

      // Procesar y combinar resultados
      const electionsWithDetails = electionsList
        .map((election, index) => {
          const details = detailsArray[index];
          if (!details) return null;

          const results = resultsArray[index] || {};
          const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);
          const status = determineElectionStatus(details);
          const participation = totalVotes > 0 ? ((totalVotes / totalUsers) * 100).toFixed(1) : 0;

          return {
            ...election,
            ...details,
            results,
            totalVotes,
            status,
            participation
          };
        })
        .filter(Boolean);

      console.log(`Elections loaded: ${electionsWithDetails.length} valid elections out of ${electionsList.length} total`);
      setElections(electionsWithDetails);
    } catch (error) {
      console.error('Error loading elections:', error);
      toast.error('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };
  // Función para formatear fechas
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para filtrar y ordenar elecciones
  const getFilteredElections = () => {
    return elections
      .filter(election => {
        const matchesSearch = election.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          election.candidates?.some(candidate => candidate.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterStatus === 'all' || election.status === filterStatus;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => STATUS_CONFIGS[a.status]?.priority - STATUS_CONFIGS[b.status]?.priority);
  };

  const filteredElections = getFilteredElections();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 loading-spinner mx-auto"></div>
          <p className="text-gray-600 font-medium">Cargando elecciones...</p>
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
      {/* Enhanced Header */}      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-white rounded-3xl"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/20 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100/20 rounded-full translate-y-4 -translate-x-4"></div>

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-3"
              >
                <Sparkles className="w-7 h-7 text-primary-600" />                <h1 className="text-4xl font-bold text-primary-700">
                  Elecciones
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 text-lg max-w-2xl"
              >
                Participa en votaciones seguras y transparentes utilizando tecnología blockchain
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 lg:mt-0"
            >              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadElections}
              disabled={loading}
              className="flex items-center space-x-3 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 shadow-soft hover:shadow-medium disabled:opacity-50"
            >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-semibold">Actualizar</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filter */}      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-white rounded-3xl"></div>
        <div className="relative bg-white rounded-3xl border border-gray-200 p-8 shadow-soft">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar elecciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 placeholder-gray-400"
              />
            </div>            {/* Filter */}
            <div className="flex items-center space-x-4">
              <Filter className="text-gray-500 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-50/50 border border-gray-200 text-gray-900 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 min-w-[150px]"
              >
                {FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              Mostrando <span className="font-semibold text-primary-600">{filteredElections.length}</span> de <span className="font-semibold">{elections.length}</span> elecciones
            </p>
          </div>
        </div>
      </motion.div>      {/* Enhanced Elections Grid - One per row */}
      <div className="space-y-6">
        <AnimatePresence>
          {filteredElections.map((election, index) => (
            <motion.div
              key={election.electionId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="relative group"
            >              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl transform group-hover:scale-[1.02] transition-transform duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl border border-blue-200 shadow-2xl hover:shadow-lg transition-all duration-300">

                {/* Horizontal Layout for Wide Cards */}
                <div className="flex flex-col lg:flex-row">                  {/* Left Section - Main Info with gradient background */}
                  <div className="flex-1 p-6 lg:p-8 bg-gradient-to-br from-white to-gray-50 rounded-l-3xl">                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold border ${STATUS_CONFIGS[election.status]?.color || STATUS_CONFIGS.upcoming.color}`}>
                        {STATUS_CONFIGS[election.status]?.icon || STATUS_CONFIGS.upcoming.icon}
                        <span>{STATUS_CONFIGS[election.status]?.text || 'Desconocido'}</span>
                      </div>

                      {election.status === 'active' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-emerald-600 text-sm font-medium">En vivo</span>
                        </div>
                      )}
                    </div>{/* Election Title and Description */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-teal-600 transition-colors duration-200 mb-2 flex items-center">
                        <Vote className="w-6 h-6 mr-3 text-teal-500" />
                        {election.name}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {election.candidates ? `${election.candidates.length} candidatos disponibles` : 'Sin candidatos disponibles'}
                      </p>
                    </div>

                    {/* Top Candidates - Moved to left section */}
                    {election.candidates && election.candidates.length > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-4 border border-purple-200">
                        <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-purple-500" />
                          Top Candidatos
                        </h4>                        <div className="space-y-2">
                          {election.candidates.slice(0, 3).map((candidate, idx) => {
                            const votes = election.results?.[candidate] || 0;
                            const percentage = election.totalVotes > 0 ? ((votes / election.totalVotes) * 100).toFixed(1) : 0;

                            return (
                              <CandidateMetric
                                key={idx}
                                candidate={candidate}
                                votes={votes}
                                percentage={percentage}
                                rank={idx}
                              />
                            );
                          })}
                          {election.candidates.length > 3 && (
                            <div className="text-center p-2 bg-white rounded-lg border border-purple-200">
                              <div className="text-gray-400 text-xs mb-1">📊</div>
                              <div className="text-gray-600 font-medium text-xs">+{election.candidates.length - 3} candidatos más</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}                  </div>{/* Right Section - Enhanced Stats and Metrics */}
                  <div className="lg:w-80 p-6 lg:p-8 bg-gradient-to-br from-teal-50 to-emerald-100 lg:border-l border-teal-200 rounded-r-3xl">
                    {/* Voting Summary Card */}
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-teal-500" />
                        Resumen de Votación
                      </h4>

                      {/* Main Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white p-3 rounded-lg border border-teal-200 text-center">
                          <div className="text-xl font-bold text-teal-600">{election.candidates?.length || 0}</div>
                          <div className="text-sm text-gray-600">Candidatos</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-teal-200 text-center">
                          <div className="text-xl font-bold text-emerald-600">{election.totalVotes}</div>
                          <div className="text-sm text-gray-600">Votos Totales</div>
                        </div>
                      </div>                      {/* Participation Metrics */}
                      <div className="bg-white p-3 rounded-lg border border-teal-200 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Participación</span>
                          <Activity className="w-4 h-4 text-teal-500" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(election.participation, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {election.participation}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Election Timeline - Moved to right section */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 mb-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-blue-500" />
                        Cronograma
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <label className="text-sm font-medium text-gray-600">Inicio de Votación</label>
                          </div>
                          <p className="text-gray-900 font-semibold text-sm">
                            {formatDate(election.startTime)}
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <label className="text-sm font-medium text-gray-600">Fin de Votación</label>
                          </div>
                          <p className="text-gray-900 font-semibold text-sm">
                            {formatDate(election.endTime)}
                          </p>
                        </div>                      </div>
                    </div>

                    {/* Action Button */}
                    <Link to={`/elections/${election.electionId}`} className="block">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver Detalles</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredElections.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Vote className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No hay elecciones disponibles</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || filterStatus !== 'all'
              ? 'No se encontraron elecciones que coincidan con tu búsqueda.'
              : 'Las elecciones aparecerán aquí cuando estén disponibles.'
            }
          </p>
          {(searchTerm || filterStatus !== 'all') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl transition-colors duration-200 shadow-soft hover:shadow-medium"
            >
              Limpiar filtros
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Elections;
