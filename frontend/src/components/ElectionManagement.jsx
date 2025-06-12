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
  AlertTriangle
} from "lucide-react";
import { getElections, getElectionById, getResults, createElection, disableElection, enableElection, updateElectionName, addCandidate } from "../api";
import { DOMINICAN_PROVINCES } from "../utils/dominican";

const ElectionManagement = ({ user }) => {
  const [elections, setElections] = useState([]); const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedElection, setSelectedElection] = useState(null);
  const [editingElection, setEditingElection] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    newCandidate: ""
  });

  const [createForm, setCreateForm] = useState({
    name: "",
    candidates: ["", ""],
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: ""
  });

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

  const handleCreateElection = async (e) => {
    e.preventDefault();

    try {      // Validate form
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
        toast.success(`Election created successfully! TX: ${response.txHash}`);
        setCreateForm({
          name: "",
          candidates: ["", ""],
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: "",
          description: ""
        });
        setShowCreateModal(false);

        // Refresh elections list
        await loadElections();
      } else {
        throw new Error(response.error || 'Failed to create election');
      }

    } catch (error) {
      console.error('Error creating election:', error);
      toast.error('Failed to create election');
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
        return 'text-green-300 bg-green-500/25 border border-green-500/30';
      case 'upcoming':
        return 'text-blue-300 bg-blue-500/25 border border-blue-500/30';
      case 'expired':
        return 'text-orange-300 bg-orange-500/25 border border-orange-500/30';
      case 'disabled':
        return 'text-red-300 bg-red-500/25 border border-red-500/30';
      default:
        return 'text-gray-300 bg-gray-500/25 border border-gray-500/30';
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
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestión de Elecciones</h1>
          <p className="text-slate-600 mt-2">Crear y administrar elecciones de votación</p>
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
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-1">
                    {election.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(election.status)}`}>
                    {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                  </span>
                </div>                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedElection(election)}
                    className="p-2 hover:bg-gray-600 text-gray-100 hover:text-white rounded-lg transition-all duration-200"
                    title="Ver Detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEditElection(election)}
                    className="p-2 hover:bg-gray-600 text-gray-100 hover:text-white rounded-lg transition-all duration-200"
                    title="Editar Elección"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>              {/* Election Info */}
              <div className="space-y-3">
                <div className="flex items-center text-slate-600 text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                  <span>Inicio: {formatDate(election.startTime)}</span>
                </div>

                <div className="flex items-center text-slate-600 text-sm">
                  <Clock className="w-4 h-4 mr-2 text-slate-500" />
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

                <div className="flex items-center space-x-2">
                  {!election.disabled && (
                    <button
                      className="text-red-200 hover:text-white hover:bg-red-500/30 px-3 py-1 rounded-lg text-sm transition-all duration-200 border border-red-400/50 hover:border-red-400"
                      onClick={() => handleToggleElectionStatus(election)}
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Deshabilitar
                    </button>
                  )}
                  {election.disabled && (
                    <button
                      className="text-green-200 hover:text-white hover:bg-green-500/30 px-3 py-1 rounded-lg text-sm transition-all duration-200 border border-green-400/50 hover:border-green-400"
                      onClick={() => handleToggleElectionStatus(election)}
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Habilitar
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
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-card rounded-xl border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Detalles de la Elección</h2>
                <button
                  onClick={() => setSelectedElection(null)}
                  className="p-2 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
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
        )}

        {/* Create Election Modal */}
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
              className="bg-dark-card rounded-xl border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Crear Nueva Elección</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateElection} className="space-y-6">                {/* Election Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Nombre de la Elección *
                  </label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="ej., Elección Presidencial 2024"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Descripción
                  </label>
                  <textarea
                    className="input-field w-full h-24 resize-none"
                    placeholder="Breve descripción de la elección..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Candidates */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Candidatos * (mínimo 2)
                  </label>
                  <div className="space-y-3">
                    {createForm.candidates.map((candidate, index) => (
                      <div key={index} className="flex items-center space-x-3">                        <input
                        type="text"
                        className="input-field flex-1"
                        placeholder={`Nombre del candidato ${index + 1}`}
                        value={candidate}
                        onChange={(e) => updateCandidate(index, e.target.value)}
                        required={index < 2}
                      />
                        {createForm.candidates.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeCandidate(index)}
                            className="p-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}                      <button
                      type="button"
                      onClick={addCandidateToForm}
                      className="btn-secondary text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Candidato
                    </button>
                  </div>
                </div>                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Fecha y Hora de Inicio *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        className="input-field"
                        value={createForm.startDate}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                      <input
                        type="time"
                        className="input-field"
                        value={createForm.startTime}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, startTime: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Fecha y Hora de Fin *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        className="input-field"
                        value={createForm.endDate}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                      />
                      <input
                        type="time"
                        className="input-field"
                        value={createForm.endTime}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, endTime: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-600">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Crear Elección</span>
                  </button>
                </div>
              </form>            </motion.div>
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
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-card rounded-xl border border-gray-700 p-6 w-full max-w-lg"
            >              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Editar Elección</h2>
                <button
                  onClick={() => setEditingElection(null)}
                  className="p-2 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditElection} className="space-y-6">                {/* Current Election Info */}
                <div className="bg-dark-accent border border-gray-600 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Elección Actual</h3>
                  <p className="text-slate-800 font-semibold">{editingElection.name}</p>
                  <p className="text-slate-500 text-sm">ID: {editingElection.id}</p>
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
