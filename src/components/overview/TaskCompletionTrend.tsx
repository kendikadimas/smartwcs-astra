'use client';

import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { HourlyCompletionItem } from '@/types/overview';

interface TaskCompletionTrendProps {
  data?: HourlyCompletionItem[];
}

export function TaskCompletionTrend({ data }: TaskCompletionTrendProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const hourlyData = [
    { hour: '06:00', completed: 4, failed: 0, rate: 100 },
    { hour: '07:00', completed: 5, failed: 1, rate: 84 },
    { hour: '08:00', completed: 7, failed: 1, rate: 88 },
    { hour: '09:00', completed: 8, failed: 2, rate: 80 },
    { hour: '10:00', completed: 6, failed: 1, rate: 86 },
  ];

  const maxVal = 10;
  const chartHeight = 85;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px 8px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: '#2563eb' }} />
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Task completion trend
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b' }}>32 today · hourly</span>
      </div>

      {/* Sub Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '0 18px 8px 18px',
          fontSize: '11px',
          color: '#64748b',
          borderBottom: '1px solid #f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>Completed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <span>Failed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '2px', backgroundColor: '#0284c7' }} />
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', border: '1.5px solid #0284c7', backgroundColor: '#ffffff', marginLeft: '-9px' }} />
          <span style={{ marginLeft: '4px' }}>Success rate</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div
        className="panel-body"
        style={{
          padding: '8px 14px 12px 10px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '115px' }}>
          {/* Left Y Axis (Tasks count) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100px',
              fontSize: '10px',
              color: '#94a3b8',
              width: '28px',
              textAlign: 'right',
              paddingBottom: '2px',
            }}
          >
            <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600 }}>Tasks</span>
            <span>10</span>
            <span>5</span>
            <span>0</span>
          </div>

          {/* Main Chart Area (SVG Overlay for Line + Stacked Bars) */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            {/* Axis Grid lines */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: '22px', borderTop: '1px dashed #f1f5f9' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '56px', borderTop: '1px dashed #f1f5f9' }} />

            {/* SVG Trend Line Overlay */}
            <svg
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                width: '100%',
                height: `${chartHeight}px`,
                pointerEvents: 'none',
                zIndex: 4,
              }}
              viewBox="0 0 250 85"
              preserveAspectRatio="none"
            >
              {/* Line path mapping to rates */}
              <polyline
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.2"
                points="25,18 75,34 125,26 175,20 225,24"
              />
              {/* Circular Dots */}
              <circle cx="25" cy="18" r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.2" />
              <circle cx="75" cy="34" r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.2" />
              <circle cx="125" cy="26" r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.2" />
              <circle cx="175" cy="20" r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.2" />
              <circle cx="225" cy="24" r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.2" />
            </svg>

            {/* Bars Container */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                height: `${chartHeight}px`,
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '1px',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {hourlyData.map((d, i) => {
                const completedH = (d.completed / maxVal) * chartHeight;
                const failedH = (d.failed / maxVal) * chartHeight;
                const isHovered = hoveredIdx === i;

                return (
                  <div
                    key={d.hour}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      width: '28px',
                      position: 'relative',
                    }}
                    title={`${d.hour} · ${d.completed} completed, ${d.failed} failed (${d.rate}% success)`}
                  >
                    {/* Stacked Bar Container: Green on Top, Red on Bottom */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '18px',
                        borderRadius: '3px 3px 0 0',
                        overflow: 'hidden',
                        filter: isHovered ? 'brightness(1.08)' : 'none',
                        transition: 'filter 0.15s ease',
                      }}
                    >
                      {/* Green Completed Bar (Top) */}
                      <div
                        style={{
                          height: `${completedH}px`,
                          backgroundColor: '#10b981',
                          width: '100%',
                        }}
                      />
                      {/* Red Failed Bar (Bottom) */}
                      {d.failed > 0 && (
                        <div
                          style={{
                            height: `${failedH}px`,
                            backgroundColor: '#ef4444',
                            width: '100%',
                          }}
                        />
                      )}
                    </div>

                    {/* X Axis Label */}
                    <span
                      style={{
                        fontSize: '9.5px',
                        color: isHovered ? '#0f172a' : '#64748b',
                        marginTop: '4px',
                        fontWeight: isHovered ? 600 : 400,
                      }}
                    >
                      {d.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Y Axis (Success Rate) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100px',
              fontSize: '10px',
              color: '#94a3b8',
              width: '30px',
              textAlign: 'left',
              paddingBottom: '2px',
            }}
          >
            <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600 }}>Rate</span>
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
