'use client';

import React from 'react';
import { MasterDataKpis as MasterDataKpisType, MasterCategoryKey } from '@/types/masterData';
import {
  Bot,
  Box,
  MapPin,
  Package,
  FileText,
  Users,
} from 'lucide-react';

interface MasterDataKpisProps {
  kpis: MasterDataKpisType;
  activeCategory: MasterCategoryKey;
  onSelectCategory: (cat: MasterCategoryKey) => void;
}

export function MasterDataKpis({
  kpis,
  activeCategory,
  onSelectCategory,
}: MasterDataKpisProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
        width: '100%',
      }}
    >
      {/* 1. Robots */}
      <div
        onClick={() => onSelectCategory('robots')}
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #bfdbfe',
          }}
        >
          <Bot size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Robots</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
            {kpis.robots.total}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: '#64748b',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ color: '#047857', fontWeight: 600 }}>{kpis.robots.active} Active</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ color: '#b91c1c' }}>{kpis.robots.offline} Offline</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#f97316' }} />
              <span style={{ color: '#c2410c' }}>{kpis.robots.fault} Fault</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Equipment */}
      <div
        onClick={() => onSelectCategory('equipment')}
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#f0f9ff',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #bae6fd',
          }}
        >
          <Box size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Equipment</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
            {kpis.equipment.total}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: '#64748b',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ color: '#047857', fontWeight: 600 }}>{kpis.equipment.online} Online</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ color: '#b91c1c' }}>{kpis.equipment.offline} Offline</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Locations */}
      <div
        onClick={() => onSelectCategory('locations')}
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #fecaca',
          }}
        >
          <MapPin size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Locations</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
            {kpis.locations.total}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: '#64748b',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ color: '#047857', fontWeight: 600 }}>{kpis.locations.active} Active</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#64748b' }} />
              <span style={{ color: '#475569' }}>{kpis.locations.inactive} Inactive</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Materials / Pallets */}
      <div
        onClick={() => onSelectCategory('materials')}
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #a7f3d0',
          }}
        >
          <Package size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Materials / Pallets</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
            {kpis.materials.total.toLocaleString()}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: '#64748b',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ color: '#047857', fontWeight: 600 }}>{kpis.materials.available.toLocaleString()} Available</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ color: '#b45309' }}>{kpis.materials.inUse} In use</span>
            </span>
          </div>
        </div>
      </div>

      {/* 5. Task Types */}
      <div
        onClick={() => onSelectCategory('task-types')}
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #bfdbfe',
          }}
        >
          <FileText size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Task Types</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
            {kpis.taskTypes.total}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px' }}>
            All active
          </div>
        </div>
      </div>

      {/* 6. User Roles */}
      <div
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #bbf7d0',
          }}
        >
          <Users size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>User Roles</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
            {kpis.userRoles.total}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px' }}>
            All configured
          </div>
        </div>
      </div>
    </div>
  );
}
