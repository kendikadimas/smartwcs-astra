import React from 'react';
import Link from 'next/link';
import { ActiveAlarmItem } from '@/types/overview';

interface ActiveAlarmsListProps {
  alarms: ActiveAlarmItem[];
}

export function ActiveAlarmsList({ alarms }: ActiveAlarmsListProps) {
  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Active alarms</span>
        <Link href="/alarms" className="btn-link">
          2 open · View all →
        </Link>
      </div>

      {/* Body List */}
      <div
        className="panel-body"
        style={{
          flex: 1,
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {alarms.map((alarm) => {
          const isCritical = alarm.severity === 'critical';
          return (
            <div
              key={alarm.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isCritical ? '#dc2626' : '#f59e0b',
                  marginTop: '5px',
                  flexShrink: 0,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{alarm.title}</span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>
                  {alarm.time} · {alarm.description}
                </span>
              </div>
            </div>
          );
        })}
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
        Investigate via owning controller · no safety override
      </div>
    </div>
  );
}
