import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Crown,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { createAdmin, deleteAdmin, getAdmins, updateAdmin } from "../../api";

const initialCreateForm = {
  username: "",
  password: "",
  role: "admin",
};

const AdminManagement = ({ currentAdmin }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createForm, setCreateForm] = useState(initialCreateForm);

  const isSuperadmin = currentAdmin?.role === "superadmin";

  const sortedAdmins = useMemo(() => {
    return [...admins].sort((a, b) => a.id - b.id);
  }, [admins]);

  const filteredAdmins = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return sortedAdmins.filter((admin) => {
      const matchesSearch = !search || admin.username.toLowerCase().includes(search);
      const matchesRole = roleFilter === "all" || admin.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && admin.isActive) ||
        (statusFilter === "inactive" && !admin.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [sortedAdmins, searchTerm, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = admins.length;
    const active = admins.filter((admin) => admin.isActive).length;
    const superadmins = admins.filter((admin) => admin.role === "superadmin").length;

    return {
      total,
      active,
      inactive: Math.max(total - active, 0),
      superadmins,
    };
  }, [admins]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await getAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading admins:", error);
      const status = error?.response?.status;
      if (status === 401) toast.error("Sesión expirada. Inicia sesión nuevamente.");
      else if (status === 403) toast.error("No tienes permisos para listar administradores.");
      else toast.error("No se pudo cargar la lista de administradores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const resetCreateForm = () => {
    setCreateForm(initialCreateForm);
    setShowCreateModal(false);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!createForm.username.trim() || !createForm.password.trim()) {
      toast.error("Usuario y contraseña son obligatorios.");
      return;
    }

    if (createForm.password.trim().length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setSubmitting(true);
      const created = await createAdmin({
        username: createForm.username.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      toast.success(`Administrador ${created.username} creado correctamente.`);
      resetCreateForm();
      await loadAdmins();
    } catch (error) {
      console.error("Error creating admin:", error);
      const status = error?.response?.status;
      const message = error?.response?.data?.error;

      if (status === 409) toast.error("Ese nombre de usuario ya existe.");
      else if (status === 403) toast.error("Solo un superadmin puede crear administradores.");
      else toast.error(message || "No se pudo crear el administrador.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAdmin = async (admin) => {
    if (!isSuperadmin) {
      toast.error("Solo un superadmin puede cambiar el estado de administradores.");
      return;
    }

    if (currentAdmin?.id === admin.id) {
      toast.error("No puedes desactivarte a ti mismo desde esta pantalla.");
      return;
    }

    try {
      setActionLoadingId(admin.id);
      await updateAdmin(admin.id, { isActive: !admin.isActive });
      toast.success(
        admin.isActive
          ? `Administrador ${admin.username} desactivado.`
          : `Administrador ${admin.username} activado.`,
      );
      await loadAdmins();
    } catch (error) {
      console.error("Error toggling admin status:", error);
      const status = error?.response?.status;
      const message = error?.response?.data?.error;

      if (status === 403) toast.error("No tienes permisos para esta acción.");
      else toast.error(message || "No se pudo actualizar el estado del administrador.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const askDeleteAdmin = (admin) => {
    setDeleteCandidate(admin);
  };

  const confirmDeleteAdmin = async () => {
    const admin = deleteCandidate;
    if (!admin) return;

    if (!isSuperadmin) {
      toast.error("Solo un superadmin puede eliminar administradores.");
      return;
    }

    if (currentAdmin?.id === admin.id) {
      toast.error("No puedes eliminar tu propia cuenta desde esta pantalla.");
      return;
    }

    try {
      setActionLoadingId(admin.id);
      await deleteAdmin(admin.id);
      toast.success(`Administrador ${admin.username} eliminado correctamente.`);
      setDeleteCandidate(null);
      await loadAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      const status = error?.response?.status;
      const message = error?.response?.data?.error;

      if (status === 403) toast.error("No tienes permisos para eliminar administradores.");
      else toast.error(message || "No se pudo eliminar el administrador.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Administradores</h2>
            <p className="text-gray-600 mt-1">
              Lista, creación, activación y eliminación de administradores del sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdmins}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!isSuperadmin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={isSuperadmin ? "Crear administrador" : "Solo superadmin"}
            >
              <Plus className="w-4 h-4" />
              Nuevo Admin
            </button>
          </div>
        </div>

        {!isSuperadmin && (
          <div className="mt-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
            Tu rol actual es {currentAdmin?.role || "admin"}. Solo el superadmin puede crear, activar, desactivar y eliminar administradores.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Total Admins",
            value: stats.total,
            className: "from-sky-50 to-sky-100/70 border-sky-200/70",
            icon: Users,
          },
          {
            label: "Activos",
            value: stats.active,
            className: "from-emerald-50 to-emerald-100/70 border-emerald-200/70",
            icon: UserCheck,
          },
          {
            label: "Inactivos",
            value: stats.inactive,
            className: "from-rose-50 to-rose-100/70 border-rose-200/70",
            icon: UserX,
          },
          {
            label: "Superadmins",
            value: stats.superadmins,
            className: "from-amber-50 to-amber-100/70 border-amber-200/70",
            icon: Crown,
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`rounded-2xl border p-4 bg-gradient-to-br ${item.className}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">{item.label}</p>
                <Icon className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{item.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="glass-card p-4 md:p-5">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Filter className="w-4 h-4" />
          Filtros
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="glass-card p-4 md:p-6 overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-600">Cargando administradores...</div>
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            {admins.length === 0
              ? "No hay administradores registrados."
              : "No hay resultados con los filtros aplicados."}
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600 text-sm">
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-2">Usuario</th>
                    <th className="py-3 px-2">Rol</th>
                    <th className="py-3 px-2">Estado</th>
                    <th className="py-3 px-2">Creado</th>
                    <th className="py-3 px-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="border-b border-gray-100">
                      <td className="py-3 px-2 font-medium text-gray-800">#{admin.id}</td>
                      <td className="py-3 px-2 text-gray-700">{admin.username}</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
                          <Shield className="w-3 h-3" />
                          {admin.role}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${admin.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                            }`}
                        >
                          {admin.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {admin.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600 text-sm">
                        {admin.createdAt ? new Date(admin.createdAt).toLocaleString() : "-"}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleAdmin(admin)}
                            disabled={!isSuperadmin || currentAdmin?.id === admin.id || actionLoadingId === admin.id}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${admin.isActive
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {actionLoadingId === admin.id ? "Procesando..." : admin.isActive ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            onClick={() => askDeleteAdmin(admin)}
                            disabled={!isSuperadmin || currentAdmin?.id === admin.id || actionLoadingId === admin.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filteredAdmins.map((admin) => (
                <div key={admin.id} className="border border-gray-200 rounded-xl p-4 bg-white/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{admin.username}</p>
                      <p className="text-xs text-gray-500">ID #{admin.id} • {admin.role}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${admin.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                    >
                      {admin.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Creado: {admin.createdAt ? new Date(admin.createdAt).toLocaleString() : "-"}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleToggleAdmin(admin)}
                      disabled={!isSuperadmin || currentAdmin?.id === admin.id || actionLoadingId === admin.id}
                      className="flex-1 px-3 py-2 rounded-lg text-sm bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === admin.id ? "Procesando..." : admin.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => askDeleteAdmin(admin)}
                      disabled={!isSuperadmin || currentAdmin?.id === admin.id || actionLoadingId === admin.id}
                      className="flex-1 px-3 py-2 rounded-lg text-sm bg-rose-100 text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {deleteCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteCandidate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-rose-100 p-2 text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Confirmar eliminación</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Vas a eliminar a <strong>{deleteCandidate.username}</strong>. Esta acción es irreversible.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAdmin}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={resetCreateForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-800">Crear Administrador</h3>
                <button
                  onClick={resetCreateForm}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Usuario</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, username: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
                    placeholder="nuevo_admin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Rol</label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    <option value="admin">admin</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetCreateForm}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50"
                  >
                    {submitting ? "Creando..." : "Crear"}
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

export default AdminManagement;
