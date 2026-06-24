import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SalesRecord, ERPConfig } from '../../types';
import type { TaxBreakdown } from '../tax/types';
import { TaxService } from '../tax/TaxService';

export interface InvoiceData {
  invoiceNumber: string;
  date:          string;
  dueDate?:      string;
  sale:          SalesRecord;
  productName:   string;
  config:        ERPConfig;
  ppnRate?:      number;
  ppnMethod?:    'inclusive' | 'exclusive';
  isPaid:        boolean;
  notes?:        string;
  bankName?:     string;
  bankAccount?:  string;
  bankHolder?:   string;
}

export interface InvoiceLineItem {
  description: string;
  qty:         number;
  unitPrice:   number;
  subtotal:    number;
}

function formatRupiah(n: number, symbol: string): string {
  return `${symbol}${Math.round(n).toLocaleString('id')}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num   = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export const InvoiceService = {
  generateInvoiceNumber(): string {
    const now = new Date();
    const yy  = String(now.getFullYear()).slice(-2);
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    return `INV/${yy}${mm}/${seq}`;
  },

  buildLineItems(data: InvoiceData): { items: InvoiceLineItem[]; tax: TaxBreakdown | null } {
    const gross    = data.sale.qtySold * data.sale.pricePerPcs;
    const discount = data.sale.discount ?? 0;
    const netGross = gross - discount;

    const tax = data.ppnRate
      ? TaxService.calculatePPN(netGross, data.ppnRate, data.ppnMethod ?? 'exclusive')
      : null;

    const items: InvoiceLineItem[] = [
      {
        description: data.productName + (data.sale.variantSku ? ` (${data.sale.variantSku})` : ''),
        qty:         data.sale.qtySold,
        unitPrice:   data.sale.pricePerPcs,
        subtotal:    gross,
      },
    ];

    if (discount > 0) {
      items.push({ description: 'Diskon', qty: 1, unitPrice: -discount, subtotal: -discount });
    }

    return { items, tax };
  },

  generatePDF(data: InvoiceData): jsPDF {
    const doc         = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const accent      = data.config.customAccentColor ?? '#7c3aed';
    const [ar, ag, ab] = hexToRgb(accent);
    const currency    = data.config.currencySymbol ?? 'Rp';
    const companyName = data.config.systemName ?? 'Perusahaan';
    const W           = 210;
    const MARGIN      = 15;

    // ── Header strip ────────────────────────────────────────────────────────────
    doc.setFillColor(ar, ag, ab);
    doc.rect(0, 0, W, 30, 'F');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(companyName, MARGIN, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(data.config.systemSubName ?? '', MARGIN, 20);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', W - MARGIN, 14, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(data.invoiceNumber, W - MARGIN, 20, { align: 'right' });

    // ── Meta row ────────────────────────────────────────────────────────────────
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    let y = 38;

    const left: [string, string][] = [
      ['Kepada', data.sale.customerName],
      ['Saluran', data.sale.channel],
    ];
    const right: [string, string][] = [
      ['Tanggal', data.date],
      ['Jatuh Tempo', data.dueDate ?? '-'],
      ['Status', data.isPaid ? 'LUNAS' : 'BELUM LUNAS'],
    ];

    left.forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold'); doc.text(k + ':', MARGIN, y);
      doc.setFont('helvetica', 'normal'); doc.text(v, MARGIN + 28, y);
      y += 5;
    });

    y = 38;
    right.forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold'); doc.text(k + ':', W / 2 + 10, y);
      doc.setFont('helvetica', 'normal');
      if (k === 'Status') {
        doc.setTextColor(data.isPaid ? 34 : 220, data.isPaid ? 197 : 38, data.isPaid ? 94 : 38);
      }
      doc.text(v, W / 2 + 45, y);
      doc.setTextColor(60, 60, 60);
      y += 5;
    });

    // ── Table ───────────────────────────────────────────────────────────────────
    y = 65;
    const { items, tax } = InvoiceService.buildLineItems(data);

    autoTable(doc, {
      startY: y,
      margin:  { left: MARGIN, right: MARGIN },
      head: [['Deskripsi', 'Qty', 'Harga Satuan', 'Subtotal']],
      body: items.map(it => [
        it.description,
        String(it.qty),
        formatRupiah(it.unitPrice, currency),
        formatRupiah(it.subtotal, currency),
      ]),
      headStyles: {
        fillColor: [ar, ag, ab],
        textColor: [0, 0, 0],
        fontSize:  8,
        fontStyle: 'bold',
      },
      bodyStyles:  { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'right',  cellWidth: 35 },
        3: { halign: 'right',  cellWidth: 35 },
      },
    });

    const afterTable = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
    let ty = afterTable;

    // ── Totals block ────────────────────────────────────────────────────────────
    const gross    = data.sale.qtySold * data.sale.pricePerPcs - (data.sale.discount ?? 0);
    const totalRows: [string, string, boolean][] = [
      ['Subtotal', formatRupiah(gross, currency), false],
    ];
    if (tax) {
      totalRows.push([`PPN ${tax.ppn_rate}%`, formatRupiah(tax.ppn_amount, currency), false]);
      totalRows.push(['Platform Fee', formatRupiah(data.sale.platformFee ?? 0, currency), false]);
      totalRows.push(['Total', formatRupiah(tax.total + (data.sale.platformFee ?? 0), currency), true]);
    } else {
      totalRows.push(['Total', formatRupiah(gross + (data.sale.platformFee ?? 0), currency), true]);
    }

    totalRows.forEach(([label, value, isBold]) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(isBold ? 10 : 8);
      doc.setTextColor(isBold ? ar : 80, isBold ? ag : 80, isBold ? ab : 80);
      doc.text(label + ':', W - MARGIN - 50, ty, { align: 'right' });
      doc.text(value,       W - MARGIN,      ty, { align: 'right' });
      ty += 6;
    });

    // ── LUNAS watermark ─────────────────────────────────────────────────────────
    if (data.isPaid) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(48);
      doc.setTextColor(ar, ag, ab);
      doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
      doc.text('LUNAS', W / 2, 170, { align: 'center', angle: -35 });
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
    }

    // ── Bank info ───────────────────────────────────────────────────────────────
    if (data.bankName || data.notes) {
      ty += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      if (data.bankName) {
        doc.text('Informasi Pembayaran:', MARGIN, ty); ty += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`Bank: ${data.bankName}`, MARGIN, ty); ty += 5;
        if (data.bankAccount) { doc.text(`No. Rek: ${data.bankAccount}`, MARGIN, ty); ty += 5; }
        if (data.bankHolder)  { doc.text(`A/N: ${data.bankHolder}`,  MARGIN, ty); ty += 5; }
      }
      if (data.notes) {
        ty += 3;
        doc.setFont('helvetica', 'italic');
        doc.text(data.notes, MARGIN, ty);
      }
    }

    // ── Footer ─────────────────────────────────────────────────────────────────
    doc.setFillColor(ar, ag, ab);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text('Dokumen ini dibuat secara otomatis oleh ' + companyName, W / 2, 292, { align: 'center' });

    return doc;
  },

  previewInvoice(data: InvoiceData): void {
    const doc = InvoiceService.generatePDF(data);
    const url = doc.output('bloburl');
    window.open(url as unknown as string, '_blank');
  },

  downloadInvoice(data: InvoiceData): void {
    const doc = InvoiceService.generatePDF(data);
    doc.save(`${data.invoiceNumber.replace(/\//g, '-')}.pdf`);
  },
};
