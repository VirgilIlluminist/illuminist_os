import Papa from 'papaparse';
import { getRepo } from '../../core/repositories';
import type { ImportEntity, ImportPreviewRow, ImportResult, ColumnMapping } from './types';
import { ENTITY_TEMPLATES } from './types';

// ─── Validators per entity ─────────────────────────────────────────────────────

function validateRow(entity: ImportEntity, row: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (entity === 'products') {
    if (!row['sku'])   errors.push('SKU wajib diisi');
    if (!row['name'])  errors.push('Nama produk wajib diisi');
    if (!row['price'] || isNaN(Number(row['price']))) errors.push('Harga harus angka');
  } else if (entity === 'materials') {
    if (!row['name'])           errors.push('Nama bahan wajib diisi');
    if (!row['unit'])           errors.push('Satuan wajib diisi');
    if (!row['price_per_unit'] || isNaN(Number(row['price_per_unit']))) errors.push('Harga/satuan harus angka');
  } else if (entity === 'customers') {
    if (!row['name']) errors.push('Nama pelanggan wajib diisi');
  } else if (entity === 'suppliers') {
    if (!row['name']) errors.push('Nama supplier wajib diisi');
  } else if (entity === 'inventory') {
    if (!row['sku'])      errors.push('SKU wajib diisi');
    if (!row['quantity'] || isNaN(Number(row['quantity']))) errors.push('Jumlah harus angka');
  }
  return errors;
}

// ─── Transform CSV row to entity record ───────────────────────────────────────

function transformRow(entity: ImportEntity, row: Record<string, unknown>): Record<string, unknown> {
  if (entity === 'products') {
    return {
      sku:         String(row['sku'] ?? '').trim(),
      name:        String(row['name'] ?? '').trim(),
      category:    String(row['category'] ?? '').trim(),
      price:       Number(row['price'] ?? 0),
      hpp:         Number(row['hpp']   ?? 0),
      weight:      Number(row['weight'] ?? 0),
      description: String(row['description'] ?? '').trim(),
    };
  }
  if (entity === 'materials') {
    return {
      name:           String(row['name'] ?? '').trim(),
      unit:           String(row['unit'] ?? '').trim(),
      price_per_unit: Number(row['price_per_unit'] ?? 0),
      stock:          Number(row['stock'] ?? 0),
      min_stock:      Number(row['min_stock'] ?? 0),
      supplier:       String(row['supplier'] ?? '').trim(),
    };
  }
  if (entity === 'customers') {
    return {
      name:    String(row['name']    ?? '').trim(),
      phone:   String(row['phone']   ?? '').trim(),
      email:   String(row['email']   ?? '').trim(),
      address: String(row['address'] ?? '').trim(),
      city:    String(row['city']    ?? '').trim(),
      notes:   String(row['notes']   ?? '').trim(),
    };
  }
  if (entity === 'suppliers') {
    return {
      name:     String(row['name']     ?? '').trim(),
      contact:  String(row['contact']  ?? '').trim(),
      phone:    String(row['phone']    ?? '').trim(),
      email:    String(row['email']    ?? '').trim(),
      address:  String(row['address']  ?? '').trim(),
      category: String(row['category'] ?? '').trim(),
    };
  }
  // inventory
  return {
    sku:      String(row['sku']      ?? '').trim(),
    size:     String(row['size']     ?? '').trim(),
    color:    String(row['color']    ?? '').trim(),
    quantity: Number(row['quantity'] ?? 0),
    location: String(row['location'] ?? '').trim(),
  };
}

// ─── Map CSV headers to target fields using column mapping ────────────────────

function applyMapping(
  raw: Record<string, string>,
  mapping: ColumnMapping[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { csvHeader, targetField } of mapping) {
    if (csvHeader && targetField) result[targetField] = raw[csvHeader];
  }
  return result;
}

// ─── Repo table names ─────────────────────────────────────────────────────────

const ENTITY_TABLE: Record<ImportEntity, string> = {
  products:  'products',
  materials: 'raw_materials',
  customers: 'customers',
  suppliers: 'suppliers',
  inventory: 'size_variants',
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const CSVImportService = {
  parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header:          true,
        skipEmptyLines:  true,
        transformHeader: (h: string) => h.trim(),
        complete: result => {
          const headers = result.meta.fields ?? [];
          resolve({ headers, rows: result.data });
        },
        error: (err: { message: string }) => reject(new Error(err.message)),
      });
    });
  },

  buildAutoMapping(headers: string[], entity: ImportEntity): ColumnMapping[] {
    // ENTITY_TEMPLATES imported at top
    const fields = ENTITY_TEMPLATES[entity].fields;
    return fields.map(f => {
      // exact match first, then case-insensitive, then partial
      const exact   = headers.find(h => h === f.name);
      const lower   = headers.find(h => h.toLowerCase() === f.label.toLowerCase());
      const partial = headers.find(h => h.toLowerCase().includes(f.name.toLowerCase()));
      return { csvHeader: exact ?? lower ?? partial ?? '', targetField: f.name };
    });
  },

  preview(
    rows:    Record<string, string>[],
    mapping: ColumnMapping[],
    entity:  ImportEntity,
  ): ImportPreviewRow[] {
    return rows.slice(0, 10).map((raw, i) => {
      const mapped = applyMapping(raw, mapping);
      const errors = validateRow(entity, mapped);
      return { _row: i + 1, _valid: errors.length === 0, _errors: errors, ...mapped };
    });
  },

  async importAll(
    companyId: string,
    rows:      Record<string, string>[],
    mapping:   ColumnMapping[],
    entity:    ImportEntity,
  ): Promise<ImportResult> {
    const repo   = getRepo(ENTITY_TABLE[entity]);
    const result: ImportResult = {
      entity, total: rows.length, imported: 0, skipped: 0, errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const raw    = rows[i];
      const mapped = applyMapping(raw, mapping);
      const errs   = validateRow(entity, mapped);

      if (errs.length > 0) {
        result.skipped++;
        result.errors.push({ row: i + 1, message: errs.join(', ') });
        continue;
      }

      try {
        const record = transformRow(entity, mapped);
        await repo.create(companyId, record);
        result.imported++;
      } catch (e) {
        result.skipped++;
        result.errors.push({ row: i + 1, message: String(e) });
      }
    }

    return result;
  },

  buildTemplateCSV(entity: ImportEntity): string {
    // ENTITY_TEMPLATES imported at top
    const { fields } = ENTITY_TEMPLATES[entity];
    const header  = fields.map(f => f.name).join(',');
    const example = fields.map(f => `"${f.example}"`).join(',');
    return `${header}\n${example}\n`;
  },

  downloadTemplate(entity: ImportEntity): void {
    // ENTITY_TEMPLATES imported at top
    const csv  = CSVImportService.buildTemplateCSV(entity);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `template_import_${entity}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
