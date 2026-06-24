import React, { useState, useRef, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// InlineTable — Excel/Linear/Notion-style click-to-edit grid.
//   • Klik cell → jadi input. Tab → cell berikutnya. Enter di row terakhir →
//     row baru. Escape → batal. Blur → auto-save ke repository/context.
//   • Handler boleh sync (ERPContext mutators) atau async (repository).
// ─────────────────────────────────────────────────────────────────────────────

export interface InlineColumn<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  type?: 'text' | 'number' | 'select' | 'currency' | 'date';
  options?: { label: string; value: string }[];
  required?: boolean;
  align?: 'left' | 'right' | 'center';
  readOnly?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: T) => React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (value: any) => string;
}

interface InlineTableProps<T extends { id?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: InlineColumn<any>[];
  data: T[];
  onSave: (row: T, isNew: boolean) => void | Promise<void>;
  onDelete?: (row: T) => void | Promise<void>;
  onError?: (err: unknown) => void;
  emptyMessage?: string;
  loading?: boolean;
  newRowDefaults?: Partial<T>;
  accent?: string;
}

type Row<T> = T & { _isNew?: boolean };

export function InlineTable<T extends { id?: string }>({
  columns, data, onSave, onDelete, onError,
  emptyMessage, loading, newRowDefaults, accent = '#7c3aed',
}: InlineTableProps<T>) {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string } | null>(null);
  const [localData, setLocalData] = useState<Row<T>[]>(data as Row<T>[]);
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  // Sync external data — but never clobber a row the user is mid-adding.
  useEffect(() => {
    setLocalData(prev => {
      const pendingNew = prev.filter(r => r._isNew);
      return [...(data as Row<T>[]), ...pendingNew];
    });
  }, [data]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) inputRef.current.select();
    }
  }, [editingCell]);

  const accentRGBA = (a: number) => {
    // accent hex → rgba
    const hex = accent.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  };

  const rowIsEmpty = (row: Row<T>) =>
    columns.every(c => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = (row as any)[c.key];
      return v === undefined || v === null || v === '' || (c.type === 'number' && Number(v) === 0) || (c.type === 'currency' && Number(v) === 0);
    });

  const requiredMissing = (row: Row<T>) =>
    columns.some(c => {
      if (!c.required) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = (row as any)[c.key];
      return v === undefined || v === null || String(v).trim() === '';
    });

  const handleCellClick = (rowIndex: number, colKey: string, readOnly?: boolean) => {
    if (readOnly) return;
    setEditingCell({ rowIndex, colKey });
  };

  const handleCellChange = (rowIndex: number, colKey: string, value: unknown) => {
    setLocalData(prev => prev.map((row, i) => (i === rowIndex ? { ...row, [colKey]: value } : row)));
  };

  const commitRow = async (rowIndex: number) => {
    const row = localData[rowIndex];
    if (!row) return;
    setEditingCell(null);

    // Jangan simpan row baru yang masih kosong / belum lengkap.
    if (row._isNew && (rowIsEmpty(row) || requiredMissing(row))) return;

    setSavingRows(prev => new Set(prev).add(rowIndex));
    try {
      await Promise.resolve(onSave(stripMeta(row), !!row._isNew));
      setLocalData(prev => prev.map((r, i) => (i === rowIndex ? { ...r, _isNew: false } : r)));
    } catch (err) {
      onError?.(err);
    } finally {
      setSavingRows(prev => { const s = new Set(prev); s.delete(rowIndex); return s; });
    }
  };

  const stripMeta = (row: Row<T>): T => {
    const clone = { ...row } as Row<T>;
    delete clone._isNew;
    if (row._isNew) delete (clone as { id?: string }).id; // temp id → biar repo/context generate
    return clone as T;
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      // next editable column to the right
      let next = colIndex + 1;
      while (next < columns.length && columns[next].readOnly) next++;
      if (next < columns.length) {
        setEditingCell({ rowIndex, colKey: String(columns[next].key) });
      } else {
        void commitRow(rowIndex);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      void commitRow(rowIndex);
      if (rowIndex === localData.length - 1) addNewRow();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setLocalData(prev => prev.filter((r, i) => !(i === rowIndex && r._isNew && rowIsEmpty(r))));
    }
  };

  const addNewRow = () => {
    const newRow = { ...(newRowDefaults || {}), _isNew: true, id: `new-${Date.now()}` } as Row<T>;
    setLocalData(prev => [...prev, newRow]);
    const idx = localData.length;
    setTimeout(() => setEditingCell({ rowIndex: idx, colKey: String(columns[0].key) }), 40);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: accentRGBA(0.08),
    border: `1.5px solid ${accentRGBA(0.5)}`,
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.92)',
    outline: 'none',
    boxSizing: 'border-box',
    fontVariantNumeric: 'tabular-nums',
  };

  const renderCell = (row: Row<T>, rowIndex: number, col: InlineColumn<T>, colIndex: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (row as any)[col.key];
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colKey === String(col.key);
    const isSaving = savingRows.has(rowIndex);

    const displayValue = (): React.ReactNode => {
      if (col.render) return col.render(value, row);
      if (col.format) return col.format(value);
      if (col.type === 'currency') return value ? `Rp ${Number(value).toLocaleString('id-ID')}` : '—';
      if (col.type === 'number') return value !== '' && value != null ? Number(value).toLocaleString('id-ID') : '—';
      if (col.type === 'select') {
        const opt = col.options?.find(o => o.value === value);
        return opt?.label || value || '—';
      }
      return (value ?? '') !== '' ? value : '—';
    };

    if (isEditing) {
      if (col.type === 'select') {
        return (
          <select
            ref={el => { inputRef.current = el; }}
            value={value ?? ''}
            onChange={e => handleCellChange(rowIndex, String(col.key), e.target.value)}
            onBlur={() => commitRow(rowIndex)}
            onKeyDown={e => handleKeyDown(e, rowIndex, colIndex)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Pilih…</option>
            {col.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      }
      const isNum = col.type === 'number' || col.type === 'currency';
      return (
        <input
          ref={el => { inputRef.current = el; }}
          type={col.type === 'date' ? 'date' : 'text'}
          inputMode={isNum ? 'numeric' : undefined}
          value={value ?? ''}
          onChange={e => {
            const raw = e.target.value;
            handleCellChange(rowIndex, String(col.key), isNum ? raw.replace(/[^0-9.]/g, '') : raw);
          }}
          onBlur={() => commitRow(rowIndex)}
          onKeyDown={e => handleKeyDown(e, rowIndex, colIndex)}
          style={{ ...inputStyle, textAlign: col.align }}
        />
      );
    }

    const isPlaceholder = row._isNew && (value === undefined || value === null || value === '');
    return (
      <span style={{
        display: 'block',
        padding: '4px 2px',
        fontSize: '13px',
        color: isPlaceholder ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.82)',
        fontVariantNumeric: col.type === 'currency' || col.type === 'number' ? 'tabular-nums' : undefined,
        textAlign: col.align,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {isPlaceholder ? col.label : displayValue()}
        {isSaving && <span style={{ marginLeft: 5, fontSize: 11, color: accentRGBA(0.7) }}>•</span>}
      </span>
    );
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)' }}>
        {columns.map(col => (
          <div key={String(col.key)} style={{
            flex: col.width ? undefined : 1,
            width: col.width,
            padding: '10px 14px',
            fontSize: '10.5px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: col.align || 'left',
          }}>
            {col.label}
          </div>
        ))}
        <div style={{ width: '40px', flexShrink: 0 }} />
      </div>

      {/* Empty state */}
      {localData.length === 0 && !loading && (
        <div style={{ padding: '44px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.22)', fontSize: '13px' }}>
          {emptyMessage || 'Belum ada data. Klik “+ Tambah baris” untuk mulai.'}
        </div>
      )}

      {/* Rows */}
      {localData.map((row, rowIndex) => (
        <div
          key={row.id || rowIndex}
          className="inline-table-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: rowIndex < localData.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            background: savingRows.has(rowIndex) ? accentRGBA(0.04) : 'transparent',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { if (!savingRows.has(rowIndex)) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          onMouseLeave={e => { if (!savingRows.has(rowIndex)) e.currentTarget.style.background = 'transparent'; }}
        >
          {columns.map((col, colIndex) => (
            <div
              key={String(col.key)}
              style={{
                flex: col.width ? undefined : 1,
                width: col.width,
                padding: '7px 14px',
                cursor: col.readOnly ? 'default' : 'text',
                minWidth: 0,
              }}
              onClick={() => handleCellClick(rowIndex, String(col.key), col.readOnly)}
            >
              {renderCell(row, rowIndex, col, colIndex)}
            </div>
          ))}
          <div style={{ width: '40px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            {onDelete && !row._isNew && (
              <button
                onClick={e => { e.stopPropagation(); void onDelete(stripMeta(row)); }}
                title="Hapus baris"
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '13px', padding: '4px', borderRadius: '4px', lineHeight: 1, transition: 'color 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.15)')}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add row */}
      <div
        onClick={addNewRow}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', cursor: 'pointer',
          color: 'rgba(255,255,255,0.22)', fontSize: '13px',
          borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = accentRGBA(0.85); e.currentTarget.style.background = accentRGBA(0.04); }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)'; e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
        <span>Tambah baris</span>
      </div>
    </div>
  );
}
