import React from 'react';
import { EquipmentHealthCategory } from '@/types/overview';

interface EquipmentHealthProps {
  categories: EquipmentHealthCategory[];
}

export function EquipmentHealth({ categories }: EquipmentHealthProps) {
  return (
    <div className="panel" style={{ height: '100%' }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Equipment health</span>
        <span className="panel-subtitle">18 / 19 ready</span>
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
        {categories.map((cat) => {
          const isFault = cat.status === 'fault';
          return (
            <div
              key={cat.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12.5px',
              }}
            >
              <span style={{ color: '#0f172a', fontWeight: 500 }}>{cat.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isFault ? '#f59e0b' : '#16a34a',
                  }}
                />
                <span
                  style={{
                    color: isFault ? '#b45309' : '#15803d',
                    fontWeight: 500,
                    fontSize: '12px',
                  }}
                >
                  {cat.ready} / {cat.total}
                  {cat.note && ` · ${cat.note}`}
                  {!cat.note && ' ready'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
