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
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {events.map((ev) => (
          <div
            key={ev.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11.5px',
            }}
          >
            {/* Color Dot */}
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: ev.dotColor,
                flexShrink: 0,
              }}
            />

            {/* Timestamp */}
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '10.5px',
                color: '#64748b',
                width: '54px',
                flexShrink: 0,
              }}
            >
              {ev.time}
            </span>

            {/* Event Text */}
            <span
              style={{
                color: '#334155',
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
