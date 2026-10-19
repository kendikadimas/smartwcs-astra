'use client';

import React from 'react';
import { MapKpiSummary } from '@/types/warehouseMap';
import {
  Radar,
  QrCode,
  BatteryCharging,
  Clock,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface MapSummaryKpisProps {
  kpis: MapKpiSummary;
}

export function MapSummaryKpis({ kpis }: MapSummaryKpisProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
        width: '100%',
      }}
    >
      {/* 1. Robots Online */}
      <div
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #a7f3d0',
          }}
        >
          <Radar size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Robots Online</div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {kpis.robotsOnline.current} / {kpis.robotsOnline.total}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <div
              style={{
                flex: 1,
                height: '5px',
                backgroundColor: '#f1f5f9',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${kpis.robotsOnline.percentage}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  borderRadius: '3px',
                }}
              />
            </div>
            <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700 }}>
              {kpis.robotsOnline.percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Active Tasks */}
      <div
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #bfdbfe',
          }}
        >
          <QrCode size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Active Tasks</div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {kpis.activeTasks.total}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {kpis.activeTasks.running} running · {kpis.activeTasks.queued} queued
          </div>
        </div>
      </div>

      {/* 3. Charging */}
      <div
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#fffbeb',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #fde68a',
          }}
        >
          <BatteryCharging size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Charging</div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {kpis.charging.count}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {kpis.charging.resources}
          </div>
        </div>
      </div>

      {/* 4. Idle */}
      <div
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #a7f3d0',
          }}
        >
          <Clock size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Idle</div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {kpis.idle.count}
          </div>
          <div style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {kpis.idle.note}
          </div>
        </div>
      </div>

      {/* 5. Offline / Fault */}
      <div
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #fecaca',
          }}
        >
          <AlertTriangle size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Offline / Fault</div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#dc2626', lineHeight: 1.2 }}>
            {kpis.offlineFault.count}
          </div>
          <div style={{ fontSize: '10.5px', color: '#dc2626', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {kpis.offlineFault.resources}
          </div>
        </div>
      </div>

      {/* 6. Conveyors */}
      <div
        className="panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #a7f3d0',
          }}
        >
          <Layers size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Conveyors</div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {kpis.conveyors.current} / {kpis.conveyors.total}
          </div>
          <div style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {kpis.conveyors.statusText}
          </div>
        </div>
      </div>
    </div>
  );
}
