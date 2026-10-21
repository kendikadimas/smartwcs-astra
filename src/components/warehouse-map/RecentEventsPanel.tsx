'use client';

import React from 'react';
import Link from 'next/link';
import { RecentEvent } from '@/types/warehouseMap';

interface RecentEventsPanelProps {
  events: RecentEvent[];
}

export function RecentEventsPanel({ events }: RecentEventsPanelProps) {
  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
          Recent events
        </span>
        <Link
          href="/alarms"
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#2563eb',
            textDecoration: 'none',
          }}
        >
          View all →
        </Link>
      </div>

      {/* Events List */}
      <div
        className="panel-body"
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {events.map((ev) => (
          <div
            key={ev.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '11.5px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              borderLeft: `3px solid ${ev.dotColor}`,
              borderTop: '1px solid #f1f5f9',
              borderRight: '1px solid #f1f5f9',
              borderBottom: '1px solid #f1f5f9',
              transition: 'background-color 0.15s ease',
            }}
          >
            {/* Timestamp Badge */}
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '10.5px',
                fontWeight: 600,
                color: '#64748b',
                backgroundColor: '#ffffff',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                flexShrink: 0,
              }}
            >
              {ev.time}
            </span>

            {/* Event Text */}
            <span
              style={{
                color: '#1e293b',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {ev.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
