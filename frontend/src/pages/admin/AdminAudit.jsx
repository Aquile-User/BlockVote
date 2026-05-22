import React, { useEffect, useState } from 'react';
import { getAudits, getAdmins, exportAuditsExcel } from '../../api';
import toast from 'react-hot-toast';

const ACTION_OPTIONS = [
  { value: 'login', label: 'login' },
  { value: 'create_admin', label: 'create_admin' },
  { value: 'update_admin', label: 'update_admin' },
  { value: 'delete_admin', label: 'delete_admin' },
  { value: 'revoke_tokens', label: 'revoke_tokens' },
  { value: 'export_audits', label: 'export_audits' },
];

const DEFAULT_FILTERS = {
  actorId: '',
  targetId: '',
  action: '',
  since: '',
  until: '',
};

const DEFAULT_VISIBLE_COLUMNS = {
  id: true,
  actor: true,
  action: true,
  target: true,
  details: true,
  ip: true,
  userAgent: false,
  created: true,
};

const VISIBLE_COLUMNS_STORAGE_KEY = 'blockvote.adminAudit.visibleColumns';

const AdminAudit = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [adminMap, setAdminMap] = useState({});
  const [adminOptions, setAdminOptions] = useState([]);
  const [openDetailsId, setOpenDetailsId] = useState(null);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_VISIBLE_COLUMNS;
    }

    try {
      const stored = window.localStorage.getItem(VISIBLE_COLUMNS_STORAGE_KEY);
      if (!stored) {
        return DEFAULT_VISIBLE_COLUMNS;
      }

      const parsed = JSON.parse(stored);
      return { ...DEFAULT_VISIBLE_COLUMNS, ...(parsed || {}) };
    } catch (error) {
      console.warn('Failed to load audit column preferences', error);
      return DEFAULT_VISIBLE_COLUMNS;
    }
  });
  const rowPaddingClass = 'py-2';

  useEffect(() => {
    loadAudits(1, DEFAULT_FILTERS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch (error) {
      console.warn('Failed to save audit column preferences', error);
    }
  }, [visibleColumns]);

  function buildQueryParams(currentPage = 1, currentFilters = filters) {
    const params = { page: currentPage, pageSize };
    if (currentFilters.actorId) params.actorId = currentFilters.actorId;
    if (currentFilters.targetId) params.targetId = currentFilters.targetId;
    if (currentFilters.action) params.action = currentFilters.action;
    if (currentFilters.since) params.since = currentFilters.since;
    if (currentFilters.until) params.until = currentFilters.until;
    return params;
  }

  async function loadAudits(currentPage = 1, currentFilters = filters) {
    setLoading(true);
    try {
      const [auditResponse, admins] = await Promise.all([
        getAudits(buildQueryParams(currentPage, currentFilters)),
        getAdmins(),
      ]);

      const map = {};
      const options = Array.isArray(admins) ? admins : [];
      options.forEach((admin) => {
        map[admin.id] = admin.username;
      });

      setAdminMap(map);
      setAdminOptions(options);
      setItems(auditResponse?.items || []);
      setPage(auditResponse?.page || currentPage);
    } catch (error) {
      console.error('Failed to load audits', error);
      toast.error('No se pudieron cargar las auditorías.');
    } finally {
      setLoading(false);
    }
  }

  function humanAction(action) {
    const labels = {
      login: 'Inicio de sesión',
      create_admin: 'Creó administrador',
      update_admin: 'Actualizó administrador',
      delete_admin: 'Eliminó administrador',
      revoke_tokens: 'Revocó tokens',
      export_audits: 'Exportó auditorías',
    };

    return labels[action] || action || '';
  }

  function prettyDetails(details) {
    if (!details) return '';
    if (typeof details === 'string') return details;

    try {
      return JSON.stringify(details, null, 2);
    } catch (error) {
      return String(details);
    }
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  }

  async function handleExport() {
    try {
      const blob = await exportAuditsExcel({ filters, visibleColumns });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'auditoria_admins.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Exportación preparada. Descargando Excel...');
    } catch (error) {
      console.error('Export failed', error);
      toast.error('No se pudo exportar las auditorías.');
    }
  }

  function applyFilters() {
    setPage(1);
    loadAudits(1, filters);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    loadAudits(1, DEFAULT_FILTERS);
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">Auditoría</h2>
            <p className="text-gray-600 mt-1">Registros de acciones administrativas.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <button
                onClick={() => setShowColumnsMenu((state) => !state)}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
              >
                Columnas
              </button>
              {showColumnsMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white border rounded shadow p-3 z-20">
                  <div className="text-sm font-medium mb-2">Mostrar columnas</div>
                  {Object.keys(visibleColumns).map((key) => (
                    <label key={key} className="flex items-center text-sm mb-1">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => setVisibleColumns((current) => ({ ...current, [key]: !current[key] }))}
                        className="mr-2"
                      />
                      <span className="capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => loadAudits(page, filters)} className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm">
              Actualizar
            </button>
            <button onClick={handleExport} className="px-3 py-2 bg-white border rounded-lg text-sm">
              Exportar XLSX
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-slate-50/70 p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Acción</label>
              <select
                value={filters.action}
                onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Todas</option>
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Actor</label>
              <select
                value={filters.actorId}
                onChange={(event) => setFilters((current) => ({ ...current, actorId: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Todos</option>
                {adminOptions.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Target</label>
              <select
                value={filters.targetId}
                onChange={(event) => setFilters((current) => ({ ...current, targetId: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Todos</option>
                {adminOptions.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Desde</label>
              <input
                type="date"
                value={filters.since}
                onChange={(event) => setFilters((current) => ({ ...current, since: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Hasta</label>
              <input
                type="date"
                value={filters.until}
                onChange={(event) => setFilters((current) => ({ ...current, until: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-5 flex flex-wrap items-center gap-3 pt-1">
              <button onClick={applyFilters} className="px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium shadow-sm transition-colors hover:bg-primary-600">
                Aplicar filtros
              </button>
              <button onClick={resetFilters} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium shadow-sm transition-colors hover:bg-gray-50">
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center text-gray-600">Cargando auditorías...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-gray-600">No hay registros de auditoría.</div>
        ) : (
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="text-sm text-gray-600 border-b border-gray-200">
                {visibleColumns.id && <th className={`${rowPaddingClass} px-2 whitespace-nowrap`}>ID</th>}
                {visibleColumns.actor && <th className={`${rowPaddingClass} px-2 whitespace-nowrap`}>Actor</th>}
                {visibleColumns.action && <th className={`${rowPaddingClass} px-2 whitespace-nowrap`}>Acción</th>}
                {visibleColumns.target && <th className={`${rowPaddingClass} px-2 whitespace-nowrap`}>Target</th>}
                {visibleColumns.details && <th className={`${rowPaddingClass} px-2`}>Detalles</th>}
                {visibleColumns.ip && <th className={`${rowPaddingClass} px-2 whitespace-nowrap`}>IP</th>}
                {visibleColumns.userAgent && <th className={`${rowPaddingClass} px-2 whitespace-nowrap`}>User-Agent</th>}
                {visibleColumns.created && <th className={`${rowPaddingClass} px-2 whitespace-nowrap`}>Creado</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((audit) => (
                <React.Fragment key={audit.id}>
                  <tr className="border-b border-gray-100 text-sm">
                    {visibleColumns.id && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>#{audit.id}</td>}
                    {visibleColumns.actor && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>{adminMap[audit.actorAdminId] ?? (audit.actorAdminId ?? '-')}</td>}
                    {visibleColumns.action && <td className={`${rowPaddingClass} px-2 align-top font-medium whitespace-nowrap`}>{humanAction(audit.action)}</td>}
                    {visibleColumns.target && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>{adminMap[audit.targetAdminId] ?? (audit.targetAdminId ?? '-')}</td>}
                    {visibleColumns.details && (
                      <td className={`${rowPaddingClass} px-2 align-top min-w-[320px]`}>
                        {audit.details ? (
                          <div>
                            <button
                              onClick={() => setOpenDetailsId(openDetailsId === audit.id ? null : audit.id)}
                              className="text-sm text-primary-600 underline"
                            >
                              {openDetailsId === audit.id ? 'Ocultar detalles' : 'Mostrar detalles'}
                            </button>
                            {openDetailsId === audit.id && (
                              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto min-w-[600px]">{prettyDetails(audit.details)}</pre>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    )}
                    {visibleColumns.ip && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>{audit.ip ?? '-'}</td>}
                    {visibleColumns.userAgent && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>{audit.userAgent ?? '-'}</td>}
                    {visibleColumns.created && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>{formatDateTime(audit.createdAt)}</td>}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminAudit;
