'use client';

import React from 'react';
import {
  Cable,
  Plus,
  RefreshCw,
  Activity,
  Bot,
  ChevronDown,
} from 'lucide-react';

interface IntegrationHeaderToolbarProps {
  selectedWarehouse: string;
  onSelectWarehouse: (wh: string) => void;
  onTestAllConnections: () => void;
  isTesting: boolean;
  onOpenSyncModal: () => void;
  onOpenAddModal: () => void;
}

export function IntegrationHeaderToolbar({
  selectedWarehouse,
  onSelectWarehouse,
  onTestAllConnections,
  isTesting,
  onOpenSyncModal,
  onOpenAddModal,
}: IntegrationHeaderToolbarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
      <div className="page-header-row" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Integrations &amp; Adapter Hub</h1>
          <p className="page-subtitle">
            Vendor-neutral adapter management, Cloud API credentials, OPC UA PLC telemetry, and message exchange queues.
          </p>
        </div>

        <div className="page-actions">
          {/* Warehouse Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedWarehouse}
              onChange={(e) => onSelectWarehouse(e.target.value)}
              className="select-input"
              style={{
                appearance: 'none',
                paddingRight: '28px',
                fontWeight: 600,
                backgroundColor: '#ffffff',
                minWidth: '220px',
              }}
            >
              <option value="Main Warehouse · Bekasi">Main Warehouse · Bekasi</option>
              <option value="Karawang Plant · Staging">Karawang Plant · Staging</option>
              <option value="Sunter Logistics Hub">Sunter Logistics Hub</option>
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#64748b',
              }}
            />
          </div>

          {/* Sync Fleet & Maps Action */}
          <button
            onClick={onOpenSyncModal}
            className="btn-secondary"
            title="Sync AMR fleet and maps from vendor Cloud API"
          >
            <Bot size={14} />
            <span>Sync PUDU Fleet</span>
          </button>

          {/* Test All Connections Action */}
          <button
            onClick={onTestAllConnections}
            className="btn-secondary"
            title="Ping test all adapters"
            disabled={isTesting}
          >
            <Activity size={14} className={isTesting ? 'animate-pulse' : ''} />
            <span>{isTesting ? 'Testing...' : 'Test Connections'}</span>
          </button>

          {/* Add Adapter Action */}
          <button onClick={onOpenAddModal} className="btn-primary">
            <Plus size={14} />
            Register adapter
          </button>
        </div>
      </div>
    </div>
  );
}
