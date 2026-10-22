'use client';

import React from 'react';
import { CycleTimeBreakdownItem } from '@/types/kpi';
import { mockCycleTimeBreakdown } from '@/data/mockKpi';
import { Timer, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';

export function CycleTimeBreakdown() {
  const maxSla = Math.max(...mockCycleTimeBreakdown.map((item) => item.slaLimitMinutes)) * 1.1;

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
        }}
      >
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Cycle Time &amp; SLA Compliance
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Average duration vs P95 worst-case latency per task category
          </div>
        </div>
      </div>

      {/* Legend & Threshold explanation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 18px',
          backgroundColor: '#fafbfc',
          borderBottom: '1px solid #f1f5f9',
          fontSize: '11px',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#0284c7' }} />
            <span>Average Duration</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#818cf8' }} />
            <span>P95 Latency</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '2px', backgroundColor: '#ef4444', borderStyle: 'dashed' }} />
            <span>SLA Limit</span>
          </div>
        </div>
        <span>Target: &gt;95% on-time</span>
      </div>

      {/* Breakdown Items List */}
      <div
        className="panel-body"
        style={{
          padding: '14px 18px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflowY: 'auto',
        }}
      >
        {mockCycleTimeBreakdown.map((item) => {
          const avgPct = (item.avgMinutes / maxSla) * 100;
          const p95Pct = (item.p95Minutes / maxSla) * 100;
          const slaPct = (item.slaLimitMinutes / maxSla) * 100;

          return (
            <div key={item.taskType} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.taskType}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Avg: <strong>{item.avgFormatted}</strong> · P95: <strong>{item.p95Formatted}</strong>
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: item.slaComplianceRate >= 95 ? '#15803d' : '#b45309',
                      backgroundColor: item.slaComplianceRate >= 95 ? '#dcfce7' : '#fef3c7',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {item.slaComplianceRate}%
                  </span>
                </div>
              </div>

              {/* Progress & Latency Bar Container */}
              <div
                style={{
                  height: '14px',
                  width: '100%',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '4px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* P95 Latency Bar (Extended) */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${p95Pct}%`,
                    backgroundColor: '#c7d2fe',
                    borderRadius: '4px',
                  }}
                  title={`P95: ${item.p95Formatted}`}
                />

                {/* Average Duration Bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${avgPct}%`,
                    backgroundColor: '#0284c7',
                    borderRadius: '4px',
                  }}
                  title={`Average: ${item.avgFormatted}`}
                />

                {/* SLA Limit Threshold Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${slaPct}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: '#ef4444',
                    zIndex: 2,
                  }}
                  title={`SLA Limit: ${item.slaLimitMinutes}m`}
                />
              </div>

              {/* Mini task volume count */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                <span>{item.totalTasks} tasks processed</span>
                <span>SLA Max: {item.slaLimitMinutes}.0 min</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
