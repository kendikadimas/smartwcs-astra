'use client';

import React from 'react';
import { AlarmParetoItem } from '@/types/kpi';
import { mockAlarmPareto } from '@/data/mockKpi';
import { AlertOctagon, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function AlarmParetoAnalysis() {
  const chartHeight = 120;
  const maxCount = Math.max(...mockAlarmPareto.map((item) => item.count)) * 1.15;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#fff1f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e11d48',
            }}
          >
            <AlertOctagon size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
              Alarm &amp; Incident Pareto Analysis
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Root cause frequency distribution &amp; 80/20 cumulative impact rule
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f43f5e' }} />
            <span>Incident Count</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '2px', backgroundColor: '#0284c7' }} />
            <span>Cumulative %</span>
          </div>
        </div>
      </div>

      {/* Visual Pareto Chart */}
      <div style={{ padding: '16px 18px 10px 18px', backgroundColor: '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: `${chartHeight}px`, position: 'relative' }}>
          {/* 80% Pareto Reference Line */}
          <div
            style={{
              position: 'absolute',
              top: `${chartHeight * 0.2}px`,
              left: 0,
              right: 0,
              borderTop: '1.5px dashed #0284c7',
              zIndex: 3,
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <span style={{ fontSize: '9.5px', color: '#0284c7', fontWeight: 700, backgroundColor: '#ffffff', padding: '0 4px', marginTop: '-8px' }}>
              80% Pareto Threshold
            </span>
          </div>

          {/* Pareto Bars */}
          {mockAlarmPareto.map((item, idx) => {
            const barH = Math.max(10, (item.count / maxCount) * chartHeight);
            const isTop3 = idx < 3;

            return (
              <div
                key={item.category}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Cumulative Percentage Label on top */}
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: item.cumulativePercentage <= 80 ? '#0284c7' : '#64748b',
                    marginBottom: '4px',
                  }}
                >
                  {item.cumulativePercentage.toFixed(0)}%
                </span>

                {/* Bar */}
                <div
                  style={{
                    width: '65%',
                    height: `${barH}px`,
                    background: isTop3
                      ? 'linear-gradient(180deg, #f43f5e 0%, #be123c 100%)'
                      : 'linear-gradient(180deg, #fb7185 0%, #e11d48 100%)',
                    borderRadius: '3px 3px 0 0',
                    boxShadow: isTop3 ? '0 2px 4px rgba(225, 29, 72, 0.2)' : 'none',
                  }}
                  title={`${item.category}: ${item.count} incidents (${item.percentage}%)`}
                />

                {/* X Axis Code */}
                <span
                  style={{
                    fontSize: '10px',
                    color: '#64748b',
                    fontWeight: 600,
                    marginTop: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  #{item.rank}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="panel-body" style={{ padding: 0, flex: 1, overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', fontSize: '11.5px' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>Rank</th>
              <th>Incident Category &amp; Code</th>
              <th>Primary Source</th>
              <th style={{ textAlign: 'right' }}>Count</th>
              <th style={{ textAlign: 'right' }}>Share</th>
              <th style={{ textAlign: 'right' }}>Cumul.</th>
              <th style={{ textAlign: 'right' }}>MTTR</th>
            </tr>
          </thead>
          <tbody>
            {mockAlarmPareto.map((item) => {
              const severityColor =
                item.severity === 'CRITICAL'
                  ? { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }
                  : item.severity === 'ERROR'
                  ? { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }
                  : { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };

              return (
                <tr key={item.code}>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                    #{item.rank}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.category}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {item.code}
                    </div>
                  </td>
                  <td style={{ color: '#475569' }}>{item.primarySource}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {item.count}
                  </td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>
                    {item.percentage.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: item.cumulativePercentage <= 80 ? '#0284c7' : '#64748b' }}>
                    {item.cumulativePercentage.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 500, color: '#0f172a' }}>
                    {item.avgResolutionTime}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
