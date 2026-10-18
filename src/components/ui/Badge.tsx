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
      <span className="badge-dot" />
      <span>{status}</span>
    </span>
  );
}

interface PriorityBadgeProps {
  priority: TaskPriority | string;
  className?: string;
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const norm = priority.toLowerCase();
  let variantClass = 'badge-prio-normal';

  if (norm === 'high') {
    variantClass = 'badge-prio-high';
  } else if (norm === 'medium') {
    variantClass = 'badge-prio-medium';
  } else if (norm === 'normal') {
    variantClass = 'badge-prio-normal';
  } else if (norm === 'low') {
    variantClass = 'badge-prio-low';
  }

  return (
    <span className={`badge ${variantClass} ${className}`}>
      {priority}
    </span>
  );
}
