export type ImportEntity = 'products' | 'materials' | 'customers' | 'suppliers' | 'inventory';

export interface ColumnMapping {
  csvHeader:   string;
  targetField: string;
}

export interface ImportPreviewRow {
  _row:   number;
  _valid: boolean;
  _errors: string[];
  [key: string]: unknown;
}

export interface ImportResult {
  entity:       ImportEntity;
  total:        number;
  imported:     number;
  skipped:      number;
  errors:       { row: number; message: string }[];
}

export interface TemplateField {
  name:     string;
  label:    string;
  required: boolean;
  example:  string;
}

export const ENTITY_TEMPLATES: Record<ImportEntity, { label: string; fields: TemplateField[] }> = {
  products: {
    label: 'Produk',
    fields: [
      { name: 'sku',        label: 'SKU',             required: true,  example: 'PRD-001'      },
      { name: 'name',       label: 'Nama Produk',     required: true,  example: 'Kemeja Polos' },
      { name: 'category',   label: 'Kategori',        required: false, example: 'Atasan'       },
      { name: 'price',      label: 'Harga Jual',      required: true,  example: '150000'       },
      { name: 'hpp',        label: 'HPP',             required: false, example: '85000'        },
      { name: 'weight',     label: 'Berat (gram)',     required: false, example: '250'          },
      { name: 'description',label: 'Deskripsi',       required: false, example: 'Kemeja katun' },
    ],
  },
  materials: {
    label: 'Bahan Baku',
    fields: [
      { name: 'name',           label: 'Nama Bahan',      required: true,  example: 'Kain Katun'    },
      { name: 'unit',           label: 'Satuan',          required: true,  example: 'meter'          },
      { name: 'price_per_unit', label: 'Harga/Satuan',    required: true,  example: '25000'          },
      { name: 'stock',          label: 'Stok Awal',       required: false, example: '100'            },
      { name: 'min_stock',      label: 'Stok Minimum',    required: false, example: '10'             },
      { name: 'supplier',       label: 'Supplier',        required: false, example: 'Toko Kain Jaya' },
    ],
  },
  customers: {
    label: 'Pelanggan',
    fields: [
      { name: 'name',    label: 'Nama',          required: true,  example: 'Budi Santoso'     },
      { name: 'phone',   label: 'Telepon',        required: false, example: '0812345678'       },
      { name: 'email',   label: 'Email',          required: false, example: 'budi@email.com'   },
      { name: 'address', label: 'Alamat',         required: false, example: 'Jl. Merdeka No 1' },
      { name: 'city',    label: 'Kota',           required: false, example: 'Jakarta'          },
      { name: 'notes',   label: 'Catatan',        required: false, example: 'Pelanggan VIP'    },
    ],
  },
  suppliers: {
    label: 'Supplier',
    fields: [
      { name: 'name',    label: 'Nama Supplier',  required: true,  example: 'PT Kain Nusantara' },
      { name: 'contact', label: 'Kontak',         required: false, example: 'Pak Andi'          },
      { name: 'phone',   label: 'Telepon',        required: false, example: '02112345678'        },
      { name: 'email',   label: 'Email',          required: false, example: 'info@kain.co.id'   },
      { name: 'address', label: 'Alamat',         required: false, example: 'Bandung, Jawa Barat'},
      { name: 'category',label: 'Kategori',       required: false, example: 'Kain'              },
    ],
  },
  inventory: {
    label: 'Stok Produk',
    fields: [
      { name: 'sku',      label: 'SKU Produk',    required: true,  example: 'PRD-001'   },
      { name: 'size',     label: 'Ukuran',        required: false, example: 'M'         },
      { name: 'color',    label: 'Warna',         required: false, example: 'Merah'     },
      { name: 'quantity', label: 'Jumlah',        required: true,  example: '50'        },
      { name: 'location', label: 'Lokasi Gudang', required: false, example: 'Rak A1'   },
    ],
  },
};
