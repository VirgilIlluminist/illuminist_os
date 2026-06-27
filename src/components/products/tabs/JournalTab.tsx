import React, { useState } from 'react';
import type { ProductJournalEntry } from '../../../types/product-blackbox.types';
import { Plus, BookOpen, X, Check } from 'lucide-react';

interface Props {
  entries:     ProductJournalEntry[];
  accent:      string;
  onNewEntry:  (data: { title: string; content: string; tags: string[] }) => Promise<void>;
  onEditEntry: (id: string, data: { content?: string; tags?: string[] }) => Promise<void>;
}

const SUGGESTED_TAGS = ['feedback', 'production', 'pricing', 'idea', 'issue', 'milestone', 'supplier', 'design'];

export default function JournalTab({ entries, accent, onNewEntry, onEditEntry }: Props) {
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [editing,   setEditing]   = useState<string | null>(null);
  const [editText,  setEditText]  = useState('');

  const [form, setForm] = useState({ title: '', content: '', tagInput: '', tags: [] as string[] });

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t], tagInput: '' }));
  };
  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await onNewEntry({ title: form.title.trim(), content: form.content.trim(), tags: form.tags });
      setShowForm(false);
      setForm({ title: '', content: '', tagInput: '', tags: [] });
    } finally { setSaving(false); }
  };

  const handleEditSave = async (id: string) => {
    setSaving(true);
    try {
      await onEditEntry(id, { content: editText });
      setEditing(null);
    } finally { setSaving(false); }
  };

  const TEXTAREA = 'w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-text-main)] focus:outline-none resize-none';
  const INPUT    = 'w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-text-main)] focus:outline-none';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">{entries.length} Catatan</p>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black cursor-pointer"
          style={{ background: accent }}>
          <Plus size={14}/> Catatan Baru
        </button>
      </div>

      {/* New entry form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4 space-y-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Judul</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Judul catatan..." className={INPUT} required/>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Konten</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Tulis catatan di sini..." rows={5} className={TEXTAREA} required/>
          </div>
          {/* Tags */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/10 text-[var(--color-text-main)]">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="cursor-pointer"><X size={12}/></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={form.tagInput} placeholder="Tambah tag..."
                onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(form.tagInput); } }}
                className={`${INPUT} flex-1`}/>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {SUGGESTED_TAGS.map(t => (
                <button key={t} type="button" onClick={() => addTag(t)}
                  className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 cursor-pointer">
                  +{t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] cursor-pointer">Batal</button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-black disabled:opacity-50 cursor-pointer"
              style={{ background: accent }}>
              {saving ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      )}

      {/* Journal entries */}
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={24} className="mx-auto text-[var(--color-text-muted)] mb-3"/>
          <p className="text-xs font-mono text-[var(--color-text-muted)]">Belum ada catatan. Mulai dokumentasikan perjalanan produk ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-mono font-semibold text-[var(--color-text-main)]">{entry.title}</h4>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{entry.createdAt.slice(0, 10)}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditing(entry.id); setEditText(entry.content); }}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer px-2 py-0.5 rounded-lg bg-white/5">
                    Edit
                  </button>
                  <button onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer px-2 py-0.5 rounded-lg bg-white/5">
                    {expanded === entry.id ? 'Tutup' : 'Baca'}
                  </button>
                </div>
              </div>

              {editing === entry.id ? (
                <div className="mt-3 space-y-2">
                  <textarea value={editText} onChange={e => setEditText(e.target.value)}
                    rows={5} className={TEXTAREA}/>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditing(null)} className="px-2 py-1 text-xs text-[var(--color-text-muted)] cursor-pointer">Batal</button>
                    <button onClick={() => handleEditSave(entry.id)} disabled={saving}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-black cursor-pointer disabled:opacity-50"
                      style={{ background: accent }}>
                      <Check size={14}/> Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`text-xs font-mono text-[var(--color-text-muted)] mt-2 whitespace-pre-wrap ${expanded === entry.id ? '' : 'line-clamp-3'}`}>
                  {entry.content}
                </p>
              )}

              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.tags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-text-muted)]">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
