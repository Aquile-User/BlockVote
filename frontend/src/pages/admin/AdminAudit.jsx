import React, { useEffect, useState } from 'react';
import { getAudits, getAdmins, exportAuditsExcel } from '../../api';
import toast from 'react-hot-toast';

const AdminAudit = ({ currentAdmin }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [adminMap, setAdminMap] = useState({});
  const [openDetailsId, setOpenDetailsId] = useState(null);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    actor: true,
    action: true,
    target: true,
    details: true,
    ip: true,
    userAgent: false,
    created: true,
  });
  const rowPaddingClass = 'py-2';

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(p = 1) {
    setLoading(true);
    try {
      const resp = await getAudits({ page: p, pageSize });
      const admins = await getAdmins();
      const map = {};
      if (Array.isArray(admins)) {
        admins.forEach((a) => {
          map[a.id] = a.username;
        });
      }
      setAdminMap(map);
      setItems(resp?.items || []);
      setPage(resp?.page || p);
    } catch (err) {
      console.error('Failed to load audits', err);
      toast.error('No se pudieron cargar las auditorías.');
    } finally {
      setLoading(false);
    }
  }

  function humanAction(action, details) {
    if (!action) return '';
    const map = {
      login: 'Inicio de sesión',
      create_admin: 'Creó administrador',
      update_admin: 'Actualizó administrador',
      delete_admin: 'Eliminó administrador',
      revoke_tokens: 'Revocó tokens',
      export_audits: 'Exportó auditorías',
    };
    return map[action] || action;
  }

  function prettyDetails(details) {
    if (!details) return '';
    try {
      if (typeof details === 'string') return details;
      return JSON.stringify(details, null, 2);
    } catch (err) {
      return String(details);
    }
  }

  function formatDetailsForCsv(details) {
    if (details === null || details === undefined || details === '') {
      return '';
    }

    if (typeof details === 'string') {
      return flattenText(details);
    }

    if (Array.isArray(details)) {
      return details.map((item) => formatDetailsForCsv(item)).filter(Boolean).join('; ');
    }

    if (typeof details === 'object') {
      return Object.entries(details)
        .map(([key, value]) => {
          if (value && typeof value === 'object') {
            return `${key}: ${formatDetailsForCsv(value)}`;
          }

          return `${key}: ${flattenText(value)}`;
        })
        .filter(Boolean)
        .join(', ');
    }

    return flattenText(details);
  }

  function formatDateForCsv(value) {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return flattenText(value);
    }

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function flattenText(value) {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'string' ? value : prettyDetails(value);
    return String(text)
      .replace(/\r?\n|\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseUserAgent(userAgent) {
    const ua = flattenText(userAgent);
    if (!ua) {
      return { browser: '', os: '' };
    }

    const browserPatterns = [
      { label: 'Edge', pattern: /Edg(?:e|A|iOS)?\/([\d.]+)/i },
      { label: 'Opera', pattern: /OPR\/([\d.]+)/i },
      { label: 'Brave', pattern: /Brave\/([\d.]+)/i },
      { label: 'Chrome', pattern: /Chrome\/([\d.]+)/i },
      { label: 'Firefox', pattern: /Firefox\/([\d.]+)/i },
      { label: 'Safari', pattern: /Version\/([\d.]+).*Safari/i },
    ];

    const osPatterns = [
      { label: 'Windows', pattern: /Windows NT/i },
      { label: 'macOS', pattern: /Mac OS X/i },
      { label: 'iOS', pattern: /iPhone|iPad|iPod/i },
      { label: 'Android', pattern: /Android/i },
      { label: 'Linux', pattern: /Linux/i },
      { label: 'Chrome OS', pattern: /CrOS/i },
    ];

    const browser = browserPatterns.find((item) => item.pattern.test(ua))?.label || 'Desconocido';
    const os = osPatterns.find((item) => item.pattern.test(ua))?.label || 'Desconocido';

    return { browser, os };
  }

  function csvCell(value) {
    return '"' + flattenText(value).replace(/"/g, '""') + '"';
  }

  function buildExportColumns() {
    const cols = [];
    if (visibleColumns.id) cols.push({ key: 'id', label: 'ID' });
    if (visibleColumns.actor) cols.push({ key: 'actor', label: 'Actor' });
    if (visibleColumns.action) cols.push({ key: 'action', label: 'Acción' });
    if (visibleColumns.target) cols.push({ key: 'target', label: 'Target' });
    if (visibleColumns.details) cols.push({ key: 'details', label: 'Detalles' });
    if (visibleColumns.ip) cols.push({ key: 'ip', label: 'IP' });
    if (visibleColumns.userAgent) {
      cols.push({ key: 'browser', label: 'Navegador' });
      cols.push({ key: 'os', label: 'SO' });
    }
    if (visibleColumns.created) cols.push({ key: 'created', label: 'Creado' });
    return cols;
  }

  function buildExportRow(it, cols) {
    const { browser, os } = parseUserAgent(it.userAgent);
    return cols.map((c) => {
      switch (c.key) {
        case 'id':
          return `#${it.id}`;
        case 'actor':
          return adminMap[it.actorAdminId] ?? it.actorAdminId ?? '';
        case 'action':
          return humanAction(it.action, it.details);
        case 'target':
          return adminMap[it.targetAdminId] ?? it.targetAdminId ?? '';
        case 'details':
          return formatDetailsForCsv(it.details);
        case 'ip':
          return it.ip ?? '';
        case 'browser':
          return browser;
        case 'os':
          return os;
        case 'created':
          return formatDateForCsv(it.createdAt);
        default:
          return '';
      }
    });
  }

  function applyWorkbookStyles(worksheet, rowCount, colCount) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const evenFill = { fgColor: { rgb: 'F7FBFF' } };
    const oddFill = { fgColor: { rgb: 'FFFFFF' } };
    const headerPalette = [
      '1F4E78',
      '2F75B5',
      '5B9BD5',
      '70AD47',
      'ED7D31',
      'A5A5A5',
      '4472C4',
      'C55A11',
      '548235',
    ];

    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c })];
      if (headerCell) {
        const fillColor = headerPalette[c % headerPalette.length];
        headerCell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: fillColor } },
          border: {
            bottom: { style: 'thin', color: { rgb: 'D9E2F3' } },
            top: { style: 'thin', color: { rgb: 'D9E2F3' } },
            left: { style: 'thin', color: { rgb: 'D9E2F3' } },
            right: { style: 'thin', color: { rgb: 'D9E2F3' } },
          },
          alignment: { vertical: 'center', horizontal: 'center' },
        };
      }
    }

    for (let r = 1; r <= range.e.r; r += 1) {
      const fill = r % 2 === 1 ? oddFill : evenFill;
      for (let c = range.s.c; c <= range.e.c; c += 1) {
        const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
        if (cell) {
          cell.s = {
            ...(cell.s || {}),
            fill,
            alignment: { vertical: 'top', wrapText: true },
          };
        }
      }
    }

    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

    const widths = Array.from({ length: colCount }, (_, colIndex) => {
      let maxLen = 0;
      for (let r = 0; r <= rowCount; r += 1) {
        const cell = worksheet[XLSX.utils.encode_cell({ r, c: colIndex })];
        const text = cell ? flattenText(cell.v) : '';
        maxLen = Math.max(maxLen, text.length);
      }
      return { wch: Math.min(Math.max(maxLen + 2, 12), 45) };
    });

    worksheet['!cols'] = widths;
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Auditoría</h2>
            <p className="text-gray-600 mt-1">Registros de acciones administrativas (login, creación, cambios, eliminación).</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowColumnsMenu((s) => !s)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Columnas</button>
              {showColumnsMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow p-3 z-20">
                  <div className="text-sm font-medium mb-2">Mostrar columnas</div>
                  {Object.keys(visibleColumns).map((key) => (
                    <label key={key} className="flex items-center text-sm mb-1">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => setVisibleColumns((v) => ({ ...v, [key]: !v[key] }))}
                        className="mr-2"
                      />
                      <span className="capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* espacio reservado para controles futuros (densidad quitada) */}

            <div className="flex items-center gap-2">
              <button onClick={() => load(page)} className="px-3 py-2 bg-primary-500 text-white rounded-lg">Actualizar</button>
              <button
                onClick={async () => {
                  try {
                    const blob = await exportAuditsExcel({
                      page,
                      pageSize,
                      visibleColumns,
                    });

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'auditoria_admins.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);

                    toast.success('Exportación preparada. Descargando Excel...');
                  } catch (err) {
                    console.error('Export failed', err);
                    toast.error('No se pudo exportar las auditorías.');
                  }
                }}
                className="px-3 py-2 bg-white border rounded-lg text-sm"
              >
                Exportar XLSX
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
              {items.map((it) => (
                <React.Fragment key={it.id}>
                  <tr className="border-b border-gray-100 text-sm">
                    {visibleColumns.id && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>#{it.id}</td>}
                    {visibleColumns.actor && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>{adminMap[it.actorAdminId] ?? (it.actorAdminId ?? '-')}</td>}
                    {visibleColumns.action && <td className={`${rowPaddingClass} px-2 align-top font-medium whitespace-nowrap`}>{humanAction(it.action, it.details)}</td>}
                    {visibleColumns.target && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>{adminMap[it.targetAdminId] ?? (it.targetAdminId ?? '-')}</td>}
                    {visibleColumns.details && <td className={`${rowPaddingClass} px-2 align-top min-w-[320px]`}>
                      {it.details ? (
                        <div>
                          <button
                            onClick={() => setOpenDetailsId(openDetailsId === it.id ? null : it.id)}
                            className="text-sm text-primary-600 underline"
                          >
                            {openDetailsId === it.id ? 'Ocultar detalles' : 'Mostrar detalles'}
                          </button>
                          {openDetailsId === it.id && (
                            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto min-w-[600px]">{prettyDetails(it.details)}</pre>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>}
                    {visibleColumns.ip && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>{it.ip ?? '-'}</td>}
                    {visibleColumns.userAgent && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>{it.userAgent ?? '-'}</td>}
                    {visibleColumns.created && <td className={`${rowPaddingClass} px-2 align-top whitespace-nowrap`}>{it.createdAt ? new Date(it.createdAt).toLocaleString() : '-'}</td>}
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
