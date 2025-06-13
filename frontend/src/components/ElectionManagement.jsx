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
  Check
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
  ];

  // Form validation
  useEffect(() => {
    validateCurrentStep();
  }, [createForm, currentStep]);

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
  };
  const resetWizard = () => {
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
  };
  const handleEditElection = async (e) => {
    e.preventDefault();

    try {
      let updated = false;

      // Update election name if changed
      if (editForm.name.trim() && editForm.name !== editingElection.name) {
        const response = await updateElectionName(editingElection.id, editForm.name.trim());
        if (response.success) {
          toast.success("Election name updated successfully!");
          updated = true;
        }
      }

      // Add new candidate if provided
      if (editForm.newCandidate.trim()) {
        const response = await addCandidate(editingElection.id, editForm.newCandidate.trim());
        if (response.success) {
          toast.success("Candidate added successfully!");
          updated = true;
        }
      }

      if (updated) {
        // Reset form and close modal
        setEditForm({ name: "", newCandidate: "" });
        setEditingElection(null);

        // Refresh elections list
        await loadElections();
      } else {
        toast.info("No changes to update");
      }

    } catch (error) {
      console.error('Error updating election:', error);
      toast.error('Failed to update election');
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
      </div>{/* Elections Grid */}
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
          })
          .map((election) => (
            <motion.div
              key={election.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 card-hover"
            >
              {/* Election Header */}
              <div className="flex items-start justify-between mb-4">
                <div>                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  {election.name}
                </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(election.status)}`}>
                    {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                  </span>
                </div>                <div className="flex items-center space-x-2">                  <button
                  onClick={() => setSelectedElection(election)}
                  className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-lg transition-all duration-200"
                  title="Ver Detalles"
                >
                  <Eye className="w-4 h-4" />
                </button>
                  <button
                    onClick={() => startEditElection(election)}
                    className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-lg transition-all duration-200"
                    title="Editar Elección"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>              {/* Election Info */}              <div className="space-y-3">
                <div className="flex items-center text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Inicio: {formatDate(election.startTime)}</span>
                </div>

                <div className="flex items-center text-gray-600 text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Fin: {formatDate(election.endTime)}</span>
                </div>

                <div className="flex items-center text-slate-600 text-sm">
                  <Users className="w-4 h-4 mr-2 text-slate-500" />
                  <span>{election.candidates.length} candidatos, {election.totalVotes} votos</span>
                </div>
              </div>              {/* Candidates */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-600 mb-2">Candidatos:</h4>
                <div className="flex flex-wrap gap-2">
                  {election.candidates.map((candidate, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-xs hover:bg-slate-100 transition-colors"
                    >
                      {candidate} ({election.results[candidate] || 0} votos)
                    </span>
                  ))}
                </div>
              </div>              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-gray-600 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  ID: {election.id}
                </div>

                <div className="flex items-center space-x-2">                  {!election.disabled && (
                  <button
                    className="flex items-center space-x-1 text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border border-rose-200 hover:border-rose-500 shadow-sm"
                    onClick={() => handleToggleElectionStatus(election)}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Deshabilitar</span>
                  </button>
                )}
                  {election.disabled && (
                    <button
                      className="flex items-center space-x-1 text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border border-emerald-200 hover:border-emerald-500 shadow-sm"
                      onClick={() => handleToggleElectionStatus(election)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Habilitar</span>
                    </button>
                  )}
                </div>
              </div></motion.div>
          ))}
      </div>      {elections.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-300" />
          </div>          <h3 className="text-xl font-semibold text-slate-800 mb-2">No se encontraron elecciones</h3>
          <p className="text-slate-600 mb-4">Crea tu primera elección para comenzar.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Crear Elección
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {/* Election Detail Modal */}
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
              exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-sm"
            >              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Detalles de la Elección</h2>
                <button
                  onClick={() => setSelectedElection(null)}
                  className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Información Básica</h3>
                  <div className="space-y-3">                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">ID de Elección</label>
                      <p className="text-slate-800">{selectedElection.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Estado</label>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedElection.status)}`}>
                        {selectedElection.status.charAt(0).toUpperCase() + selectedElection.status.slice(1)}
                      </span>
                    </div>
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
                      <p className="text-slate-800">{selectedElection.name}</p>
                    </div>
                  </div>
                </div>                {/* Timing */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Horarios</h3>                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Hora de Inicio</label>
                      <p className="text-slate-800">{formatDate(selectedElection.startTime)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Hora de Fin</label>
                      <p className="text-slate-800">{formatDate(selectedElection.endTime)}</p>
                    </div>
                  </div>
                </div>                {/* Candidates & Results */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Candidatos y Resultados</h3>
                  <div className="space-y-3">
                    {selectedElection.candidates.map((candidate, index) => (<div key={index} className="flex items-center justify-between p-3 bg-dark-accent border border-gray-600 rounded-lg hover:bg-gray-600/30 transition-colors">
                      <span className="text-slate-800 font-medium">{candidate}</span>
                      <div className="text-right">
                        <span className="text-slate-600 text-sm">
                          {selectedElection.results[candidate] || 0} votos
                        </span>
                        <div className="text-xs text-slate-500">
                          {((selectedElection.results[candidate] || 0) / Math.max(selectedElection.totalVotes, 1) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>                  <div className="mt-4 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200 font-medium">Total de Votos Emitidos</span>
                      <span className="text-slate-800 text-lg font-bold">{selectedElection.totalVotes}</span>
                    </div>
                  </div>
                </div>                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-600">
                  <button
                    onClick={() => setSelectedElection(null)}
                    className="btn-secondary"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedElection(null);
                      startEditElection(selectedElection);
                    }}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar Elección</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}        {/* Create Election Modal - Multi-Step Wizard */}
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
                            <span className="font-medium">Duración de la Elección</span>
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
                        disabled={!isFormValid}                        className={`
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
                        disabled={!isFormValid}                        className={`
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
        )}

        {/* Edit Election Modal */}
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
              exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-lg shadow-sm"
            >              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Editar Elección</h2>
                <button
                  onClick={() => setEditingElection(null)}
                  className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditElection} className="space-y-6">                {/* Current Election Info */}                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Elección Actual</h3>
                <p className="text-gray-800 font-semibold">{editingElection.name}</p>
                <p className="text-gray-500 text-sm">ID: {editingElection.id}</p>
              </div>

                {/* Update Election Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Actualizar Nombre de la Elección
                  </label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="Ingrese el nuevo nombre de la elección"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Add New Candidate */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Agregar Nuevo Candidato
                  </label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="Ingrese el nombre del candidato"
                    value={editForm.newCandidate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, newCandidate: e.target.value }))}
                  />
                </div>

                {/* Current Candidates */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Candidatos Actuales
                  </label>
                  <div className="space-y-2">
                    {editingElection.candidates.map((candidate, index) => (
                      <div key={index} className="flex items-center justify-between bg-dark-accent border border-gray-600 p-3 rounded-lg">
                        <span className="text-slate-600">{candidate}</span>
                        <span className="text-slate-500 text-sm">
                          {editingElection.results[candidate] || 0} votos
                        </span>
                      </div>
                    ))}
                  </div>
                </div>                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-600">
                  <button
                    type="button"
                    onClick={() => setEditingElection(null)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Actualizar Elección</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ElectionManagement;
