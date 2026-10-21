'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  PackageCheck,
  Package,
  ArrowDownToLine,
  ArrowRight,
} from 'lucide-react';
import { PriorityBadge } from '@/components/ui/Badge';
import { ActiveTaskMini } from '@/types/overview';

interface ActiveTasksMiniProps {
  tasks?: ActiveTaskMini[];
}

export function ActiveTasksMini({ tasks }: ActiveTasksMiniProps) {
  const mockTasks = [
    {
      id: 'T-001',
      type: 'Transport',
      icon: Truck,
      source: 'RMW-A01',
      destination: 'ASSY-02',
      priority: 'High',
      status: 'Executing',
      resource: 'AMR-02',
      eta: '2 min',
      etaType: 'normal',
    },
    {
      id: 'T-005',
      type: 'Delivery',
      icon: PackageCheck,
      source: 'ASSY-03',
      destination: 'FGW-01',
      priority: 'High',
      status: 'Delayed',
      resource: 'AMR-04',
      eta: '+8 min',
      etaType: 'delayed',
    },
    {
      id: 'T-003',
      type: 'Delivery',
      icon: Package,
      source: 'ASSY-01',
      destination: 'FGW-01',
      priority: 'Medium',
      status: 'Queued',
      resource: 'Unassigned',
      eta: '+6 min',
      etaType: 'queued',
    },
    {
      id: 'T-006',
      type: 'Pickup',
      icon: ArrowDownToLine,
      source: 'RMW-A03',
      destination: 'ASSY-01',
      priority: 'Normal',
      status: 'Executing',
      resource: 'PUDU-01',
      eta: '1 min',
      etaType: 'normal',
    },
  ];

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
        <div>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Active Tasks
          </span>
        </div>
        <Link
          href="/tasks"
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#2563eb',
            textDecoration: 'none',
          }}
        >
          4 of 12 · View all →
        </Link>
      </div>

      {/* Table */}
      <div className="panel-body" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', minWidth: '520px' }}>
          <thead>
            <tr>
              <th style={{ width: '13%', padding: '8px 4px 8px 16px' }}>ID</th>
              <th style={{ width: '16%', padding: '8px 4px' }}>TYPE</th>
              <th style={{ width: '13%', padding: '8px 2px' }}>SOURCE</th>
              <th style={{ width: '3%', padding: '8px 0' }}></th>
              <th style={{ width: '13%', padding: '8px 2px' }}>DESTINATION</th>
              <th style={{ width: '12%', padding: '8px 4px' }}>PRIORITY</th>
              <th style={{ width: '14%', padding: '8px 4px' }}>STATUS</th>
              <th style={{ width: '11%', padding: '8px 4px' }}>RESOURCE</th>
              <th style={{ width: '8%', padding: '8px 16px 8px 4px', textAlign: 'right' }}>ETA</th>
            </tr>
          </thead>
          <tbody>
            {mockTasks.map((t) => {
              const Icon = t.icon;

              // Status Badge Styles
              let statBg = '#eff6ff';
              let statColor = '#2563eb';
              let statBorder = '#bfdbfe';
              let statDot = '#2563eb';

              if (t.status === 'Delayed') {
                statBg = '#fef2f2';
                statColor = '#dc2626';
                statBorder = '#fecaca';
                statDot = '#dc2626';
              } else if (t.status === 'Queued') {
                statBg = '#fffbeb';
                statColor = '#d97706';
                statBorder = '#fde68a';
                statDot = '#d97706';
              }

              return (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '11.5px', padding: '7px 4px 7px 16px' }}>
                    {t.id}
                  </td>
                  <td style={{ padding: '7px 4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#475569', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                      <Icon size={13} style={{ color: '#64748b' }} />
                      {t.type}
                    </span>
                  </td>
                  <td style={{ color: '#475569', fontSize: '11.5px', padding: '7px 2px', whiteSpace: 'nowrap' }}>{t.source}</td>
                  <td style={{ textAlign: 'center', padding: '7px 0' }}>
                    <ArrowRight size={11} style={{ color: '#f59e0b' }} />
                  </td>
                  <td style={{ color: '#475569', fontSize: '11.5px', padding: '7px 2px', whiteSpace: 'nowrap' }}>{t.destination}</td>
                  <td style={{ padding: '7px 4px' }}>
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td style={{ padding: '7px 4px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2.5px 8px',
                        borderRadius: '12px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor: statBg,
                        border: `1px solid ${statBorder}`,
                        color: statColor,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td
                    style={{
                      color: t.resource === 'Unassigned' ? '#94a3b8' : '#0f172a',
                      fontWeight: t.resource === 'Unassigned' ? 400 : 500,
                      fontSize: '11.5px',
                      padding: '7px 4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.resource}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontSize: '11.5px',
                      fontWeight: t.etaType !== 'normal' ? 700 : 500,
                      color:
                        t.etaType === 'delayed'
                          ? '#dc2626'
                          : t.etaType === 'queued'
                          ? '#d97706'
                          : '#475569',
                      padding: '7px 16px 7px 4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.eta}
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
