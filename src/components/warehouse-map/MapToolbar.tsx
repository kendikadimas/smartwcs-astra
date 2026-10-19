'use client';

import React from 'react';
import { MapLayerFilters } from '@/types/warehouseMap';
import {
  Box,
  Compass,
  Search,
  SlidersHorizontal,
  Layers,
  Settings,
} from 'lucide-react';

interface MapToolbarProps {
  layers: MapLayerFilters;
  onToggleLayer: (layerKey: keyof MapLayerFilters) => void;
  viewMode: '2.5D' | 'Top';
  onSelectViewMode: (mode: '2.5D' | 'Top') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function MapToolbar({
  layers,
  onToggleLayer,
  viewMode,
  onSelectViewMode,
  searchQuery,
  onSearchChange,
}: MapToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        gap: '14px',
        flexWrap: 'wrap',
      }}
    >
      {/* Left: Layer Checkboxes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
          Layers:
        </span>

        {(
          [
            { key: 'zones', label: 'Zones' },
            { key: 'racks', label: 'Racks' },
            { key: 'robots', label: 'Robots' },
            { key: 'routes', label: 'Routes' },
            { key: 'equipment', label: 'Equipment' },
            { key: 'safetyZones', label: 'Safety Zones' },
          ] as const
        ).map((item) => {
          const checked = layers[item.key];
          return (
            <label
              key={item.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                fontWeight: 500,
                color: checked ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleLayer(item.key)}
                style={{
                  width: '14px',
                  height: '14px',
                  accentColor: '#2563eb',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              />
              <span>{item.label}</span>
            </label>
          );
        })}
      </div>

      {/* Right: View Switcher & Search & Tool Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* View Switcher: 2.5D View vs Top View */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid #e2e8f0',
          }}
        >
          <button
            onClick={() => onSelectViewMode('2.5D')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === '2.5D' ? '#ffffff' : 'transparent',
              color: viewMode === '2.5D' ? '#2563eb' : '#64748b',
              boxShadow: viewMode === '2.5D' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <Box size={12} />
            2.5D View
          </button>

          <button
            onClick={() => onSelectViewMode('Top')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'Top' ? '#ffffff' : 'transparent',
              color: viewMode === 'Top' ? '#2563eb' : '#64748b',
              boxShadow: viewMode === 'Top' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <Compass size={12} />
            Top View
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '220px' }}>
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
            placeholder="Search robot, location, or task..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 10px 5px 28px',
              fontSize: '11.5px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              outline: 'none',
              color: '#0f172a',
            }}
          />
        </div>

        {/* Action Icon Buttons */}
        <button
          className="icon-button"
          style={{ width: '28px', height: '28px', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#64748b' }}
          title="Filter options"
        >
          <SlidersHorizontal size={13} />
        </button>
        <button
          className="icon-button"
          style={{ width: '28px', height: '28px', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#64748b' }}
          title="Map layer management"
        >
          <Layers size={13} />
        </button>
        <button
          className="icon-button"
          style={{ width: '28px', height: '28px', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#64748b' }}
          title="Map display settings"
        >
          <Settings size={13} />
        </button>
      </div>
    </div>
  );
}
