'use client';

import React from 'react';
import {
  KpiTimeRange,
  KpiShift,
  KpiZone,
  KpiFilterState,
} from '@/types/kpi';
import {
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  SlidersHorizontal,
  Clock,
  Layers,
} from 'lucide-react';

interface KpiHeaderToolbarProps {
  filters: KpiFilterState;
  onFilterChange: (filters: KpiFilterState) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenExportModal: () => void;
}

export function KpiHeaderToolbar({
  filters,
  onFilterChange,
  onRefresh,
  isRefreshing,
  onOpenExportModal,
}: KpiHeaderToolbarProps) {
  const timeRanges: { label: string; value: KpiTimeRange }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Last 30 Days', value: 'last30days' },
    { label: 'This Month', value: 'thisMonth' },
  ];

  const shifts: { label: string; value: KpiShift }[] = [
    { label: 'All Shifts (24h)', value: 'all' },
    { label: 'Shift 1 (07:00 - 15:00)', value: 'shift1' },
    { label: 'Shift 2 (15:00 - 23:00)', value: 'shift2' },
    { label: 'Shift 3 (23:00 - 07:00)', value: 'shift3' },
  ];

  const zones: { label: string; value: KpiZone }[] = [
    { label: 'All Warehouse Zones', value: 'all' },
    { label: 'Zone A · Raw Material Inbound', value: 'zone-a' },
    { label: 'Zone B · WIP Assembly Buffer', value: 'zone-b' },
    { label: 'Zone C · Finished Goods Staging', value: 'zone-c' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
      {/* Top Header Row */}
      <div className="page-header-row" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">KPI &amp; Performance Reports</h1>
          <p className="page-subtitle">
            Comprehensive throughput analytics, robot productivity, cycle time SLAs, and Pareto alarm metrics.
          </p>
        </div>

        <div className="page-actions">
          {/* Facility / Warehouse Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={filters.warehouse}
              onChange={(e) => onFilterChange({ ...filters, warehouse: e.target.value })}
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

          {/* Quick Refresh Button */}
          <button
            onClick={onRefresh}
            className="btn-secondary"
            title="Refresh analytics data"
            disabled={isRefreshing}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Export Report Action */}
          <button onClick={onOpenExportModal} className="btn-primary">
            <Download size={14} />
            Export report
          </button>
        </div>
      </div>

      {/* Filter Ribbon Bar */}
      <div
        className="panel"
        style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Left: Time Range Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '6px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <Calendar size={13} />
            <span>Period:</span>
          </div>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '6px', gap: '2px' }}>
            {timeRanges.map((tr) => {
              const active = filters.timeRange === tr.value;
              return (
                <button
                  key={tr.value}
                  onClick={() => onFilterChange({ ...filters, timeRange: tr.value })}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    fontWeight: active ? 600 : 500,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: active ? '#ffffff' : 'transparent',
                    color: active ? '#0f172a' : '#64748b',
                    boxShadow: active ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tr.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Shift & Zone Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Shift Selector */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Clock size={13} style={{ position: 'absolute', left: '10px', color: '#64748b', pointerEvents: 'none' }} />
            <select
              value={filters.shift}
              onChange={(e) => onFilterChange({ ...filters, shift: e.target.value as KpiShift })}
              className="select-input"
              style={{
                appearance: 'none',
                paddingLeft: '28px',
                paddingRight: '26px',
                fontSize: '12px',
                height: '32px',
                backgroundColor: '#f8fafc',
              }}
            >
              {shifts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '9px', color: '#64748b', pointerEvents: 'none' }} />
          </div>

          {/* Zone Selector */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Layers size={13} style={{ position: 'absolute', left: '10px', color: '#64748b', pointerEvents: 'none' }} />
            <select
              value={filters.zone}
              onChange={(e) => onFilterChange({ ...filters, zone: e.target.value as KpiZone })}
              className="select-input"
              style={{
                appearance: 'none',
                paddingLeft: '28px',
                paddingRight: '26px',
                fontSize: '12px',
                height: '32px',
                backgroundColor: '#f8fafc',
              }}
            >
              {zones.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '9px', color: '#64748b', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
