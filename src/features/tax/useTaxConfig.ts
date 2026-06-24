import { useState, useEffect, useCallback } from 'react';
import { TaxService } from './TaxService';
import type { TaxConfig } from './types';

export function useTaxConfig(companyId: string | undefined) {
  const [config,  setConfig]  = useState<TaxConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const c = await TaxService.loadConfig(companyId);
      setConfig(c as unknown as TaxConfig);
    } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (data: Partial<TaxConfig>) => {
    if (!companyId) return;
    setSaving(true);
    try {
      const updated = await TaxService.saveConfig(companyId, data);
      if (updated) setConfig(updated);
      return updated;
    } finally { setSaving(false); }
  }, [companyId]);

  return { config, loading, saving, save, reload: load };
}
