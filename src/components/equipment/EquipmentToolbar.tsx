'use client';

import React from 'react';
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  Layers,
  Zap,
  LayoutGrid,
  Plus,
} from 'lucide-react';
import { EquipmentFilterState } from '@/types/equipment';

interface EquipmentToolbarProps {
  filter: EquipmentFilterState;
  onFilterChange: (newFilter: EquipmentFilterState) => void;
  counts: {
    all: number;
    robots: number;
    conveyors: number;
    charging: number;
  };
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function EquipmentToolbar({
  filter,
  onFilterChange,
  counts,
  onRefresh,
  isRefreshing,
}: EquipmentToolbarProps) {
  const tabs = [
    { key: 'all' as const, label: 'All Equipment', count: counts.all, icon: LayoutGrid },
    { key: 'robots' as const, label: 'AMR Fleet', count: counts.robots, icon: Bot },
    { key: 'conveyors' as const, label: 'Conveyors & Lifts', count: counts.conveyors, icon: Layers },
    { key: 'charging' as const, label: 'Charging Hubs', count: counts.charging, icon: Zap },
  ];

  const zones = [
    'All Zones',
    'Inbound Receiving',
    'Assembly Line Zone 2',
    'Finished Goods Zone',
    'Mezzanine South',
    'Mezzanine North',
    'Charging & Service Zone',
    'Warehouse Rear Corridor',
  ];

  const statuses = [
    'All Statuses',
    'Online / Ready',
    'Working / Operating',
    'Charging',
    'Fault / Error',
    'Maintenance',
  ];

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Top Controls Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '420px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Search by ID, name, serial number, IP, or zone..."
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              fontSize: '12.5px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8fafc',
              outline: 'none',
              color: '#0f172a',
            }}
          />
        </div>

        {/* Filters & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            value={filter.status}
            onChange={(e) => onFilterChange({ ...filter, status: e.target.value })}
            style={{
              padding: '7px 12px',
              fontSize: '12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Zone Filter */}
          <select
            value={filter.zone}
            onChange={(e) => onFilterChange({ ...filter, zone: e.target.value })}
            style={{
              padding: '7px 12px',
              fontSize: '12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          {/* Sync Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            title="Sync live telemetry from RCS & PLC gateways"
            style={{
              padding: '7px 10px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Bottom Category Tabs Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '10px',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const isActive = filter.tab === tab.key;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onFilterChange({ ...filter, tab: tab.key })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#00529C' : '#64748b',
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <TabIcon size={14} style={{ color: isActive ? '#00529C' : '#94a3b8' }} />
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#00529C' : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#475569',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
