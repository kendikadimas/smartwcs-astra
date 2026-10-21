'use client';

import React from 'react';
import { MasterCategoryKey } from '@/types/masterData';
import {
  Bot,
  Box,
  MapPin,
  Package,
  FileText,
  Layers,
  Zap,
  ArrowLeftRight,
  LayoutGrid,
  Wrench,
  GitBranch,
} from 'lucide-react';

interface MasterDataCategoryNavProps {
  activeCategory: MasterCategoryKey;
  onSelectCategory: (key: MasterCategoryKey) => void;
  counts: Record<MasterCategoryKey, number>;
}

export function MasterDataCategoryNav({
  activeCategory,
  onSelectCategory,
  counts,
}: MasterDataCategoryNavProps) {
  const categories: { key: MasterCategoryKey; label: string; icon: React.ReactNode }[] = [
    { key: 'robots', label: 'Robots Fleet', icon: <Bot size={14} /> },
    { key: 'equipment', label: 'Equipment', icon: <Box size={14} /> },
    { key: 'locations', label: 'Locations', icon: <MapPin size={14} /> },
    { key: 'materials', label: 'Materials', icon: <Package size={14} /> },
    { key: 'task-types', label: 'Task Types', icon: <FileText size={14} /> },
    { key: 'zones', label: 'Zones', icon: <Layers size={14} /> },
    { key: 'charging-stations', label: 'Charging Stations', icon: <Zap size={14} /> },
    { key: 'conveyors', label: 'Conveyors', icon: <ArrowLeftRight size={14} /> },
    { key: 'racks', label: 'Racks', icon: <LayoutGrid size={14} /> },
    { key: 'workstations', label: 'Workstations', icon: <Wrench size={14} /> },
    { key: 'routes', label: 'Routes', icon: <GitBranch size={14} /> },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        padding: '6px 8px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        scrollbarWidth: 'none',
      }}
    >
      {categories.map((cat) => {
        const isActive = activeCategory === cat.key;
        const count = counts[cat.key];

        return (
          <button
            key={cat.key}
            onClick={() => onSelectCategory(cat.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#2563eb' : '#475569',
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
              boxShadow: isActive ? '0 1px 2px rgba(37,99,235,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <span style={{ color: isActive ? '#2563eb' : '#64748b', display: 'flex', alignItems: 'center' }}>
              {cat.icon}
            </span>
            <span>{cat.label}</span>
            {count !== undefined && (
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#2563eb' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b',
                  lineHeight: 1.3,
                }}
              >
                {count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
