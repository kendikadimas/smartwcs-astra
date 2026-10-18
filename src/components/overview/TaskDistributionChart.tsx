import React from 'react';
import { TaskDistributionItem } from '@/types/overview';

interface TaskDistributionProps {
  distribution: TaskDistributionItem[];
}

export function TaskDistributionChart({ distribution }: TaskDistributionProps) {
  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Task distribution</span>
        <span className="panel-subtitle">12 active</span>
      </div>

      {/* Body with horizontal progress bars */}
      <div
        className="panel-body"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          padding: '14px 18px',
          gap: '10px',
        }}
      >
        {distribution.map((item) => (
          <div
            key={item.type}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '12.5px',
            }}
          >
            {/* Label */}
            <span style={{ width: '70px', color: '#0f172a', fontWeight: 500 }}>
              {item.type}
            </span>

            {/* Track Bar */}
            <div
              style={{
                flex: 1,
                height: '10px',
                backgroundColor: '#f1f5f9',
                borderRadius: '5px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${item.percentage}%`,
                  backgroundColor: '#0284c7',
                  borderRadius: '5px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {/* Number Count */}
            <span
              style={{
                width: '16px',
                textAlign: 'right',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              {item.count}
            </span>
          </div>
        ))}

        {/* Footer Subtext */}
        <div
          style={{
            fontSize: '11px',
            color: '#64748b',
            marginTop: '4px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '8px',
          }}
        >
          Running + queued · delayed flags overlap
        </div>
      </div>
    </div>
  );
}
