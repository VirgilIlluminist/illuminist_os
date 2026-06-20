/**
 * business.service.ts — Frontend API calls untuk business modules
 * Pattern: frontend component → service → API → backend → repository → DB
 *
 * Manual-first: kalau backend tidak tersedia, app tetap pakai ERPContext/localStorage.
 * Ketika Supabase aktif, data sync otomatis ke database.
 */
import apiClient from './client';

// Generic CRUD factory
function createCRUD<T>(path: string) {
  return {
    list:   (params?: Record<string, unknown>) =>
              apiClient.get<T[]>(`${path}?${new URLSearchParams(params as any)}`).catch(() => []),
    getOne: (id: string) =>
              apiClient.get<T>(`${path}/${id}`),
    create: (data: Partial<T>) =>
              apiClient.post<T>(path, data),
    update: (id: string, data: Partial<T>) =>
              apiClient.put<T>(`${path}/${id}`, data),
    delete: (id: string) =>
              apiClient.delete(`${path}/${id}`),
  };
}

export const materialsAPI = {
  ...createCRUD('/api/materials'),
  getLowStock: () => apiClient.get('/api/materials/low-stock').catch(() => []),
};

export const productsAPI  = createCRUD('/api/products');
export const salesAPI     = {
  ...createCRUD('/api/sales'),
  getRevenue: () => apiClient.get<{ total: number }>('/api/sales/revenue').catch(() => ({ total: 0 })),
};
export const suppliersAPI = createCRUD('/api/suppliers');
export const customersAPI = createCRUD('/api/customers');
export const financeAPI   = {
  ...createCRUD('/api/finance'),
  getSummary: () => apiClient.get('/api/finance/summary').catch(() => ({ income: 0, expense: 0, net: 0 })),
};

// System status
export const getSystemStatus = () =>
  apiClient.get<{ db: string; version: string }>('/api/status').catch(() => ({ db: 'offline', version: 'unknown' }));
