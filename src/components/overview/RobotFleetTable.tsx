import React from 'react';
import Link from 'next/link';
import { RobotFleetItem } from '@/types/overview';
import { StatusBadge } from '@/components/ui/Badge';

interface RobotFleetTableProps {
  fleet: RobotFleetItem[];
}

export function RobotFleetTable({ fleet }: RobotFleetTableProps) {
  return (
    <div className="panel">
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Robot fleet status</span>
        <Link href="/equipment" className="btn-link">
          View all 20 →
        </Link>
      </div>

      {/* Table */}
      <div className="panel-body" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>ID</th>
              <th style={{ width: '25%' }}>Status</th>
              <th style={{ width: '18%' }}>Task</th>
              <th style={{ width: '18%' }}>Battery</th>
              <th style={{ width: '17%' }}>Link</th>
            </tr>
          </thead>
          <tbody>
            {fleet.map((robot) => {
              const isLost = robot.link === 'Lost';
              return (
                <tr key={robot.id}>
                  <td style={{ fontWeight: 600 }}>{robot.id}</td>
                  <td>
                    <StatusBadge status={robot.status} />
                  </td>
                  <td style={{ color: robot.task === '—' ? '#94a3b8' : '#0f172a' }}>
                    {robot.task}
                  </td>
                  <td style={{ color: robot.battery <= 20 ? '#dc2626' : '#0f172a' }}>
                    {robot.battery}%
                  </td>
                  <td>
                    <span
                      style={{
                        color: isLost ? '#dc2626' : '#64748b',
                        fontWeight: isLost ? 600 : 400,
                      }}
                    >
                      {robot.link}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Fleet Count Footer */}
        <div
          style={{
            padding: '9px 14px',
            fontSize: '11px',
            color: '#64748b',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            backgroundColor: '#fafbfc',
          }}
        >
          17 online · 13 dispatch-eligible · 3 offline
        </div>
      </div>
    </div>
  );
}
