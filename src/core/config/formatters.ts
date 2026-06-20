/**
 * useFormatters.ts — ARCH-01 Extract
 * Formatter functions dipisah dari ERPContext agar bisa dipakai standalone.
 * ERPContext tetap menggunakan versi internalnya, hook ini untuk komponen
 * yang perlu formatter tanpa full ERPContext.
 */
import { ERPConfig } from '../../types';

export function createFormatters(config: ERPConfig | null) {
  const symbol         = config?.currencySymbol || 'Rp';
  const activeCurrency = config?.activeCurrency  || 'IDR';
  const rate           = config?.currencyRate     || 15400;
  const decPrec        = config?.decimalPrecision ?? (activeCurrency === 'USD' ? 2 : 0);

  const convertCurrency = (val: number, from: 'IDR' | 'USD', to: 'IDR' | 'USD'): number => {
    if (from === to) return val;
    return from === 'IDR' ? val / rate : val * rate;
  };

  const formatNumber = (val: unknown, customDecimals?: number): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0';
    const n   = Number(val);
    const prec = customDecimals ?? decPrec;
    return n.toLocaleString('id-ID', { minimumFractionDigits: prec, maximumFractionDigits: prec });
  };

  const formatPercent = (val: unknown, customDecimals?: number): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0%';
    const n    = Number(val);
    const prec = customDecimals ?? 2;
    return n.toLocaleString('id-ID', { minimumFractionDigits: prec, maximumFractionDigits: prec }) + '%';
  };

  const formatMoney = (val: unknown, customDecimals?: number): string => {
    if (val === null || val === undefined || String(val).trim() === '') return `${symbol} 0`;
    let n = 0;
    if (typeof val === 'number') {
      n = val;
    } else {
      let cleaned = String(val).trim().replace(/[Rp$€£\s]/g, '');
      if (activeCurrency === 'IDR') {
        if (cleaned.includes(',') && cleaned.includes('.')) {
          cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
        } else if (cleaned.includes(',')) {
          cleaned = cleaned.replace(/,/g, '.');
        } else if (cleaned.includes('.') && (cleaned.match(/^\d+(\.\d{3})+$/) || cleaned.split('.').length > 2)) {
          cleaned = cleaned.replace(/\./g, '');
        }
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
      const parsed = parseFloat(cleaned);
      n = isNaN(parsed) ? 0 : parsed;
    }
    if (activeCurrency === 'USD') n = convertCurrency(n, 'IDR', 'USD');
    const prec = customDecimals ?? decPrec;
    return symbol + ' ' + n.toLocaleString(activeCurrency === 'USD' ? 'en-US' : 'id-ID', {
      minimumFractionDigits: prec,
      maximumFractionDigits: prec,
    });
  };

  return { formatMoney, formatNumber, formatPercent, convertCurrency };
}
