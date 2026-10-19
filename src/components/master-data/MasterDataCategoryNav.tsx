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
    { key: 'robots', label: 'Robots', icon: <Bot size={15} /> },
    { key: 'equipment', label: 'Equipment', icon: <Box size={15} /> },
    { key: 'locations', label: 'Locations', icon: <MapPin size={15} /> },
    { key: 'materials', label: 'Materials', icon: <Package size={15} /> },
    { key: 'task-types', label: 'Task Types', icon: <FileText size={15} /> },
    { key: 'zones', label: 'Zones', icon: <Layers size={15} /> },
    { key: 'charging-stations', label: 'Charging Stations', icon: <Zap size={15} /> },
    { key: 'conveyors', label: 'Conveyors', icon: <ArrowLeftRight size={15} /> },
    { key: 'racks', label: 'Racks', icon: <LayoutGrid size={15} /> },
    { key: 'workstations', label: 'Workstations', icon: <Wrench size={15} /> },
    { key: 'routes', label: 'Routes', icon: <GitBranch size={15} /> },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        padding: '2px 0',
        whiteSpace: 'nowrap',
      }}
    >
      {categories.map((cat) => {
        const isActive = activeCategory === cat.key;

        return (
          <button
            key={cat.key}
            onClick={() => onSelectCategory(cat.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#2563eb' : '#475569',
              backgroundColor: isActive ? '#ffffff' : 'transparent',
              border: isActive ? '1.5px solid #2563eb' : '1.5px solid transparent',
              boxShadow: isActive ? '0 1px 2px rgba(37,99,235,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <span style={{ color: isActive ? '#2563eb' : '#64748b' }}>
              {cat.icon}
            </span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
