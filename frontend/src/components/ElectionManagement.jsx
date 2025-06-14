import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Plus,
  Calendar,
  Users,
  Settings,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  Save,
  X,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  FileText,
  User,
  MapPin,
  ChevronRight,
  Sparkles,
  Info,
  Check,
  Award,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { getElections, getElectionById, getResults, createElection, disableElection, enableElection, updateElectionName, addCandidate } from "../api";
import { DOMINICAN_PROVINCES } from "../utils/dominican";

const ElectionManagement = ({ user }) => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedElection, setSelectedElection] = useState(null);
  const [editingElection, setEditingElection] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    newCandidate: ""
  });
  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);

  // Edit wizard state
  const [editCurrentStep, setEditCurrentStep] = useState(1);
  const [isEditFormValid, setIsEditFormValid] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    candidates: ["", ""],
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: "",
    location: ""
  });
  const steps = [
    {
      id: 1,
      title: "Información Básica",
      subtitle: "Detalles de la elección",
      icon: FileText,
      fields: ["name", "description"]
    },
    {
      id: 2,
      title: "Candidatos",
      subtitle: "Gestión de candidatos",
      icon: Users,
      fields: ["candidates"]
    },
    {
      id: 3,
      title: "Programación",
      subtitle: "Fechas y horarios",
      icon: Calendar,
      fields: ["startDate", "startTime", "endDate", "endTime"]
    },
    {
      id: 4,
      title: "Confirmación",
      subtitle: "Revisar y crear",
      icon: CheckCircle,
      fields: []
    }
  ]; const editSteps = [
    {
      id: 1,
      title: "Información",
      subtitle: "Datos básicos",
      icon: FileText,
      fields: ["name"]
    },
    {
      id: 2,
      title: "Candidatos",
      subtitle: "Gestión de candidatos",
      icon: Users,
      fields: ["newCandidate"]
    },
    {
      id: 3,
      title: "Confirmación",
      subtitle: "Revisar cambios",
      icon: CheckCircle,
      fields: []
    }
  ];

  // Form validation  // Form validation
  useEffect(() => {
    validateCurrentStep();
  }, [createForm, currentStep]);

  // Edit form validation
  useEffect(() => {
    validateEditCurrentStep();
  }, [editForm, editCurrentStep]);

  const validateCurrentStep = () => {
    const currentStepData = steps.find(step => step.id === currentStep);
    if (!currentStepData) return;

    let valid = true;

    switch (currentStep) {
      case 1:
        valid = createForm.name.trim().length >= 3;
        break;
      case 2:
        const validCandidates = createForm.candidates.filter(c => c.trim());
        valid = validCandidates.length >= 2;
        break;
      case 3:
        const startDateTime = new Date(`${createForm.startDate}T${createForm.startTime}`);
        const endDateTime = new Date(`${createForm.endDate}T${createForm.endTime}`);
        const now = new Date();
        valid = createForm.startDate && createForm.startTime &&
          createForm.endDate && createForm.endTime &&
          startDateTime > now && endDateTime > startDateTime;
        break;
      case 4:
        valid = true;
        break;
      default:
        valid = false;
    }

    setIsFormValid(valid);
  };
  const validateEditCurrentStep = () => {
    if (!editingElection) return;

    let valid = true;

    switch (editCurrentStep) {
      case 1:
        // Válido si no hay cambios o si hay cambios válidos
        valid = !editForm.name.trim() ||
          (editForm.name.trim().length >= 3 && editForm.name.trim() !== editingElection.name);
        break;
      case 2:
        // Válido si no hay candidato nuevo o si el candidato es válido y no duplicado
        valid = !editForm.newCandidate.trim() ||
          (editForm.newCandidate.trim().length >= 2 &&
            !editingElection.candidates.includes(editForm.newCandidate.trim()));
        break;
      case 3:
        // Válido si hay al menos un cambio para aplicar
        const hasNameChange = editForm.name.trim() && editForm.name.trim() !== editingElection.name;
        const hasNewCandidate = editForm.newCandidate.trim() &&
          !editingElection.candidates.includes(editForm.newCandidate.trim());
        valid = hasNameChange || hasNewCandidate || true; // Permitir siempre continuar, incluso sin cambios
        break;
      default:
        valid = false;
    }

    setIsEditFormValid(valid);
  };

  // Wizard navigation functions
  const goToNextStep = () => {
    if (currentStep < steps.length && isFormValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }; const resetWizard = () => {
    setCurrentStep(1);
    setCreateForm({
      name: "",
      candidates: ["", ""],
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      description: "",
      location: ""
    });
    setShowCreateModal(false);
  };

  // Edit wizard navigation functions
  const goToNextEditStep = () => {
    if (editCurrentStep < editSteps.length && isEditFormValid) {
      setEditCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousEditStep = () => {
    if (editCurrentStep > 1) {
      setEditCurrentStep(prev => prev - 1);
    }
  };

  const resetEditWizard = () => {
    setEditCurrentStep(1);
    setEditForm({ name: "", newCandidate: "" });
    setEditingElection(null);
  };

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      const electionsList = await getElections();

      // Get detailed data for each election
      const electionsWithDetails = await Promise.all(
        electionsList.map(async (election) => {
          try {
            const details = await getElectionById(election.electionId);
            const results = await getResults(election.electionId);

            const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);
            return {
              id: election.electionId,
              name: details.name,
              candidates: details.candidates,
              startTime: details.startTime,
              endTime: details.endTime,
              disabled: details.disabled,
              totalVotes,
              results,
              status: details.disabled ? "disabled" :
                (Date.now() / 1000 < details.startTime) ? "upcoming" :
                  (Date.now() / 1000 > details.endTime) ? "expired" : "active"
            };
          } catch (error) {
            console.error(`Error loading details for election ${election.electionId}:`, error);
            return null;
          }
        })
      );

      setElections(electionsWithDetails.filter(Boolean));
    } catch (error) {
      console.error('Error loading elections:', error);
      toast.error('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleElectionStatus = async (election) => {
    try {
      let response; if (election.disabled) {
        response = await enableElection(election.id);
        toast.success(`Elección "${election.name}" habilitada exitosamente!`);
      } else {
        response = await disableElection(election.id);
        toast.success(`Elección "${election.name}" deshabilitada exitosamente!`);
      }

      if (response.success) {
        // Refresh elections list
        await loadElections();
      }
    } catch (error) {
      console.error('Error toggling election status:', error);
      toast.error('Error al actualizar el estado de la elección');
    }
  };
  const handleCreateElection = async () => {
    try {
      // Validate form
      if (!createForm.name.trim()) {
        toast.error("El nombre de la elección es requerido");
        return;
      }

      const validCandidates = createForm.candidates.filter(c => c.trim());
      if (validCandidates.length < 2) {
        toast.error("Se requieren al menos 2 candidatos");
        return;
      }

      // Convert dates to timestamps
      const startTimestamp = Math.floor(new Date(`${createForm.startDate}T${createForm.startTime}`).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(`${createForm.endDate}T${createForm.endTime}`).getTime() / 1000);

      if (endTimestamp <= startTimestamp) {
        toast.error("La hora de fin debe ser posterior a la hora de inicio");
        return;
      }

      // Create election via API
      const electionData = {
        name: createForm.name.trim(),
        candidates: validCandidates,
        startTime: startTimestamp,
        endTime: endTimestamp
      };

      const response = await createElection(electionData);

      if (response.success) {
        toast.success(`¡Elección creada exitosamente! TX: ${response.txHash}`);
        resetWizard();
        // Refresh elections list
        await loadElections();
      } else {
        throw new Error(response.error || 'Failed to create election');
      }

    } catch (error) {
      console.error('Error creating election:', error);
      toast.error('Error al crear la elección');
    }
  };
  const addCandidateToForm = () => {
    setCreateForm(prev => ({
      ...prev,
      candidates: [...prev.candidates, ""]
    }));
  };

  const removeCandidate = (index) => {
    if (createForm.candidates.length > 2) {
      setCreateForm(prev => ({
        ...prev,
        candidates: prev.candidates.filter((_, i) => i !== index)
      }));
    }
  }; const updateCandidate = (index, value) => {
    setCreateForm(prev => ({
      ...prev,
      candidates: prev.candidates.map((candidate, i) => i === index ? value : candidate)
    }));
  };
  const startEditElection = (election) => {
    setEditingElection(election);
    setEditForm({
      name: election.name,
      newCandidate: ""
    });
    setEditCurrentStep(1); // Reset wizard to first step
  }; const handleEditElection = async (e) => {
    e.preventDefault();

    try {
      let updated = false;

      // Update election name if changed
      if (editForm.name.trim() && editForm.name !== editingElection.name) {
        const response = await updateElectionName(editingElection.id, editForm.name.trim());
        if (response.success) {
          toast.success("¡Nombre de elección actualizado exitosamente!");
          updated = true;
        }
      }

      // Add new candidate if provided
      if (editForm.newCandidate.trim()) {
        const response = await addCandidate(editingElection.id, editForm.newCandidate.trim());
        if (response.success) {
          toast.success("¡Candidato agregado exitosamente!");
          updated = true;
        }
      }

      if (updated) {
        // Reset form and close modal
        resetEditWizard();
        // Refresh elections list
        await loadElections();
      } else {
        toast.info("No se realizaron cambios");
        resetEditWizard();
      }

    } catch (error) {
      console.error('Error updating election:', error);
      toast.error('Error al actualizar la elección');
    }
  }; const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100 border border-green-300';
      case 'upcoming':
        return 'text-blue-700 bg-blue-100 border border-blue-300';
      case 'expired':
        return 'text-orange-700 bg-orange-100 border border-orange-300';
      case 'disabled':
        return 'text-red-700 bg-red-100 border border-red-300';
      default:
        return 'text-gray-700 bg-gray-100 border border-gray-300';
    }
  };
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">      {/* Header */}
      <div className="flex items-center justify-between">
        <div>          <h1 className="text-3xl font-bold text-gray-800">Gestión de Elecciones</h1>
          <p className="text-gray-600 mt-2">Crear y administrar elecciones de votación</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Crear Elección</span>
        </motion.button>
      </div>      {/* Elections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {elections
          .sort((a, b) => {
            // Sort order: active -> upcoming -> disabled -> expired
            const statusPriority = {
              'active': 1,
              'upcoming': 2,
              'disabled': 3,
              'expired': 4
            };

            const aPriority = statusPriority[a.status] || 5;
            const bPriority = statusPriority[b.status] || 5;

            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }

            // Within same status, sort by start time (newest first)
            return b.startTime - a.startTime;
          }).map((election) => (
            <motion.div
              key={election.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              {/* Header with Gradient */}
              <div className={`relative p-6 pb-4 ${election.status === 'active'
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                : election.status === 'upcoming'
                  ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                  : election.status === 'expired'
                    ? 'bg-gradient-to-br from-orange-400 to-amber-500'
                    : 'bg-gradient-to-br from-gray-400 to-slate-500'
                } text-white`}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <div className="absolute inset-0 transform rotate-45 bg-white rounded-full -mr-16 -mt-16"></div>
                </div>

                <div className="relative flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 leading-tight">
                      {election.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/30">
                        {election.status === 'active' ? '🟢 Activa' :
                          election.status === 'upcoming' ? '🔵 Próxima' :
                            election.status === 'expired' ? '🟠 Finalizada' :
                              '🔴 Deshabilitada'}
                      </span>
                      <span className="text-xs opacity-80">ID: {election.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedElection(election)}
                      className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 border border-white/30"
                      title="Ver Detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => startEditElection(election)}
                      className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 border border-white/30"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 pt-4">
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{election.candidates.length}</div>
                    <div className="text-xs text-blue-600 font-medium">Candidatos</div>
                  </div>

                  <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">{election.totalVotes}</div>
                    <div className="text-xs text-emerald-600 font-medium">Votos</div>
                  </div>

                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {election.totalVotes > 0 ?
                        Math.max(...election.candidates.map(c => election.results[c] || 0)) :
                        '0'
                      }
                    </div>
                    <div className="text-xs text-purple-600 font-medium">Líder</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium text-gray-700">Inicio</span>
                      </div>
                      <div className="flex-1 mx-4 h-px bg-gradient-to-r from-green-500 to-red-500"></div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">Fin</span>
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <span>{formatDate(election.startTime)}</span>
                      <span>{formatDate(election.endTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Top Candidates */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2 text-amber-500" />
                    Top Candidatos
                  </h4>
                  <div className="space-y-2">
                    {election.candidates
                      .map(candidate => ({
                        name: candidate,
                        votes: election.results[candidate] || 0,
                        percentage: election.totalVotes > 0 ?
                          ((election.results[candidate] || 0) / election.totalVotes * 100).toFixed(1) :
                          '0'
                      }))
                      .sort((a, b) => b.votes - a.votes)
                      .slice(0, 2)
                      .map((candidate, index) => (
                        <div key={candidate.name} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-sm transition-all">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                              }`}>
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-800 text-sm">{candidate.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900 text-sm">{candidate.votes}</span>
                            <span className="text-xs text-gray-500">({candidate.percentage}%)</span>
                          </div>
                        </div>
                      ))}

                    {election.candidates.length > 2 && (
                      <div className="text-center">
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          +{election.candidates.length - 2} candidatos más
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center">
                  {!election.disabled ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleToggleElectionStatus(election)}
                      className="bg-gradient-to-r from-red-400 to-rose-400 hover:from-red-500 hover:to-rose-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Deshabilitar</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleToggleElectionStatus(election)}
                      className="bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Habilitar</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
      </div>      {elections.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="bg-gradient-to-br from-teal-400 to-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Calendar className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">¡Comienza tu primera elección!</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            Crea elecciones seguras y transparentes usando la tecnología blockchain.
            Tu primera elección está a solo un clic de distancia.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center space-x-3 mx-auto shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Crear Mi Primera Elección</span>
          </motion.button>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>        {/* Election Detail Modal - Enhanced Design */}
        {selectedElection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
                <button
                  onClick={() => setSelectedElection(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Eye className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{selectedElection.name}</h2>
                    <p className="text-teal-100 mt-1">Detalles completos de la elección</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30`}>
                        ID: {selectedElection.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedElection.status === 'active' ? 'bg-emerald-500 text-white' :
                        selectedElection.status === 'upcoming' ? 'bg-blue-500 text-white' :
                          selectedElection.status === 'expired' ? 'bg-orange-500 text-white' :
                            'bg-red-500 text-white'
                        }`}>
                        {selectedElection.status.charAt(0).toUpperCase() + selectedElection.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[60vh]">
                {/* Main Cards Grid - 4 Cards con tamaño uniforme */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">                  {/* Card 1: Basic Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-teal-500" />
                      Información Básica
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nombre de la Elección</label>
                        <p className="text-gray-900 font-semibold text-lg">{selectedElection.name}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <label className="block text-sm font-medium text-gray-600 mb-1">ID de Elección</label>
                          <p className="text-gray-900 font-mono text-sm">{selectedElection.id}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Estado Actual</label>
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${selectedElection.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            selectedElection.status === 'upcoming' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              selectedElection.status === 'expired' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                            {selectedElection.status.charAt(0).toUpperCase() + selectedElection.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>                  {/* Card 2: Cronograma */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-500" />
                      Cronograma
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <label className="text-sm font-medium text-gray-600">Inicio de Votación</label>
                        </div>                        <p className="text-gray-900 font-semibold">{formatDate(selectedElection.startTime)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <label className="text-sm font-medium text-gray-600">Fin de Votación</label>
                        </div>
                        <p className="text-gray-900 font-semibold">{formatDate(selectedElection.endTime)}</p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-lg text-white">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">Duración Total</span>
                        </div>
                        <p className="font-bold">
                          {(() => {
                            const diffMs = (selectedElection.endTime - selectedElection.startTime) * 1000;
                            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            return `${diffDays > 0 ? `${diffDays} días, ` : ''}${diffHours} horas`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>                  {/* Card 3: Resumen de Votación */}
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-100 rounded-xl p-6 border border-teal-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-teal-500" />
                      Resumen de Votación
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-teal-200 text-center">
                          <div className="text-2xl font-bold text-teal-600">{selectedElection.candidates.length}</div>
                          <div className="text-sm text-gray-600">Candidatos</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-teal-200 text-center">
                          <div className="text-2xl font-bold text-emerald-600">{selectedElection.totalVotes}</div>
                          <div className="text-sm text-gray-600">Votos Totales</div>
                        </div>
                      </div>

                      {/* Participation Metrics */}
                      <div className="bg-white p-4 rounded-lg border border-teal-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Participación</span>
                          <TrendingUp className="w-4 h-4 text-teal-500" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((selectedElection.totalVotes / 1000) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {((selectedElection.totalVotes / 1000) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          De 1,000 votantes esperados
                        </div>
                      </div>
                    </div>
                  </div>                  {/* Card 4: Candidatos y Resultados */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-purple-500" />
                      Candidatos y Resultados
                    </h3>

                    <div>                      {/* Winner Spotlight */}
                      {selectedElection.totalVotes > 0 && (
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-xl mb-4 text-white">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                              <Award className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="text-sm font-medium opacity-90">🏆 Candidato Líder</div>
                              <div className="text-lg font-bold">
                                {selectedElection.candidates
                                  .map(candidate => ({
                                    name: candidate,
                                    votes: selectedElection.results[candidate] || 0,
                                  }))
                                  .sort((a, b) => b.votes - a.votes)[0]?.name || 'N/A'}
                              </div>
                              <div className="text-sm opacity-90">
                                {selectedElection.candidates
                                  .map(candidate => selectedElection.results[candidate] || 0)
                                  .sort((a, b) => b - a)[0] || 0} votos
                              </div>
                            </div>
                          </div>
                        </div>
                      )}                      {/* Candidates List - Compacto */}
                      <div className="space-y-2">
                        {selectedElection.candidates
                          .map(candidate => ({
                            name: candidate,
                            votes: selectedElection.results[candidate] || 0,
                            percentage: ((selectedElection.results[candidate] || 0) / Math.max(selectedElection.totalVotes, 1) * 100).toFixed(1)
                          }))
                          .sort((a, b) => b.votes - a.votes)
                          .map((candidate, index) => (
                            <div key={candidate.name} className="bg-white p-3 rounded-lg border border-purple-200 hover:shadow-sm transition-all duration-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                      index === 2 ? 'bg-orange-600' :
                                        'bg-purple-500'
                                    }`}>
                                    {index + 1}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-gray-800 text-sm truncate">{candidate.name}</div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-bold text-sm text-gray-900">{candidate.votes}</div>
                                  <div className="text-xs text-gray-500">{candidate.percentage}%</div>
                                </div>
                              </div>

                              {/* Progress Bar Compacta */}
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                        'bg-gradient-to-r from-purple-400 to-purple-500'
                                    }`}
                                  style={{ width: `${candidate.percentage}%` }}
                                ></div>
                              </div>
                            </div>))}
                      </div>

                      {selectedElection.totalVotes === 0 && (
                        <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                          <div className="text-gray-400 text-sm mb-1">📊</div>
                          <div className="text-gray-600 font-medium text-sm">Sin votos registrados aún</div>
                          <div className="text-gray-500 text-xs">Los resultados aparecerán cuando comience la votación</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Analytics Section */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                    Análisis de Participación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {selectedElection.candidates.length > 0 ?
                          (selectedElection.totalVotes / selectedElection.candidates.length).toFixed(1) :
                          '0'
                        }
                      </div>
                      <div className="text-sm text-gray-600">Promedio por candidato</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                      <div className="text-xl font-bold text-green-600">
                        {selectedElection.totalVotes > 0 ?
                          Math.max(...selectedElection.candidates.map(c => selectedElection.results[c] || 0)) :
                          '0'
                        }
                      </div>
                      <div className="text-sm text-gray-600">Votos del líder</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {selectedElection.totalVotes > 0 && selectedElection.candidates.length > 1 ?
                          (Math.max(...selectedElection.candidates.map(c => selectedElection.results[c] || 0)) -
                            selectedElection.candidates.map(c => selectedElection.results[c] || 0).sort((a, b) => b - a)[1] || 0) :
                          '0'
                        }
                      </div>
                      <div className="text-sm text-gray-600">Diferencia líder</div>
                    </div>
                  </div>
                </div>
              </div>              {/* Footer Actions */}
              <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Última actualización: {new Date().toLocaleDateString('es-ES')}
                  </div>

                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedElection(null)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cerrar</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedElection(null);
                        startEditElection(selectedElection);
                      }}
                      className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Editar Elección</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}{/* Create Election Modal - Multi-Step Wizard */}
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >              {/* Header */}
              <div className="relative bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
                <button
                  onClick={resetWizard}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Crear Nueva Elección</h2>
                    <p className="text-teal-100">Sigue estos pasos para configurar tu elección</p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.id} className="flex items-center">
                        {/* Step Circle */}
                        <div className="flex flex-col items-center">
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                            ${isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : isActive
                                ? 'bg-white border-white text-teal-600'
                                : 'bg-white/20 border-white/40 text-white/70'
                            }
                          `}>
                            {isCompleted ? (
                              <Check className="w-6 h-6" />
                            ) : (
                              <StepIcon className="w-6 h-6" />
                            )}
                          </div>

                          {/* Step Info */}
                          <div className="mt-2 text-center">
                            <div className={`text-xs font-medium ${isActive ? 'text-white' : 'text-teal-100'}`}>
                              {step.title}
                            </div>
                            <div className="text-xs text-teal-200">
                              {step.subtitle}
                            </div>
                          </div>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                          <div className={`
                            h-0.5 w-16 mx-4 transition-all duration-300
                            ${step.id < currentStep ? 'bg-emerald-400' : 'bg-white/30'}
                          `} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[60vh]">
                <AnimatePresence mode="wait">
                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Información Básica</h3>
                        <p className="text-gray-600">Comencemos con los detalles fundamentales de tu elección</p>
                      </div>

                      <div className="space-y-6">
                        {/* Election Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Nombre de la Elección *
                          </label>                          <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-lg"
                            placeholder="ej., Elección Presidencial 2025"
                            value={createForm.name}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                          />                          <div className="mt-2 text-sm text-gray-500">
                            Mínimo 3 caracteres. Sé descriptivo y claro.
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            <Info className="w-4 h-4 inline mr-2" />
                            Descripción (Opcional)
                          </label>
                          <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
                            rows="4"
                            placeholder="Proporciona detalles adicionales sobre la elección, su propósito, reglas especiales, etc."
                            value={createForm.description}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Candidates */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Gestión de Candidatos</h3>
                        <p className="text-gray-600">Agrega los candidatos que participarán en la elección</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-gray-700">
                            <Users className="w-4 h-4 inline mr-2" />
                            Candidatos (mínimo 2)
                          </label>
                          <div className="text-sm text-gray-500">
                            {createForm.candidates.filter(c => c.trim()).length} candidatos
                          </div>
                        </div>

                        <div className="space-y-3">
                          {createForm.candidates.map((candidate, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center space-x-3 group"
                            >
                              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                {index + 1}
                              </div>                              <input
                                type="text"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                placeholder={`Nombre del candidato ${index + 1}`}
                                value={candidate}
                                onChange={(e) => updateCandidate(index, e.target.value)}
                              />
                              {createForm.candidates.length > 2 && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={() => removeCandidate(index)}
                                  className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              )}
                            </motion.div>
                          ))}
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={addCandidateToForm}
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Agregar Candidato</span>
                        </motion.button>

                        {createForm.candidates.filter(c => c.trim()).length >= 2 && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center space-x-2 text-green-700">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">¡Perfecto!</span>
                            </div>
                            <p className="text-green-600 text-sm mt-1">
                              Tienes {createForm.candidates.filter(c => c.trim()).length} candidatos válidos. Puedes continuar al siguiente paso.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Scheduling */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Programación</h3>
                        <p className="text-gray-600">Define cuándo comenzará y terminará la votación</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Start Date/Time */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2 text-green-600">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <label className="text-sm font-semibold text-gray-700">
                              <Calendar className="w-4 h-4 inline mr-2" />
                              Inicio de Votación
                            </label>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                              <input
                                type="date"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                value={createForm.startDate}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Hora</label>
                              <input
                                type="time"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                value={createForm.startTime}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, startTime: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>

                        {/* End Date/Time */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2 text-red-600">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <label className="text-sm font-semibold text-gray-700">
                              <Clock className="w-4 h-4 inline mr-2" />
                              Fin de Votación
                            </label>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                              <input
                                type="date"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                value={createForm.endDate}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
                                min={createForm.startDate || new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Hora</label>
                              <input
                                type="time"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                value={createForm.endTime}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, endTime: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Duration Preview */}
                      {createForm.startDate && createForm.startTime && createForm.endDate && createForm.endTime && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="flex items-center space-x-2 text-blue-700 mb-2">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-medium">Duración Total</span>
                          </div>
                          <div className="text-blue-600 text-sm">
                            {(() => {
                              const start = new Date(`${createForm.startDate}T${createForm.startTime}`);
                              const end = new Date(`${createForm.endDate}T${createForm.endTime}`);
                              const diffMs = end.getTime() - start.getTime();
                              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                              const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                              return `${diffDays > 0 ? `${diffDays} días, ` : ''}${diffHours} horas y ${diffMinutes} minutos`;
                            })()}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 4: Confirmation */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirmar y Crear</h3>
                        <p className="text-gray-600">Revisa todos los detalles antes de crear la elección</p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                        {/* Basic Info Summary */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Información Básica
                          </h4>                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Nombre:</span>
                              <span className="font-medium">{createForm.name}</span>
                            </div>
                            {createForm.description && (
                              <div>
                                <span className="text-gray-600">Descripción:</span>
                                <p className="text-gray-800 mt-1">{createForm.description}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Candidates Summary */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Candidatos ({createForm.candidates.filter(c => c.trim()).length})
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {createForm.candidates.filter(c => c.trim()).map((candidate, index) => (
                              <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm font-medium text-gray-800">{candidate}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Schedule Summary */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Programación
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <div className="text-xs text-green-600 font-medium mb-1">INICIO</div>
                              <div className="text-sm text-green-800">
                                {new Date(`${createForm.startDate}T${createForm.startTime}`).toLocaleString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                              <div className="text-xs text-red-600 font-medium mb-1">FIN</div>
                              <div className="text-sm text-red-800">
                                {new Date(`${createForm.endDate}T${createForm.endTime}`).toLocaleString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Important Notice */}
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-amber-800">Importante</h5>
                            <p className="text-amber-700 text-sm mt-1">
                              Una vez creada, la elección no se puede eliminar, solo desactivar.
                              Asegúrate de que todos los datos sean correctos antes de continuar.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Navigation */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Paso {currentStep} de {steps.length}
                  </div>

                  <div className="flex items-center space-x-3">
                    {currentStep > 1 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={goToPreviousStep}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </motion.button>
                    )}

                    {currentStep < steps.length ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={goToNextStep}
                        disabled={!isFormValid} className={`
                          px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2
                          ${isFormValid
                            ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }
                        `}
                      >
                        <span>Siguiente</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleCreateElection}
                        disabled={!isFormValid} className={`
                          px-8 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg
                          ${isFormValid
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }
                        `}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Crear Elección</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}        {/* Edit Election Modal - Multi-Step Wizard */}
        {editingElection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
                <button
                  onClick={resetEditWizard}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Editar Elección</h2>
                    <p className="text-teal-100">Modifica los detalles de tu elección</p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between">
                  {editSteps.map((step, index) => {
                    const isActive = step.id === editCurrentStep;
                    const isCompleted = step.id < editCurrentStep;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.id} className="flex items-center">
                        {/* Step Circle */}
                        <div className="flex flex-col items-center">
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                            ${isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : isActive
                                ? 'bg-white border-white text-teal-600'
                                : 'bg-white/20 border-white/40 text-white/70'
                            }
                          `}>
                            {isCompleted ? (
                              <Check className="w-6 h-6" />
                            ) : (
                              <StepIcon className="w-6 h-6" />
                            )}
                          </div>

                          {/* Step Info */}
                          <div className="mt-2 text-center">
                            <div className={`text-xs font-medium ${isActive ? 'text-white' : 'text-teal-100'}`}>
                              {step.title}
                            </div>
                            <div className="text-xs text-teal-200">
                              {step.subtitle}
                            </div>
                          </div>
                        </div>

                        {/* Connector Line */}
                        {index < editSteps.length - 1 && (
                          <div className={`
                            h-0.5 w-16 mx-4 transition-all duration-300
                            ${step.id < editCurrentStep ? 'bg-emerald-400' : 'bg-white/30'}
                          `} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[60vh]">
                <AnimatePresence mode="wait">
                  {/* Step 1: Basic Information */}
                  {editCurrentStep === 1 && (
                    <motion.div
                      key="editStep1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Información de la Elección</h3>
                        <p className="text-gray-600">Modifica los datos básicos de la elección</p>
                      </div>

                      {/* Current Election Info */}
                      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 p-6 rounded-xl mb-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-teal-100 rounded-lg">
                            <Info className="w-5 h-5 text-teal-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-teal-800">Elección Actual</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-teal-600 font-medium">Nombre:</span>
                            <p className="text-teal-800 font-semibold">{editingElection.name}</p>
                          </div>
                          <div>
                            <span className="text-teal-600 font-medium">ID:</span>
                            <p className="text-teal-800">{editingElection.id}</p>
                          </div>
                          <div>
                            <span className="text-teal-600 font-medium">Estado:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${editingElection.status === 'active' ? 'bg-green-100 text-green-700' :
                              editingElection.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                                editingElection.status === 'disabled' ? 'bg-red-100 text-red-700' :
                                  'bg-orange-100 text-orange-700'
                              }`}>
                              {editingElection.status.charAt(0).toUpperCase() + editingElection.status.slice(1)}
                            </span>
                          </div>
                          <div>
                            <span className="text-teal-600 font-medium">Total Votos:</span>
                            <p className="text-teal-800">{editingElection.totalVotes}</p>
                          </div>
                        </div>
                      </div>                      <div className="space-y-6">
                        {/* Update Election Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Actualizar Nombre de la Elección
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-lg"
                              placeholder={`Nombre actual: ${editingElection.name}`}
                              value={editForm.name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                            {editForm.name.trim() && editForm.name !== editingElection.name && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            Deja en blanco si no deseas cambiar el nombre actual.
                          </div>

                          {/* Preview del cambio */}
                          {editForm.name.trim() && editForm.name !== editingElection.name && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-sm text-blue-700">
                                <strong>Vista previa:</strong> "{editForm.name}"
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Additional Information */}
                        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-200">
                          <h4 className="font-semibold text-teal-800 mb-2 flex items-center">
                            <Info className="w-4 h-4 mr-2" />
                            Información Importante
                          </h4>
                          <ul className="text-sm text-teal-700 space-y-1">
                            <li>• El cambio de nombre se aplicará inmediatamente</li>
                            <li>• El ID de la elección permanecerá sin cambios</li>
                            <li>• Los votos existentes no se verán afectados</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Candidates */}
                  {editCurrentStep === 2 && (
                    <motion.div
                      key="editStep2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Gestión de Candidatos</h3>
                        <p className="text-gray-600">Revisa y agrega nuevos candidatos</p>
                      </div>

                      {/* Current Candidates */}
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          Candidatos Actuales ({editingElection.candidates.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {editingElection.candidates.map((candidate, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-medium">
                                    {index + 1}
                                  </div>
                                  <span className="font-medium text-gray-800">{candidate}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-700">
                                    {editingElection.results[candidate] || 0} votos
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {((editingElection.results[candidate] || 0) / Math.max(editingElection.totalVotes, 1) * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>                      {/* Add New Candidate */}
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Plus className="w-5 h-5 mr-2" />
                          Agregar Nuevo Candidato
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              <User className="w-4 h-4 inline mr-2" />
                              Nombre del Candidato
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                placeholder="Ingrese el nombre del nuevo candidato"
                                value={editForm.newCandidate}
                                onChange={(e) => setEditForm(prev => ({ ...prev, newCandidate: e.target.value }))}
                              />
                              {editForm.newCandidate.trim() && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              Opcional: Agrega un candidato adicional a la elección.
                            </div>
                          </div>

                          {editForm.newCandidate.trim() && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-green-50 border border-green-200 rounded-xl"
                            >
                              <div className="flex items-center space-x-2 text-green-700 mb-2">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Nuevo candidato listo</span>
                              </div>
                              <p className="text-green-600 text-sm mt-1">
                                Se agregará: <strong>"{editForm.newCandidate}"</strong>
                              </p>
                              <div className="mt-2 text-xs text-green-600">
                                ✓ El candidato comenzará con 0 votos
                              </div>
                            </motion.div>
                          )}

                          {/* Validation Warnings */}
                          {editForm.newCandidate.trim() && editingElection.candidates.includes(editForm.newCandidate.trim()) && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                              <div className="flex items-center space-x-2 text-red-700">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-medium">Candidato duplicado</span>
                              </div>
                              <p className="text-red-600 text-sm mt-1">
                                Este candidato ya existe en la elección.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Confirmation */}
                  {editCurrentStep === 3 && (
                    <motion.div
                      key="editStep3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirmar Cambios</h3>
                        <p className="text-gray-600">Revisa las modificaciones antes de aplicarlas</p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                        {/* Changes Summary */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Resumen de Cambios
                          </h4>

                          {/* Check if there are any changes */}
                          {(() => {
                            const hasNameChange = editForm.name.trim() && editForm.name !== editingElection.name;
                            const hasNewCandidate = editForm.newCandidate.trim() &&
                              !editingElection.candidates.includes(editForm.newCandidate.trim());

                            if (!hasNameChange && !hasNewCandidate) {
                              return (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center space-x-2 text-blue-700">
                                    <Info className="w-5 h-5" />
                                    <span className="font-medium">Sin cambios pendientes</span>
                                  </div>
                                  <p className="text-blue-600 text-sm mt-1">
                                    No se han realizado modificaciones. Puedes continuar para mantener la elección tal como está.
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-4">
                                {hasNameChange && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-2 text-blue-700 mb-2">
                                      <Edit3 className="w-4 h-4" />
                                      <span className="font-medium">Cambio de Nombre</span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-600">Actual:</span>
                                        <span className="font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                          {editingElection.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-600">Nuevo:</span>
                                        <span className="font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                          {editForm.name}
                                        </span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}

                                {hasNewCandidate && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="p-4 bg-green-50 border border-green-200 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-2 text-green-700 mb-2">
                                      <Plus className="w-4 h-4" />
                                      <span className="font-medium">Nuevo Candidato</span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                                        {editForm.newCandidate}
                                      </span>
                                      <div className="text-green-600 text-xs mt-1">
                                        • Comenzará con 0 votos
                                        • Se añadirá al final de la lista
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Current Election State */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Estado Actual de la Elección
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <div className="text-gray-600 mb-1">Candidatos Actuales</div>
                              <div className="font-medium">{editingElection.candidates.length}</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <div className="text-gray-600 mb-1">Total de Votos</div>
                              <div className="font-medium">{editingElection.totalVotes}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Important Notice */}
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-amber-800">Nota Importante</h5>
                            <p className="text-amber-700 text-sm mt-1">
                              Los cambios se aplicarán inmediatamente. Los candidatos agregados tendrán 0 votos inicialmente.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Navigation */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Paso {editCurrentStep} de {editSteps.length}
                  </div>

                  <div className="flex items-center space-x-3">
                    {editCurrentStep > 1 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={goToPreviousEditStep}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </motion.button>
                    )}

                    {editCurrentStep < editSteps.length ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={goToNextEditStep}
                        disabled={!isEditFormValid}
                        className={`
                          px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2
                          ${isEditFormValid
                            ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }
                        `}
                      >
                        <span>Siguiente</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditElection(e);
                        }}
                        disabled={!isEditFormValid}
                        className={`
                          px-8 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg
                          ${isEditFormValid
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }
                        `}
                      >
                        <Save className="w-4 h-4" />
                        <span>Actualizar Elección</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ElectionManagement;
