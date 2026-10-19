'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { IsometricWarehouseMap } from '@/components/warehouse-map/IsometricWarehouseMap';
import { ChevronDown, RefreshCw, Layers, ShieldCheck, Activity } from 'lucide-react';

export default function WarehouseMapPage() {
  const [selectedFacility, setSelectedFacility] = useState('Main Warehouse · Bekasi (Ground Floor)');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <AppShell>
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Warehouse Map &amp; Fleet Monitor</h1>
          <p className="page-subtitle">
            Real-time 2.5D Isometric Digital Twin tracking automated guided vehicles (AGV/AMR), routes, and bay occupancy.
          </p>
        </div>

        <div className="page-actions">
          {/* Facility Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="select-input"
              style={{
                appearance: 'none',
                paddingRight: '28px',
                fontWeight: 500,
                backgroundColor: '#ffffff',
              }}
            >
              <option value="Main Warehouse · Bekasi (Ground Floor)">Main Warehouse · Bekasi (Ground Floor)</option>
              <option value="Main Warehouse · Bekasi (Mezzanine Floor)">Main Warehouse · Bekasi (Mezzanine Floor)</option>
              <option value="Karawang Plant · Staging Area">Karawang Plant · Staging Area</option>
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#64748b',
              }}
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 0.6s linear' : 'none' }} />
            Sync Telemetry
          </button>
        </div>
      </div>

      {/* Main Map Viewport Card */}
      <div
        style={{
          width: '100%',
          height: 'calc(100vh - 215px)',
          minHeight: '620px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <IsometricWarehouseMap />
      </div>
    </AppShell>
  );
}
