import React, { useCallback, useMemo } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import PageHeader from '../../../shared/ui/PageHeader';
import SmartTable, { ColumnDef } from '../../../shared/table/SmartTable';
import EmptyGuide from '../../../shared/ui/EmptyGuide';

const TIER_OPTIONS = ['Platinum', 'Gold', 'Silver', 'Standard'];

const customerCols: ColumnDef[] = [
  { key: 'id',          label: 'ID',            type: 'text',   width: 100, isEditable: false },
  { key: 'name',        label: 'Nama',          type: 'text',   width: 200, isEditable: true  },
  { key: 'email',       label: 'Email',         type: 'text',   width: 220, isEditable: true  },
  { key: 'tier',        label: 'Tier',          type: 'status', width: 110, isEditable: true, selectOptions: TIER_OPTIONS },
  { key: 'ordersCount', label: 'Total Order',   type: 'number', width: 110, isEditable: false },
  { key: 'ltv',         label: 'Total Revenue', type: 'number', width: 140, isEditable: false },
];

type CRow = Record<string, unknown>;

export default function CustomersView() {
  const { computedCustomerDatabase, addCustomer, updateCustomer, deleteCustomer } = useERP();

  const rows: CRow[] = useMemo(
    () => computedCustomerDatabase.map(c => ({
      id:          c.id,
      name:        c.name,
      email:       c.email,
      tier:        c.tier,
      ordersCount: c.ordersCount,
      ltv:         c.ltv,
    })),
    [computedCustomerDatabase]
  );

  const handleChange = useCallback((updated: CRow[]) => {
    const existingMap = new Map(computedCustomerDatabase.map(c => [c.id as string, c]));
    const updatedIds  = new Set(updated.map(r => r.id as string));

    for (const id of existingMap.keys()) {
      if (!updatedIds.has(id)) deleteCustomer(id);
    }

    updated.forEach(row => {
      const id = row.id as string;
      if (!existingMap.has(id)) {
        addCustomer({
          name:  String(row.name ?? ''),
          email: String(row.email ?? ''),
          tier:  (row.tier as 'Platinum' | 'Gold' | 'Silver' | 'Standard') ?? 'Standard',
        });
      } else {
        const prev  = existingMap.get(id)!;
        const diff: Partial<typeof prev> = {};
        if (row.name  !== prev.name)  diff.name  = String(row.name ?? '');
        if (row.email !== prev.email) diff.email = String(row.email ?? '');
        if (row.tier  !== prev.tier)  diff.tier  = row.tier as typeof prev.tier;
        if (Object.keys(diff).length) updateCustomer(id, diff);
      }
    });
  }, [computedCustomerDatabase, addCustomer, updateCustomer, deleteCustomer]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <PageHeader
        title="Customers"
        description="Database pelanggan — tier, riwayat order, dan lifetime value."
      />

      {rows.length === 0 ? (
        <EmptyGuide
          icon="👥"
          title="Belum ada customer"
          description="Tambah customer pertama kamu. Total Order & Revenue dihitung otomatis dari Sales."
          tableHints
        />
      ) : (
        <SmartTable
          tableId="customers"
          title="Customer Database"
          columns={customerCols}
          data={rows}
          onDataChange={handleChange}
          allowAddRow
          allowExport
          allowImport
        />
      )}
    </div>
  );
}
