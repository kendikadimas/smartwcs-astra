'use client';

import React from 'react';
import { AlarmFilterState } from '@/types/alarm';
import {
  Search,
  X,
  RefreshCw,
  Download,
  Volume2,
  VolumeX,
  Filter,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Radio,
  Layers,
} from 'lucide-react';

interface AlarmToolbarProps {
  filter: AlarmFilterState;
  onFilterChange: (updates: Partial<AlarmFilterState>) => void;
  counts: {
    all: number;
    active: number;
    acknowledged: number;
    cleared: number;
    events: number;
  };
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExportCsv: () => void;
}

export function AlarmToolbar({
  filter,
  onFilterChange,
  counts,
  isAudioMuted,
  onToggleAudio,
  onRefresh,
  isRefreshing,
  onExportCsv,
}: AlarmToolbarProps) {
  const tabs = [
    {
      key: 'ALL' as const,
      label: 'All Alarms',
      count: counts.all,
      icon: Layers,
    },
    {
      key: 'ACTIVE' as const,
      label: 'Active (Unack)',
      count: counts.active,
      badgeColor: counts.active > 0 ? '#ef4444' : '#64748b',
      badgeBg: counts.active > 0 ? '#fee2e2' : '#f1f5f9',
      icon: AlertOctagon,
    },
    {
      key: 'ACKNOWLEDGED' as const,
      label: 'Acknowledged',
      count: counts.acknowledged,
      badgeColor: '#2563eb',
      badgeBg: '#eff6ff',
      icon: Clock,
    },
    {
      key: 'CLEARED' as const,
      label: 'Cleared / History',
      count: counts.cleared,
      badgeColor: '#16a34a',
      badgeBg: '#f0fdf4',
      icon: CheckCircle2,
    },
    {
      key: 'EVENTS' as const,
      label: 'Telemetry Stream',
      count: counts.events,
      badgeColor: '#7c3aed',
      badgeBg: '#f5f3ff',
      icon: Radio,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Top Row: Category Tabs & Control Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {tabs.map((tab) => {
            const isActive = filter.tab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                id={`tab-${tab.key.toLowerCase()}`}
                onClick={() => onFilterChange({ tab: tab.key })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 13px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? '#00529C' : '#f8fafc',
                  color: isActive ? '#ffffff' : '#475569',
                  border: isActive ? '1px solid #00529C' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} style={{ color: isActive ? '#ffffff' : '#64748b' }} />
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : tab.badgeBg || '#e2e8f0',
                    color: isActive ? '#ffffff' : tab.badgeColor || '#475569',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Action Tools: Audio Toggle, Refresh, Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Siren Audio Toggle */}
          <button
            type="button"
            id="btn-toggle-siren-audio"
            onClick={onToggleAudio}
            title={isAudioMuted ? 'Unmute alarm sound alert' : 'Mute alarm sound alert'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: isAudioMuted ? '#f8fafc' : '#fef2f2',
              color: isAudioMuted ? '#64748b' : '#dc2626',
              border: isAudioMuted ? '1px solid #cbd5e1' : '1px solid #fecaca',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isAudioMuted ? (
              <>
                <VolumeX size={14} />
                <span>Siren Muted</span>
              </>
            ) : (
              <>
                <Volume2 size={14} style={{ color: '#dc2626' }} />
                <span>Siren Active</span>
              </>
            )}
          </button>

          {/* Refresh Telemetry */}
          <button
            type="button"
            id="btn-refresh-alarms"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw
              size={13}
              style={{
                color: '#10b981',
                animation: isRefreshing ? 'spin 0.6s linear infinite' : 'none',
              }}
            />
            <span>Refresh</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            id="btn-export-alarms-csv"
            onClick={onExportCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
            }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Search & Filters (Shown when not in pure EVENTS view, or as applicable) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          paddingTop: '6px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            id="alarm-search-input"
            value={filter.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search code, title, AMR, conveyor, task ID..."
            style={{
              width: '100%',
              padding: '7px 28px 7px 32px',
              fontSize: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              outline: 'none',
              color: '#1e293b',
            }}
          />
          {filter.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: '' })}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Severity Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Severity:</span>
          <select
            id="select-alarm-severity"
            value={filter.severity}
            onChange={(e) => onFilterChange({ severity: e.target.value as any })}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warning Only</option>
            <option value="INFO">Info Only</option>
          </select>
        </div>

        {/* Source Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Source:</span>
          <select
            id="select-alarm-source"
            value={filter.sourceType}
            onChange={(e) => onFilterChange({ sourceType: e.target.value as any })}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <option value="ALL">All Equipment & Systems</option>
            <option value="AMR">AMR / AGV Fleet</option>
            <option value="PLC_CONVEYOR">Conveyor Lines (PLC)</option>
            <option value="PLC_LIFT">Vertical Lifts (PLC)</option>
            <option value="RCS_GATEWAY">RCS / PUDU Gateway</option>
            <option value="WMS_ADAPTER">WMS / ERP Adapter</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {(filter.search || filter.severity !== 'ALL' || filter.sourceType !== 'ALL') && (
          <button
            type="button"
            id="btn-reset-alarm-filters"
            onClick={() =>
              onFilterChange({
                search: '',
                severity: 'ALL',
                sourceType: 'ALL',
              })
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              fontSize: '11.5px',
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Filter size={11} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
