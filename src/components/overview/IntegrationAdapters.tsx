import React from 'react';
import { IntegrationAdapter } from '@/types/overview';

interface IntegrationAdaptersProps {
  adapters: IntegrationAdapter[];
}

export function IntegrationAdapters({ adapters }: IntegrationAdaptersProps) {
  return (
    <div className="panel" style={{ height: '100%' }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Integration adapters</span>
        <span className="panel-subtitle">3 connected</span>
      </div>

      {/* Body List */}
      <div
        className="panel-body"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {adapters.map((adapter) => (
          <div
            key={adapter.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '12.5px',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#16a34a',
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 600, color: '#0f172a', width: '42px' }}>
              {adapter.name}
            </span>
            <span style={{ color: '#64748b', fontSize: '12px' }}>{adapter.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
