'use client';

import React from 'react';
import Link from 'next/link';
import { RobotFleetItem } from '@/types/overview';
import { Bot, Wifi, WifiOff, MoreHorizontal } from 'lucide-react';

interface RobotFleetTableProps {
  fleet: RobotFleetItem[];
}

export function RobotFleetTable({ fleet }: RobotFleetTableProps) {
  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} style={{ color: '#2563eb' }} />
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Robot fleet status
          </span>
        </div>
        <Link
          href="/equipment"
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#2563eb',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          View all 20 →
        </Link>
      </div>

      {/* Table */}
      <div className="panel-body" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', minWidth: '320px' }}>
          <thead>
            <tr>
              <th style={{ width: '20%', padding: '8px 6px 8px 14px' }}>ID</th>
              <th style={{ width: '22%', padding: '8px 4px' }}>STATUS</th>
              <th style={{ width: '15%', padding: '8px 4px' }}>TASK</th>
              <th style={{ width: '16%', padding: '8px 4px' }}>BATTERY</th>
              <th style={{ width: '20%', padding: '8px 4px' }}>LINK</th>
              <th style={{ width: '7%', padding: '8px 12px 8px 2px', textAlign: 'center' }}>•••</th>
            </tr>
          </thead>
          <tbody>
            {fleet.map((robot) => {
              const isLost = robot.link === 'Lost';
              const isLowBatt = robot.battery <= 20;

              // Custom badge styling matching reference image
              let badgeBg = '#eff6ff';
              let badgeBorder = '#bfdbfe';
              let badgeColor = '#2563eb';
              let dotColor = '#2563eb';

              if (robot.status === 'Idle') {
                badgeBg = '#ecfdf5';
                badgeBorder = '#a7f3d0';
                badgeColor = '#059669';
                dotColor = '#10b981';
              } else if (robot.status === 'Charging') {
                badgeBg = '#fffbeb';
                badgeBorder = '#fde68a';
                badgeColor = '#d97706';
                dotColor = '#f59e0b';
              } else if (robot.status === 'Offline') {
                badgeBg = '#f1f5f9';
                badgeBorder = '#e2e8f0';
                badgeColor = '#64748b';
                dotColor = '#94a3b8';
              }

              return (
                <tr key={robot.id}>
                  <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '11.5px', padding: '7px 6px 7px 14px' }}>
                    {robot.id}
                  </td>
                  <td style={{ padding: '7px 4px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '12px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        color: badgeColor,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: dotColor,
                        }}
                      />
                      {robot.status}
                    </span>
                  </td>
                  <td style={{ color: robot.task === '—' ? '#94a3b8' : '#0f172a', fontSize: '11.5px', fontWeight: robot.task === '—' ? 400 : 500, padding: '7px 4px' }}>
                    {robot.task}
                  </td>
                  <td
                    style={{
                      color: isLowBatt ? '#dc2626' : '#0f172a',
                      fontWeight: isLowBatt ? 700 : 500,
                      fontSize: '11.5px',
                      padding: '7px 4px',
                    }}
                  >
                    {robot.battery}%
                  </td>
                  <td style={{ padding: '7px 4px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: isLost ? '#dc2626' : '#64748b',
                        fontWeight: isLost ? 700 : 500,
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isLost ? (
                        <WifiOff size={12} style={{ color: '#ef4444' }} />
                      ) : (
                        <Wifi size={12} style={{ color: '#10b981' }} />
                      )}
                      {robot.link}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '7px 12px 7px 2px' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                      title="More actions"
                      aria-label="More actions"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Fleet Count Footer */}
        <div
          style={{
            padding: '8px 14px',
            fontSize: '11px',
            color: '#64748b',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            marginTop: 'auto',
          }}
        >
          17 online · 13 dispatch-eligible · 3 offline
        </div>
      </div>
    </div>
  );
}
