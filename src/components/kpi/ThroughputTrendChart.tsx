'use client';

import React, { useState } from 'react';
import { ThroughputTrendPoint } from '@/types/kpi';
import {
  mockHourlyThroughput,
  mockDailyThroughput,
} from '@/data/mockKpi';
import { TrendingUp, BarChart2, Info } from 'lucide-react';

interface ThroughputTrendChartProps {
  timeRange?: string;
}

export function ThroughputTrendChart({ timeRange }: ThroughputTrendChartProps) {
  const [viewMode, setViewMode] = useState<'hourly' | 'daily'>('hourly');
  const [metricType, setMetricType] = useState<'tasks' | 'volume'>('tasks');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data: ThroughputTrendPoint[] =
    viewMode === 'hourly' ? mockHourlyThroughput : mockDailyThroughput;

  const maxVal = Math.max(...data.map((d) => (metricType === 'tasks' ? Math.max(d.completed, d.target) : d.volumeKg / 1000))) * 1.15;
  const chartHeight = 150;

  const totalCompleted = data.reduce((acc, curr) => acc + curr.completed, 0);
  const totalTarget = data.reduce((acc, curr) => acc + curr.target, 0);
  const totalFailed = data.reduce((acc, curr) => acc + curr.failed, 0);
  const totalVolumeTons = (data.reduce((acc, curr) => acc + curr.volumeKg, 0) / 1000).toFixed(1);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Panel Header */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Throughput &amp; Task Completion Trends
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Execution output vs target thresholds across operating shifts
          </div>
        </div>

        {/* View Switches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Tasks vs Volume Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '5px' }}>
            <button
              onClick={() => setMetricType('tasks')}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: metricType === 'tasks' ? 600 : 500,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: metricType === 'tasks' ? '#ffffff' : 'transparent',
                color: metricType === 'tasks' ? '#0f172a' : '#64748b',
                boxShadow: metricType === 'tasks' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
              }}
            >
              Pallets (Units)
            </button>
            <button
              onClick={() => setMetricType('volume')}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: metricType === 'volume' ? 600 : 500,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: metricType === 'volume' ? '#ffffff' : 'transparent',
                color: metricType === 'volume' ? '#0f172a' : '#64748b',
                boxShadow: metricType === 'volume' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
              }}
            >
              Volume (Tons)
            </button>
          </div>

          {/* Hourly vs Daily Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '5px' }}>
            <button
              onClick={() => setViewMode('hourly')}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: viewMode === 'hourly' ? 600 : 500,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'hourly' ? '#ffffff' : 'transparent',
                color: viewMode === 'hourly' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'hourly' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
              }}
            >
              Hourly
            </button>
            <button
              onClick={() => setViewMode('daily')}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: viewMode === 'daily' ? 600 : 500,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'daily' ? '#ffffff' : 'transparent',
                color: viewMode === 'daily' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'daily' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
              }}
            >
              Past 7 Days
            </button>
          </div>
        </div>
      </div>

      {/* Mini Stats Ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 18px',
          backgroundColor: '#fafbfc',
          borderBottom: '1px solid #f1f5f9',
          fontSize: '11.5px',
        }}
      >
        <div style={{ display: 'flex', gap: '18px' }}>
          <div>
            <span style={{ color: '#64748b' }}>Total Completed: </span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              {metricType === 'tasks' ? `${totalCompleted} pallets` : `${totalVolumeTons} tons`}
            </span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Target: </span>
            <span style={{ fontWeight: 600, color: '#0284c7' }}>
              {metricType === 'tasks' ? `${totalTarget} pallets` : '64.0 tons'}
            </span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Exceptions: </span>
            <span style={{ fontWeight: 600, color: totalFailed > 0 ? '#ef4444' : '#10b981' }}>
              {totalFailed} failed
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#64748b', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#0284c7' }} />
            <span>Completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '2px', backgroundColor: '#f59e0b', borderStyle: 'dashed' }} />
            <span>Target Line</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#ef4444' }} />
            <span>Failed Task</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        style={{
          padding: '20px 18px 14px 18px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          position: 'relative',
        }}
      >
        {/* Floating Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '20px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ color: '#94a3b8' }}>Period: </span>
              <strong>{data[hoveredIndex].time}</strong>
            </div>
            <div>
              <span style={{ color: '#38bdf8' }}>Completed: </span>
              <strong>
                {metricType === 'tasks' ? `${data[hoveredIndex].completed} pallets` : `${(data[hoveredIndex].volumeKg / 1000).toFixed(1)}t`}
              </strong>
            </div>
            <div>
              <span style={{ color: '#fbbf24' }}>Target: </span>
              <strong>{data[hoveredIndex].target}</strong>
            </div>
            {data[hoveredIndex].failed > 0 && (
              <div>
                <span style={{ color: '#f87171' }}>Failed: </span>
                <strong>{data[hoveredIndex].failed}</strong>
              </div>
            )}
          </div>
        )}

        {/* Bar & Target Visualizer */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: `${chartHeight}px`, position: 'relative' }}>
          {/* Horizontal Grid lines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              pointerEvents: 'none',
              opacity: 0.5,
            }}
          >
            <div style={{ borderBottom: '1px dashed #e2e8f0', width: '100%' }} />
            <div style={{ borderBottom: '1px dashed #e2e8f0', width: '100%' }} />
            <div style={{ borderBottom: '1px solid #cbd5e1', width: '100%' }} />
          </div>

          {/* Bars */}
          {data.map((item, idx) => {
            const val = metricType === 'tasks' ? item.completed : item.volumeKg / 1000;
            const targetVal = metricType === 'tasks' ? item.target : item.target * 0.4;
            const barHeight = Math.max(8, (val / maxVal) * chartHeight);
            const targetTop = chartHeight - (targetVal / maxVal) * chartHeight;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.time}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Target Marker Pin */}
                <div
                  style={{
                    position: 'absolute',
                    top: `${targetTop}px`,
                    width: '85%',
                    height: '2px',
                    backgroundColor: '#f59e0b',
                    borderRadius: '1px',
                    zIndex: 3,
                  }}
                  title={`Target: ${targetVal}`}
                />

                {/* Failed Task mini top cap if any */}
                {item.failed > 0 && (
                  <div
                    style={{
                      width: '70%',
                      height: '6px',
                      backgroundColor: '#ef4444',
                      borderRadius: '2px 2px 0 0',
                      marginBottom: '1px',
                    }}
                  />
                )}

                {/* Completed Bar */}
                <div
                  style={{
                    width: '70%',
                    height: `${barHeight}px`,
                    background: isHovered
                      ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
                      : 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                    borderRadius: item.failed > 0 ? '0 0 3px 3px' : '3px 3px 0 0',
                    transition: 'all 0.15s ease',
                    boxShadow: isHovered ? '0 4px 8px rgba(2, 132, 199, 0.25)' : 'none',
                  }}
                />

                {/* X Axis Label */}
                <span
                  style={{
                    fontSize: '10px',
                    color: isHovered ? '#0f172a' : '#64748b',
                    fontWeight: isHovered ? 700 : 500,
                    marginTop: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
