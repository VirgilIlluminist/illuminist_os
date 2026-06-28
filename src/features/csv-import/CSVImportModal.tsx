import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useBusiness } from '../../app/store/BusinessContext';
import { useERP }      from '../../app/store/ERPContext';
import { CSVImportService } from './CSVImportService';
import type { ImportEntity, ImportPreviewRow, ImportResult, ColumnMapping } from './types';
import { ENTITY_TEMPLATES } from './types';
import { Upload, X, Download, AlertTriangle, CheckCircle2, RefreshCw, ChevronDown } from 'lucide-react';

type Step = 'upload' | 'mapping' | 'preview' | 'done';

interface Props {
  entity:    ImportEntity;
  onClose:   () => void;
  onSuccess: (result: ImportResult) => void;
}

export default function CSVImportModal({ entity, onClose, onSuccess }: Props) {
  const { activeBusiness }    = useBusiness();
  const { config: erpConfig } = useERP();
  const accent   = erpConfig?.customAccentColor ?? '#7c3aed';

  const [step,      setStep]      = useState<Step>('upload');
  const [dragging,  setDragging]  = useState(false);
  const [headers,   setHeaders]   = useState<string[]>([]);
  const [rawRows,   setRawRows]   = useState<Record<string, string>[]>([]);
  const [mapping,   setMapping]   = useState<ColumnMapping[]>([]);
  const [preview,   setPreview]   = useState<ImportPreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result,    setResult]    = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const template = ENTITY_TEMPLATES[entity];

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) return;
    const { headers: h, rows } = await CSVImportService.parseFile(file);
    setHeaders(h);
    setRawRows(rows);
    const auto = CSVImportService.buildAutoMapping(h, entity);
    setMapping(auto);
    setStep('mapping');
  }, [entity]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  useEffect(() => {
    if (step === 'preview' && rawRows.length > 0) {
      setPreview(CSVImportService.preview(rawRows, mapping, entity));
    }
  }, [step, rawRows, mapping, entity]);

  const runImport = async () => {
    if (!activeBusiness?.id) return;
    setImporting(true);
    try {
      const r = await CSVImportService.importAll(activeBusiness.id, rawRows, mapping, entity);
      setResult(r);
      setStep('done');
      onSuccess(r);
    } finally { setImporting(false); }
  };

  const setMappingField = (i: number, csvHeader: string) =>
    setMapping(m => m.map((x, idx) => idx === i ? { ...x, csvHeader } : x));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-[var(--color-border-line)] bg-[var(--color-bg-card)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-line)]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-text-main)]">
              Import CSV — {template.label}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {rawRows.length > 0 ? `${rawRows.length} baris ditemukan` : 'Upload file CSV untuk memulai'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => CSVImportService.downloadTemplate(entity)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs uppercase tracking-widest border border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer"
            >
              <Download size={14}/> Template
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)] transition-colors cursor-pointer">
              <X size={14}/>
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex px-5 pt-4 gap-2">
          {(['upload', 'mapping', 'preview', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'text-black' : 'bg-white/5 text-[var(--color-text-muted)]'
              }`} style={step === s ? { background: accent } : {}}>
                {i + 1}
              </div>
              <span className={`text-xs uppercase tracking-widest ${step === s ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-muted)]'}`}>
                {s === 'upload' ? 'Upload' : s === 'mapping' ? 'Mapping' : s === 'preview' ? 'Preview' : 'Selesai'}
              </span>
              {i < 3 && <div className="w-6 h-px bg-[var(--color-border-line)]"/>}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── STEP 1: UPLOAD ─────────────────────────────────────── */}
          {step === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl py-16 cursor-pointer transition-all ${
                dragging ? 'border-white/40 bg-white/5' : 'border-[var(--color-border-line)] hover:border-white/20'
              }`}
            >
              <Upload size={28} className="text-[var(--color-text-muted)]"/>
              <div className="text-center">
                <p className="text-sm text-[var(--color-text-main)]">Drag & drop file CSV</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">atau klik untuk pilih file</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}/>
            </div>
          )}

          {/* ── STEP 2: MAPPING ────────────────────────────────────── */}
          {step === 'mapping' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--color-text-muted)]">
                Cocokkan kolom dari file CSV kamu dengan field yang dibutuhkan.
                Field yang <span className="text-red-400">*</span> wajib diisi.
              </p>
              <div className="space-y-2">
                {mapping.map((m, i) => {
                  const field = template.fields[i];
                  return (
                    <div key={field.name} className="grid grid-cols-5 items-center gap-3">
                      <div className="col-span-2 text-xs text-[var(--color-text-main)]">
                        {field.required && <span className="text-red-400">* </span>}
                        {field.label}
                        <span className="text-xs text-[var(--color-text-muted)] ml-1">({field.name})</span>
                      </div>
                      <div className="col-span-1 text-[var(--color-text-muted)] text-center">→</div>
                      <div className="col-span-2">
                        <select
                          value={m.csvHeader}
                          onChange={e => setMappingField(i, e.target.value)}
                          className="w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-none cursor-pointer"
                        >
                          <option value="">— Tidak dipakai —</option>
                          {headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setStep('upload')}
                  className="px-4 py-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
                  Kembali
                </button>
                <button onClick={() => setStep('preview')}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-black cursor-pointer"
                  style={{ background: accent }}>
                  Preview Data
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: PREVIEW ────────────────────────────────────── */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Preview 10 baris pertama dari {rawRows.length} total baris
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  preview.every(r => r._valid) ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {preview.filter(r => r._valid).length}/{preview.length} valid
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--color-border-line)]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border-line)] bg-white/[0.06]">
                      <th className="px-3 py-2 text-left text-[var(--color-text-muted)]">#</th>
                      <th className="px-3 py-2 text-left text-[var(--color-text-muted)]">Status</th>
                      {template.fields.map(f => (
                        <th key={f.name} className="px-3 py-2 text-left text-[var(--color-text-muted)]">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map(row => (
                      <tr key={row._row} className={`border-b border-[var(--color-border-line)]/50 ${row._valid ? '' : 'bg-red-500/5'}`}>
                        <td className="px-3 py-1.5 text-[var(--color-text-muted)]">{row._row}</td>
                        <td className="px-3 py-1.5">
                          {row._valid
                            ? <CheckCircle2 size={14} className="text-green-400"/>
                            : <span title={row._errors.join(' | ')}><AlertTriangle size={14} className="text-red-400"/></span>
                          }
                        </td>
                        {template.fields.map(f => (
                          <td key={f.name} className="px-3 py-1.5 text-[var(--color-text-main)] max-w-[120px] truncate">
                            {String(row[f.name] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
                  Kembali
                </button>
                <button onClick={runImport} disabled={importing}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-black disabled:opacity-60 cursor-pointer"
                  style={{ background: accent }}>
                  {importing && <RefreshCw size={14} className="animate-spin"/>}
                  {importing ? 'Mengimpor...' : `Import ${rawRows.length} Data`}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: DONE ───────────────────────────────────────── */}
          {step === 'done' && result && (
            <div className="space-y-4 text-center py-6">
              <CheckCircle2 size={40} className="mx-auto text-green-400"/>
              <h4 className="text-base font-semibold text-[var(--color-text-main)]">Import Selesai!</h4>

              <div className="grid grid-cols-3 gap-3 text-left">
                {[
                  { label: 'Total Baris',  value: result.total,    color: 'text-[var(--color-text-main)]' },
                  { label: 'Berhasil',     value: result.imported, color: 'text-green-400'                },
                  { label: 'Dilewati',     value: result.skipped,  color: result.skipped > 0 ? 'text-red-400' : 'text-[var(--color-text-muted)]' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="border border-[var(--color-border-line)] rounded-xl p-4 bg-white/[0.06]">
                    <p className="text-xs uppercase text-[var(--color-text-muted)]">{label}</p>
                    <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {result.errors.length > 0 && (
                <div className="text-left space-y-1 max-h-32 overflow-y-auto rounded-xl border border-red-500/20 p-3 bg-red-500/5">
                  <p className="text-xs uppercase text-red-400 mb-2">Error per baris:</p>
                  {result.errors.map(e => (
                    <p key={e.row} className="text-xs text-[var(--color-text-muted)]">
                      Baris {e.row}: {e.message}
                    </p>
                  ))}
                </div>
              )}

              <button onClick={onClose}
                className="px-6 py-2.5 rounded-lg text-xs font-bold text-black cursor-pointer"
                style={{ background: accent }}>
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
