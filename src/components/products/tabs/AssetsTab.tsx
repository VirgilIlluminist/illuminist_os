import React, { useRef, useState } from 'react';
import type { ProductAsset, AssetType } from '../../../types/product-blackbox.types';
import { Upload, Trash2, X, Image } from 'lucide-react';

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: 'cover',     label: 'Cover'     },
  { value: 'photo',     label: 'Photo'     },
  { value: 'campaign',  label: 'Campaign'  },
  { value: 'packaging', label: 'Packaging' },
];

interface Props {
  assets:    ProductAsset[];
  uploading: boolean;
  accent:    string;
  onUpload:  (file: File, type: AssetType) => Promise<void>;
  onDelete:  (assetId: string) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
}

export default function AssetsTab({ assets, uploading, accent, onUpload, onDelete, onReorder }: Props) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [assetType, setAssetType]   = useState<AssetType>('photo');
  const [preview,   setPreview]     = useState<string | null>(null);
  const [deleting,  setDeleting]    = useState<string | null>(null);
  const [dragging,  setDragging]    = useState(false);
  const [dragOver,  setDragOver]    = useState<string | null>(null);
  const [dragSrc,   setDragSrc]     = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) { alert(`${file.name} melebihi 5MB`); continue; }
      await onUpload(file, assetType);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    await handleFiles(e.dataTransfer.files);
  };

  const handleDeleteConfirm = async (id: string) => {
    if (!confirm('Hapus gambar ini?')) return;
    setDeleting(id);
    await onDelete(id).finally(() => setDeleting(null));
  };

  // Drag-to-reorder
  const handleDragStart = (id: string) => setDragSrc(id);
  const handleDragEnter = (id: string) => setDragOver(id);
  const handleDragEnd   = async () => {
    if (dragSrc && dragOver && dragSrc !== dragOver) {
      const ids  = assets.map(a => a.id);
      const from = ids.indexOf(dragSrc);
      const to   = ids.indexOf(dragOver);
      const next = [...ids];
      next.splice(from, 1);
      next.splice(to, 0, dragSrc);
      await onReorder(next);
    }
    setDragSrc(null); setDragOver(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={assetType} onChange={e => setAssetType(e.target.value as AssetType)}
          className="bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--color-text-main)] focus:outline-none cursor-pointer">
          {ASSET_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold text-black disabled:opacity-50 cursor-pointer"
          style={{ background: accent }}
        >
          <Upload size={12}/>{uploading ? 'Mengunggah...' : 'Upload Gambar'}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)}/>
      </div>

      {/* Drop zone when no assets */}
      {assets.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-16 cursor-pointer transition-all ${
            dragging ? 'border-white/40 bg-white/5' : 'border-[var(--color-border-line)] hover:border-white/20'
          }`}
        >
          <Image size={24} className="text-[var(--color-text-muted)]"/>
          <p className="text-xs font-mono text-[var(--color-text-muted)]">Drag & drop gambar atau klik Upload</p>
          <p className="text-[8px] font-mono text-[var(--color-text-muted)]/60">JPG / PNG / WEBP · Maks 5MB per file</p>
        </div>
      )}

      {/* Grid */}
      {assets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {assets.map(asset => (
            <div
              key={asset.id}
              draggable
              onDragStart={() => handleDragStart(asset.id)}
              onDragEnter={() => handleDragEnter(asset.id)}
              onDragEnd={handleDragEnd}
              className={`group relative rounded-xl overflow-hidden border cursor-move transition-all ${
                dragOver === asset.id ? 'border-white/40 scale-95' : 'border-[var(--color-border-line)]'
              }`}
            >
              <div className="aspect-square bg-black/20">
                <img src={asset.url} alt={asset.label ?? asset.assetType}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreview(asset.url)}/>
              </div>
              <div className="absolute top-2 left-2">
                <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white uppercase tracking-wider">
                  {asset.assetType}
                </span>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDeleteConfirm(asset.id)}
                  disabled={deleting === asset.id}
                  className="p-1 rounded bg-red-500/80 text-white hover:bg-red-500 cursor-pointer"
                >
                  <Trash2 size={10}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {preview && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 p-2 text-white hover:text-white/70 cursor-pointer" onClick={() => setPreview(null)}>
            <X size={20}/>
          </button>
          <img src={preview} alt="preview" className="max-w-4xl max-h-[90vh] object-contain rounded-xl" onClick={e => e.stopPropagation()}/>
        </div>
      )}
    </div>
  );
}
