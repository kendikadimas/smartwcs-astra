import React from 'react';
import { TaskDisplayStatus, TaskPriority } from '@/types/task';
import { RobotStatus } from '@/types/overview';

interface StatusBadgeProps {
  status: TaskDisplayStatus | RobotStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const norm = status.toLowerCase();
  let variantClass = 'badge-status-assigned';

  if (norm === 'running' || norm === 'executing') {
    variantClass = 'badge-status-running';
  } else if (norm === 'delayed') {
    variantClass = 'badge-status-delayed';
  } else if (norm === 'queued') {
    variantClass = 'badge-status-queued';
  } else if (norm === 'completed') {
    variantClass = 'badge-status-completed';
  } else if (norm === 'failed') {
    variantClass = 'badge-status-failed';
  } else if (norm === 'idle') {
    variantClass = 'badge-status-idle';
  } else if (norm === 'charging') {
    variantClass = 'badge-status-charging';
  } else if (norm === 'offline') {
    variantClass = 'badge-status-offline';
  }

  return (
    <span className={`badge ${variantClass} ${className}`}>
      <span>{status}</span>
    </span>
  );
}

interface PriorityBadgeProps {
  priority: TaskPriority | string;
  className?: string;
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const norm = (priority || '').toLowerCase();

  let activeColor = '#2563eb';
  let bg = '#eff6ff';
  let border = '#bfdbfe';
  let activeBars = 1;

  if (norm === 'high' || norm === 'critical') {
    activeColor = '#dc2626';
    bg = '#fef2f2';
    border = '#fecaca';
    activeBars = 3;
  } else if (norm === 'medium') {
    activeColor = '#d97706';
    bg = '#fffbeb';
    border = '#fde68a';
    activeBars = 2;
  } else if (norm === 'low') {
    activeColor = '#64748b';
    bg = '#f8fafc';
    border = '#e2e8f0';
    activeBars = 1;
  }

  const inactiveColor = '#cbd5e1';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5.5px',
        padding: '2.5px 7.5px',
        borderRadius: '5px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {/* 3-Tier Signal Bars */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'flex-end',
          gap: '1.5px',
          height: '10px',
        }}
        aria-hidden="true"
      >
        <span
          style={{
            width: '2.5px',
            height: '4px',
            borderRadius: '1px',
            backgroundColor: activeBars >= 1 ? activeColor : inactiveColor,
          }}
        />
        <span
          style={{
            width: '2.5px',
            height: '7px',
            borderRadius: '1px',
            backgroundColor: activeBars >= 2 ? activeColor : inactiveColor,
          }}
        />
        <span
          style={{
            width: '2.5px',
            height: '10px',
            borderRadius: '1px',
            backgroundColor: activeBars >= 3 ? activeColor : inactiveColor,
          }}
        />
      </span>

      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: activeColor,
          lineHeight: 1,
        }}
      >
        {priority}
      </span>
    </span>
  );
}
