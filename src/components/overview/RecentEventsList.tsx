import React from 'react';
import Link from 'next/link';
import { RecentEventItem } from '@/types/overview';

interface RecentEventsListProps {
  events: RecentEventItem[];
}

export function RecentEventsList({ events }: RecentEventsListProps) {
  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Recent events</span>
        <Link href="/audit-log" className="btn-link">
          View all 48 →
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
        {events.map((evt, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              fontSize: '12px',
            }}
          >
            <span
              style={{
                color: '#64748b',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                width: '52px',
                flexShrink: 0,
              }}
            >
              {evt.time}
            </span>
            <span style={{ color: '#0f172a', lineHeight: 1.35 }}>{evt.text}</span>
          </div>
        ))}
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
        Activity log · Informational, no action required
      </div>
    </div>
  );
}
