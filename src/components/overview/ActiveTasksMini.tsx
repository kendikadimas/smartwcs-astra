import React from 'react';
import Link from 'next/link';
import { ActiveTaskMini } from '@/types/overview';
import { StatusBadge } from '@/components/ui/Badge';

interface ActiveTasksMiniProps {
  tasks: ActiveTaskMini[];
}

export function ActiveTasksMini({ tasks }: ActiveTasksMiniProps) {
  return (
    <div className="panel">
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Active Tasks</span>
        <Link href="/tasks" className="btn-link">
          4 of 12 · View all →
        </Link>
      </div>

      {/* Table */}
      <div className="panel-body" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Resource</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td style={{ fontWeight: 600 }}>{task.id}</td>
                <td style={{ color: '#475569' }}>{task.type}</td>
                <td style={{ color: '#475569' }}>{task.source}</td>
                <td style={{ color: '#475569' }}>{task.destination}</td>
                <td>
                  <span
                    style={{
                      fontSize: '11px',
                      color: task.priority === 'High' ? '#b45309' : '#475569',
                      fontWeight: task.priority === 'High' ? 600 : 400,
                    }}
                  >
                    {task.priority}
                  </span>
                </td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
                <td
                  style={{
                    color: task.resource === 'Unassigned' ? '#94a3b8' : '#0f172a',
                    fontWeight: task.resource !== 'Unassigned' ? 500 : 400,
                  }}
                >
                  {task.resource}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
