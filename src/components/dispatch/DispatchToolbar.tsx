'use client';

import React from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Power,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { DispatchFilterState } from '@/types/dispatch';

interface DispatchToolbarProps {
  filter: DispatchFilterState;
  onFilterChange: (newFilter: DispatchFilterState) => void;
  statusCounts: Record<string, number>;
  isEngineActive: boolean;
  onToggleEngine: () => void;
  onOpenManualDispatch: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function DispatchToolbar({
  filter,
  onFilterChange,
  statusCounts,
  isEngineActive,
  onToggleEngine,
  onOpenManualDispatch,
  onRefresh,
  isRefreshing,
}: DispatchToolbarProps) {
  const tabs = [
    { key: 'ALL', label: 'All', count: statusCounts['ALL'] || 0 },
    { key: 'Executing', label: 'Executing', count: statusCounts['Executing'] || 0 },
    { key: 'Dispatched', label: 'Dispatched', count: statusCounts['Dispatched'] || 0 },
    { key: 'Queued', label: 'Queued', count: statusCounts['Queued'] || 0 },
    { key: 'Delayed', label: 'Delayed', count: statusCounts['Delayed'] || 0 },
    { key: 'Completed', label: 'Completed', count: statusCounts['Completed'] || 0 },
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
      {/* Top Row: Search, Dropdowns, Engine Switch, and Manual Dispatch */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '380px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Search mission ID, task ID, AMR, waypoint..."
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            style={{
              width: '100%',
              padding: '7.5px 12px 7.5px 33px',
              fontSize: '12.5px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
            }}
          />
        </div>

        {/* Middle Filters: Resource Type & Priority */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Resource Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={filter.resourceType}
              onChange={(e) => onFilterChange({ ...filter, resourceType: e.target.value })}
              className="select-input"
              style={{
                appearance: 'none',
                paddingRight: '26px',
                fontSize: '12px',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="ALL">All Resource Types</option>
              <option value="AMR">AMR / AGV Fleet</option>
              <option value="Conveyor">Conveyor Lines</option>
              <option value="Lift">Vertical Lifts</option>
            </select>
            <ChevronDown
              size={13}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#64748b',
              }}
            />
          </div>

          {/* Priority Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={filter.priority}
              onChange={(e) => onFilterChange({ ...filter, priority: e.target.value })}
              className="select-input"
              style={{
                appearance: 'none',
                paddingRight: '26px',
                fontSize: '12px',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Normal">Normal Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <ChevronDown
              size={13}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#64748b',
              }}
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="icon-button"
            title="Refresh dispatch stream"
            style={{ width: '32px', height: '32px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
          </button>
        </div>

        {/* Right Controls: Auto Engine Toggle & Manual Dispatch Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Auto-Dispatch Engine Toggle */}
          <button
            onClick={onToggleEngine}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6.5px 14px',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${isEngineActive ? '#a7f3d0' : '#fed7aa'}`,
              backgroundColor: isEngineActive ? '#ecfdf5' : '#fff7ed',
              color: isEngineActive ? '#059669' : '#c2410c',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isEngineActive ? 'Click to Pause Auto-Dispatch Engine' : 'Click to Resume Auto-Dispatch Engine'}
          >
            <span>{isEngineActive ? 'Engine: Active' : 'Engine: Paused'}</span>
          </button>

          {/* Manual Dispatch Trigger */}
          <button
            onClick={onOpenManualDispatch}
            className="btn-primary"
            style={{ padding: '6.5px 14px', fontSize: '12px', fontWeight: 600 }}
          >
            <Plus size={14} />
            <span>Manual Dispatch</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Status Filter Tabs */}
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
          const active = filter.status === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onFilterChange({ ...filter, status: tab.key })}
              style={{
                padding: '4px 11px',
                borderRadius: '16px',
                fontSize: '11.5px',
                fontWeight: active ? 600 : 500,
                border: active ? '1px solid #bfdbfe' : '1px solid transparent',
                backgroundColor: active ? '#eff6ff' : 'transparent',
                color: active ? '#2563eb' : '#64748b',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '10px',
                  backgroundColor: active ? '#2563eb' : '#f1f5f9',
                  color: active ? '#ffffff' : '#64748b',
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
