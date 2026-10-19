'use client';

import React from 'react';
import { Share2, Database, Bot, Cpu } from 'lucide-react';
import { IntegrationAdapter } from '@/types/overview';

interface IntegrationAdaptersProps {
  adapters?: IntegrationAdapter[];
}

export function IntegrationAdapters({ adapters }: IntegrationAdaptersProps) {
  const items = [
    {
      name: 'WMS',
      role: 'Inventory / orders',
      icon: Database,
    },
    {
      name: 'RCS',
      role: 'Robot execution',
      icon: Bot,
    },
    {
      name: 'PLC',
      role: 'Equipment control',
      icon: Cpu,
    },
  ];

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      {/* Header */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 16px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Share2 size={17} style={{ color: '#2563eb' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
            Integration adapters
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b' }}>3 connected</span>
      </div>

      {/* Body List */}
      <div
        className="panel-body"
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          flex: 1,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
              }}
            >
              {/* Left: Icon + Name + Role */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: '#0f172a', width: '38px' }}>
                  {item.name}
                </span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>{item.role}</span>
              </div>

              {/* Right: Connected Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#15803d',
                  fontWeight: 600,
                  fontSize: '11px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                  }}
                />
                Connected
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
