'use client';

import React from 'react';
import { Download, FileClock, Search, ShieldCheck } from 'lucide-react';

interface AuditLogHeaderToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  resultFilter: string;
  onResultFilterChange: (res: string) => void;
  onExportCsv: () => void;
}

export function AuditLogHeaderToolbar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  resultFilter,
  onResultFilterChange,
  onExportCsv,
}: AuditLogHeaderToolbarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
      <div className="page-header-row" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Audit Trail &amp; Compliance Logs</h1>
          <p className="page-subtitle">
            Immutable security and operational trail capturing supervisor manual overrides, task cancellations, and config updates.
          </p>
        </div>

        <div className="page-actions">
          {/* Export Action */}
          <button onClick={onExportCsv} className="btn-primary">
            <Download size={14} />
            Export Audit Log
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div
        className="panel"
        style={{
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: '9px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search action, target ID, actor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
            style={{
              width: '100%',
              paddingLeft: '28px',
              fontSize: '11.5px',
              height: '30px',
            }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="select-input"
            style={{ height: '30px', fontSize: '11.5px', padding: '0 8px' }}
          >
            <option value="ALL">All Action Categories</option>
            <option value="TASK_MUTATION">Task Mutations &amp; Aborts</option>
            <option value="ALARM_ACTION">Alarm Acknowledgment &amp; Clear</option>
            <option value="EQUIPMENT_CONTROL">Equipment Status Controls</option>
            <option value="SYSTEM_CONFIG">System Parameter Changes</option>
            <option value="INTEGRATION_SYNC">Integration Key Rotations</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => onResultFilterChange(e.target.value)}
            className="select-input"
            style={{ height: '30px', fontSize: '11.5px', padding: '0 8px' }}
          >
            <option value="ALL">All Results</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Overrides</option>
          </select>
        </div>
      </div>
    </div>
  );
}
