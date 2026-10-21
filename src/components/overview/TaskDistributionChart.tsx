'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { TaskDistributionItem } from '@/types/overview';

interface TaskDistributionProps {
  distribution?: TaskDistributionItem[];
}

export function TaskDistributionChart({ distribution }: TaskDistributionProps) {
  const items = [
    { type: 'Transport', count: 6, percentage: 50, color: '#0284c7' },
    { type: 'Pickup', count: 3, percentage: 25, color: '#10b981' },
    { type: 'Delivery', count: 2, percentage: 17, color: '#f59e0b' },
    { type: 'Docking', count: 1, percentage: 8, color: '#6366f1' },
  ];

  const totalTasks = 12;

  // SVG Donut calculation
  // Radius = 42, Circumference = 2 * PI * 42 = 263.89
  const r = 42;
  const c = 2 * Math.PI * r;

  let cumulativePercent = 0;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} style={{ color: '#2563eb' }} />
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Task distribution
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b' }}>{totalTasks} active</span>
      </div>

      {/* Body: Donut on Left, Legend on Right */}
      <div
        className="panel-body"
        style={{
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flex: 1,
        }}
      >
        {/* Donut Chart with Center Number */}
        <div
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="14"
            />
            {items.map((slice) => {
              const dashLength = (slice.percentage / 100) * c;
              const dashOffset = -((cumulativePercent / 100) * c);
              cumulativePercent += slice.percentage;

              return (
                <circle
                  key={slice.type}
                  cx="60"
                  cy="60"
                  r={r}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="14"
                  strokeDasharray={`${dashLength} ${c - dashLength}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {totalTasks}
            </span>
            <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
              Tasks
            </span>
          </div>
        </div>

        {/* Legend Table on Right */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            justifyContent: 'center',
          }}
        >
          {items.map((item) => (
            <div
              key={item.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: item.color,
                  }}
                />
                <span style={{ color: '#334155', fontWeight: 500 }}>{item.type}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', width: '12px', textAlign: 'right' }}>
                  {item.count}
                </span>
                <span style={{ color: '#64748b', fontSize: '11px', width: '28px', textAlign: 'right' }}>
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
