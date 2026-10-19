'use client';

import React from 'react';
import {
  Settings,
  Layers,
  ArrowUpDown,
  Truck,
  LogIn,
  BatteryCharging,
} from 'lucide-react';

interface EquipmentHealthProps {
  categories?: any[];
}

export function EquipmentHealth({ categories }: EquipmentHealthProps) {
  const items = [
    {
      name: 'Conveyors',
      ready: 8,
      total: 8,
      status: 'ready',
      icon: Layers,
    },
    {
      name: 'Lifts',
      ready: 2,
      total: 3,
      status: 'warning',
      icon: ArrowUpDown,
    },
    {
      name: 'Transfer stations',
      ready: 8,
      total: 8,
      status: 'ready',
      icon: Truck,
    },
    {
      name: 'Docking stations',
      ready: 5,
      total: 5,
      status: 'ready',
      icon: LogIn,
    },
    {
      name: 'Charging stations',
      ready: 3,
      total: 3,
      status: 'ready',
      icon: BatteryCharging,
    },
  ];

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={17} style={{ color: '#2563eb' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
            Equipment health
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b' }}>18 / 19 ready</span>
      </div>

      {/* Body List */}
      <div
        className="panel-body"
        style={{
          padding: '10px 16px 12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '9px',
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isWarning = item.status === 'warning';
          const pct = Math.round((item.ready / item.total) * 100);
          const barColor = isWarning ? '#f59e0b' : '#10b981';
          const textColor = isWarning ? '#d97706' : '#16a34a';

          return (
            <div
              key={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              {/* Left: Icon + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '135px' }}>
                <Icon
                  size={14}
                  style={{
                    color: item.status === 'ready' && item.name.includes('stations') ? '#16a34a' : '#64748b',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 500,
                    color: '#334155',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.name}
                </span>
              </div>

              {/* Middle: Progress Bar */}
              <div
                style={{
                  flex: 1,
                  height: '7px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    backgroundColor: barColor,
                    borderRadius: '4px',
                  }}
                />
              </div>

              {/* Right: Fraction Count */}
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: textColor,
                  width: '32px',
                  textAlign: 'right',
                }}
              >
                {item.ready} / {item.total}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
