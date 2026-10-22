'use client';

import React from 'react';
import { PermissionMatrixRow, RoleDefinition, RoleName } from '@/types/user';
import { mockRbacMatrix, mockRoleDefinitions } from '@/data/mockUsers';
import { ShieldCheck, Info } from 'lucide-react';

export function RbacMatrixTable() {
  const roles: { key: RoleName; label: string; isProposed?: boolean }[] = [
    { key: 'WCS_ADMINISTRATOR', label: 'Admin' },
    { key: 'WAREHOUSE_SUPERVISOR', label: 'Supervisor' },
    { key: 'WAREHOUSE_OPERATOR', label: 'WH Operator' },
    { key: 'MAINTENANCE_ENGINEER', label: 'Maintenance' },
    { key: 'SYSTEM_INTEGRATOR', label: 'Integrator' },
    { key: 'OPERATOR_PRODUKSI', label: 'Produksi', isProposed: true },
    { key: 'OPERATOR_PACKAGING', label: 'Packaging', isProposed: true },
    { key: 'OPERATOR_DELIVERY', label: 'Delivery', isProposed: true },
  ];

  const renderBadge = (level: 'FULL' | 'READ_WRITE' | 'READ_ONLY' | 'NONE') => {
    switch (level) {
      case 'FULL':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0',
            }}
          >
            FULL
          </span>
        );
      case 'READ_WRITE':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd',
            }}
          >
            R/W
          </span>
        );
      case 'READ_ONLY':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
            }}
          >
            READ
          </span>
        );
      case 'NONE':
        return <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>;
    }
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <ShieldCheck size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
              Role-Based Access Control (RBAC) Permissions Matrix
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Granular functional access policy defined in <code>docs/RBAC.md</code> across 5 standard and 3 proposed roles
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10.5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#15803d' }} />
            <span>FULL (CRUD)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#0369a1' }} />
            <span>R/W (Read/Write)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#64748b' }} />
            <span>READ (View Only)</span>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="panel-body" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', fontSize: '11.5px' }}>
          <thead>
            <tr>
              <th style={{ width: '180px' }}>Module Name</th>
              <th>Guarded Feature</th>
              {roles.map((r) => (
                <th key={r.key} style={{ textAlign: 'center', width: '90px' }}>
                  <div>{r.label}</div>
                  {r.isProposed && (
                    <div style={{ fontSize: '9px', fontWeight: 500, color: '#d97706' }}>
                      (Proposed)
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockRbacMatrix.map((row) => (
              <tr key={row.moduleName}>
                <td>
                  <strong style={{ color: '#0f172a' }}>{row.moduleName}</strong>
                </td>
                <td style={{ color: '#475569' }}>
                  {row.feature}
                </td>
                {roles.map((r) => (
                  <td key={r.key} style={{ textAlign: 'center' }}>
                    {renderBadge(row.roles[r.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notice info */}
      <div
        style={{
          padding: '10px 18px',
          borderTop: '1px solid #f1f5f9',
          backgroundColor: '#fafbfc',
          fontSize: '11px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Info size={13} color="#0284c7" />
        <span>
          Columns marked <strong>(Proposed)</strong> reflect the 3 extended end-to-end production roles (FR-14–16) awaiting Astra/Winteq sign-off per PRD Section 15.
        </span>
      </div>
    </div>
  );
}
