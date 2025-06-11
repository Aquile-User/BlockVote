import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Vote, 
  Clock, 
  Users, 
  CheckCircle,
  Calendar,
  MapPin,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  Eye,
  TrendingUp,
  AlertCircle,
  Activity
} from 'lucide-react';
import { getElections, getResults, getElectionById } from '../api';

// Utility function to get total registered users
const getTotalRegisteredUsers = async () => {
  try {
    const response = await fetch('http://localhost:3000/users');
    const users = await response.json();
    return Object.keys(users).length;
  } catch (error) {
    console.error('Error fetching user count:', error);
    return 6; // Fallback to known user count
  }
};

const Elections = ({ user }) => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      
      // Get elections from API
      const electionsList = await getElections();
      
      // Get detailed data for each election
      const electionsWithDetails = await Promise.all(
        electionsList.map(async (election) => {
          try {
            // Get election details
            const details = await getElectionById(election.electionId);
            
            // Get vote results
            let results = {};
            try {
              results = await getResults(election.electionId);
            } catch (error) {
              console.log(`No results yet for election ${election.electionId}`);
            }
            
            // Calculate total votes
            const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);
            
            // Determine status
            const now = Math.floor(Date.now() / 1000);
            let status = 'upcoming';
            
            if (details.disabled) {
              status = 'disabled';
            } else if (now >= details.startTime && now <= details.endTime) {
              status = 'active';
            } else if (now > details.endTime) {
              status = 'expired';
            }
            
            return {
              ...election,
              ...details,
              results,
              totalVotes,
              status,
              participation: totalVotes > 0 ? ((totalVotes / await getTotalRegisteredUsers()) * 100).toFixed(1) : 0
            };
          } catch (error) {
            console.error(`Error loading election ${election.electionId}:`, error);
            return {
              ...election,
              status: 'error',
              totalVotes: 0,
              participation: 0,
              results: {}
            };
          }
        })
      );

      setElections(electionsWithDetails);
    } catch (error) {
      console.error('Error loading elections:', error);
      toast.error('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'upcoming':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'expired':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'disabled':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Vote className="w-4 h-4" />;
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'expired':
        return <CheckCircle className="w-4 h-4" />;
      case 'disabled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'upcoming':
        return 'Próxima';
      case 'expired':
        return 'Finalizada';
      case 'disabled':
        return 'Deshabilitada';
      default:
        return 'Desconocido';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredElections = elections
    .filter(election => {
      const matchesSearch = election.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           election.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || election.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sort order: active -> upcoming -> disabled -> expired
      const statusPriority = {
        'active': 1,
        'upcoming': 2,
        'disabled': 3,
        'expired': 4
      };
      return statusPriority[a.status] - statusPriority[b.status];
    });

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
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50 via-white to-secondary-50 rounded-3xl"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-200/30 to-secondary-200/30 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary-200/30 to-primary-200/30 rounded-full translate-y-4 -translate-x-4"></div>
        
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-3"
              >
                <Sparkles className="w-7 h-7 text-primary-600" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 bg-clip-text text-transparent">
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
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadElections}
                disabled={loading}
                className="flex items-center space-x-3 bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 shadow-soft hover:shadow-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-semibold">Actualizar</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-8 shadow-soft">
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
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-4">
              <Filter className="text-gray-500 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-50/50 border border-gray-200 text-gray-900 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 min-w-[150px]"
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="upcoming">Próximas</option>
                <option value="expired">Finalizadas</option>
                <option value="disabled">Deshabilitadas</option>
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
      </motion.div>

      {/* Enhanced Elections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-secondary-50/50 rounded-3xl transform group-hover:scale-[1.02] transition-transform duration-300"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-8 shadow-soft hover:shadow-medium transition-all duration-300">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(election.status)}`}>
                    {getStatusIcon(election.status)}
                    <span>{getStatusText(election.status)}</span>
                  </div>
                  
                  {election.status === 'active' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-emerald-600 text-sm font-medium">En vivo</span>
                    </div>
                  )}
                </div>

                {/* Election Info */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                    {election.title || election.name}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {election.description || 'Sin descripción disponible'}
                  </p>

                  {/* Election Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-2xl">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inicio</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(election.startTime)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-2xl">
                      <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-secondary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fin</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(election.endTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl">
                    <div className="flex items-center justify-center mb-2">
                      <Vote className="w-5 h-5 text-primary-600" />
                    </div>
                    <p className="text-2xl font-bold text-primary-600">{election.totalVotes}</p>
                    <p className="text-sm text-primary-500">Votos</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{election.participation}%</p>
                    <p className="text-sm text-emerald-500">Participación</p>
                  </div>
                </div>

                {/* Candidates Preview (if available) */}
                {election.candidates && election.candidates.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Candidatos
                    </h4>
                    <div className="space-y-2">
                      {election.candidates.slice(0, 3).map((candidate, idx) => {
                        const votes = election.results[candidate.id] || 0;
                        const percentage = election.totalVotes > 0 ? ((votes / election.totalVotes) * 100).toFixed(1) : 0;
                        
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/60 rounded-xl">
                            <span className="font-medium text-gray-900">{candidate.name}</span>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-gray-700">{votes} votos</span>
                              <div className="text-xs text-gray-500">{percentage}%</div>
                            </div>
                          </div>
                        );
                      })}
                      {election.candidates.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{election.candidates.length - 3} candidatos más
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Link 
                  to={`/elections/${election.electionId}`} 
                  className="block"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-soft hover:shadow-medium flex items-center justify-center space-x-3 group"
                  >
                    <Eye className="w-5 h-5" />
                    <span>Ver Detalles</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </motion.button>
                </Link>
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
              className="mt-6 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl transition-colors duration-200"
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
