import React from 'react';

export interface DtColumn<T> {
  key: string;
  label: string;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: DtColumn<any>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  keyField?: keyof T;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  stickyHeader?: boolean;
}

const CELL: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.78)',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  verticalAlign: 'middle',
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Belum ada data',
  emptyIcon = '◈',
  keyField = 'id' as keyof T,
  onRowClick,
  rowActions,
  stickyHeader = false,
}: DataTableProps<T>) {
  const shell: React.CSSProperties = {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    overflow: 'hidden',
  };

  if (loading) {
    return (
      <div style={{ ...shell, padding: '56px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.05em' }}>
          Memuat data…
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ ...shell, padding: '72px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '14px', opacity: 0.25 }}>{emptyIcon}</div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.35)' }}>
          {emptyMessage}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', marginTop: '6px' }}>
          Klik tombol tambah untuk memulai
        </div>
      </div>
    );
  }

  const hasActions = Boolean(rowActions);

  return (
    <div style={{ ...shell, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
        {/* Header */}
        <thead style={stickyHeader ? { position: 'sticky', top: 0, zIndex: 2 } : undefined}>
          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  padding: '10px 16px',
                  textAlign: col.align ?? 'left',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.28)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  width: col.width,
                  minWidth: col.minWidth,
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
            {hasActions && (
              <th
                style={{
                  padding: '10px 16px',
                  width: '80px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              />
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row, i) => (
            <BodyRow
              key={String(row[keyField] ?? i)}
              row={row}
              columns={columns}
              index={i}
              isLast={i === data.length - 1}
              onClick={onRowClick}
              rowActions={rowActions}
              cell={CELL}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Row sub-component (avoids inline handler recreation per cell) ─────────────

function BodyRow<T extends Record<string, unknown>>({
  row, columns, index, isLast, onClick, rowActions, cell,
}: {
  row: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: DtColumn<any>[];
  index: number;
  isLast: boolean;
  onClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  cell: React.CSSProperties;
}) {
  const [hov, setHov] = React.useState(false);

  return (
    <tr
      onClick={() => onClick?.(row)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        background: hov ? 'rgba(255,255,255,0.03)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {columns.map(col => {
        const rawValue = row[col.key];
        return (
          <td
            key={col.key}
            style={{
              ...cell,
              textAlign: col.align ?? 'left',
              borderBottom: isLast ? 'none' : cell.borderBottom,
              width: col.width,
              minWidth: col.minWidth,
            }}
          >
            {col.render
              ? col.render(rawValue, row, index)
              : rawValue != null
              ? String(rawValue)
              : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
          </td>
        );
      })}
      {rowActions && (
        <td
          style={{
            ...cell,
            borderBottom: isLast ? 'none' : cell.borderBottom,
            textAlign: 'right',
            width: '80px',
          }}
        >
          {rowActions(row)}
        </td>
      )}
    </tr>
  );
}

// ─── Convenience badge renderer ────────────────────────────────────────────────

interface BadgeOpts {
  true?: { label?: string; bg?: string; color?: string; border?: string };
  false?: { label?: string; bg?: string; color?: string; border?: string };
}

export function boolBadge(value: unknown, opts?: BadgeOpts): React.ReactNode {
  const on = Boolean(value);
  const cfg = opts?.[on ? 'true' : 'false'];
  const label = cfg?.label ?? (on ? 'Aktif' : 'Nonaktif');
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 500,
      background: cfg?.bg ?? (on ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)'),
      color: cfg?.color ?? (on ? '#4ADE80' : '#F87171'),
      border: `1px solid ${cfg?.border ?? (on ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)')}`,
    }}>
      {label}
    </span>
  );
}

export function textBadge(
  label: string,
  color = 'rgba(255,255,255,0.6)',
  bg = 'rgba(255,255,255,0.06)',
  border = 'rgba(255,255,255,0.1)',
): React.ReactNode {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 500,
      background: bg,
      color,
      border: `1px solid ${border}`,
    }}>
      {label}
    </span>
  );
}

export function moneyCell(value: unknown): React.ReactNode {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      Rp {n.toLocaleString('id-ID')}
    </span>
  );
}

export function numberCell(value: unknown, suffix = ''): React.ReactNode {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {n.toLocaleString('id-ID')}{suffix ? ` ${suffix}` : ''}
    </span>
  );
}
