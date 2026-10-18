'use client';

import React, { useState } from 'react';
import { HourlyCompletionItem } from '@/types/overview';

interface TaskCompletionTrendProps {
  data: HourlyCompletionItem[];
}

export function TaskCompletionTrend({ data }: TaskCompletionTrendProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Maximum value for scaling (max is 10)
  const maxVal = 10;
  const chartHeight = 85;

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Task completion trend</span>
        <span className="panel-subtitle">32 today · hourly</span>
      </div>

      {/* Chart Body */}
      <div
        className="panel-body"
        style={{
          flex: 1,
          padding: '12px 16px 8px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: `${chartHeight + 35}px` }}>
          {/* Y Axis markings */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: `${chartHeight}px`,
              paddingBottom: '2px',
              fontSize: '10px',
              color: '#94a3b8',
              width: '16px',
              textAlign: 'right',
            }}
          >
            <span>10</span>
            <span>5</span>
            <span>0</span>
          </div>

          {/* Bar Chart Columns */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              height: '100%',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '2px',
            }}
          >
            {data.map((item, idx) => {
              const barHeight = (item.completed / maxVal) * chartHeight;
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={item.hour}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    width: '32px',
                  }}
                >
                  {/* Value on top of bar */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isHovered ? '#0f172a' : '#475569',
                      marginBottom: '4px',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {item.completed}
                  </span>

                  {/* Vertical Bar */}
                  <div
                    style={{
                      width: '20px',
                      height: `${barHeight}px`,
                      backgroundColor: isHovered ? '#65a30d' : '#84cc16',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s ease, background-color 0.15s ease',
                    }}
                  />

                  {/* X Axis Label */}
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#64748b',
                      marginTop: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '10.5px',
          color: '#64748b',
          backgroundColor: '#fafbfc',
        }}
      >
        Completed tasks · *current hour is partial
      </div>
    </div>
  );
}
