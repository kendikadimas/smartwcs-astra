'use client';

import React from 'react';
import {
  FleetResourceItem,
  EquipmentResourceItem,
} from '@/types/dispatch';
import {
  Bot,
  Battery,
  Wifi,
  WifiOff,
  Zap,
  Layers,
  ArrowUpDown,
  Truck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface FleetAllocatorPanelProps {
  fleet: FleetResourceItem[];
  equipment: EquipmentResourceItem[];
  onSelectRobot: (robot: FleetResourceItem) => void;
  onQuickDispatchRobot: (robotId: string) => void;
}

export function FleetAllocatorPanel({
  fleet,
  equipment,
  onSelectRobot,
  onQuickDispatchRobot,
}: FleetAllocatorPanelProps) {
  const readyCount = fleet.filter((r) => r.status === 'Idle').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* AMR Fleet Readiness Allocator */}
      <div
        className="panel"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          className="panel-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 16px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Fleet Availability
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: readyCount > 0 ? '#16a34a' : '#d97706',
              backgroundColor: readyCount > 0 ? '#f0fdf4' : '#fffbeb',
              padding: '2px 7px',
              borderRadius: '10px',
            }}
          >
            {readyCount} idle &amp; assignable
          </span>
        </div>

        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {fleet.map((robot) => {
            const isIdle = robot.status === 'Idle';
            const isExecuting = robot.status === 'Executing';
            const isCharging = robot.status === 'Charging';
            const isFault = robot.status === 'Fault' || robot.status === 'Offline';

            let statusBg = '#eff6ff';
            let statusColor = '#2563eb';
            if (isIdle) {
              statusBg = '#ecfdf5';
              statusColor = '#059669';
            } else if (isCharging) {
              statusBg = '#fffbeb';
              statusColor = '#d97706';
            } else if (isFault) {
              statusBg = '#fef2f2';
              statusColor = '#dc2626';
            }

            return (
              <div
                key={robot.id}
                onClick={() => onSelectRobot(robot)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #f1f5f9',
                  backgroundColor: isIdle ? '#ffffff' : '#fafbfc',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Left: ID + Model */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: statusBg,
                      color: statusColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                      {robot.id}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      {robot.currentLocation}
                    </div>
                  </div>
                </div>

                {/* Right: Battery, Status badge, Quick dispatch button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: robot.battery <= 20 ? '#dc2626' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '2px',
                      }}
                    >
                      {robot.isCharging ? <Zap size={11} style={{ color: '#f59e0b' }} /> : <Battery size={11} />}
                      {robot.battery}%
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        color: statusColor,
                      }}
                    >
                      {robot.status}
                    </span>
                  </div>

                  {isIdle && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickDispatchRobot(robot.id);
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Dispatch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automated Equipment Telemetry Card */}
      <div
        className="panel"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          className="panel-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 16px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Equipment Link Status
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>PLC / Modbus</span>
        </div>

        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {equipment.map((eq) => {
            const isFault = eq.status === 'Fault';
            const isOperating = eq.status === 'Operating';

            return (
              <div
                key={eq.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isFault ? '#fef2f2' : '#f8fafc',
                  border: isFault ? '1px solid #fecaca' : '1px solid #f1f5f9',
                  fontSize: '11.5px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  {eq.type === 'Conveyor' && <Layers size={13} style={{ color: '#2563eb' }} />}
                  {eq.type === 'Lift' && <ArrowUpDown size={13} style={{ color: isFault ? '#dc2626' : '#2563eb' }} />}
                  {eq.type === 'Transfer Station' && <Truck size={13} style={{ color: '#16a34a' }} />}
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '11.5px' }}>{eq.name}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{eq.zone}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: isFault ? '#dc2626' : isOperating ? '#2563eb' : '#059669',
                    }}
                  >
                    {eq.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatch Engine Rule Card */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          fontSize: '11px',
          color: '#1e40af',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <HelpCircle size={13} />
          <span>Auto-Dispatching Policy</span>
        </div>
        <p style={{ margin: 0, color: '#1d4ed8', lineHeight: 1.4 }}>
          Tasks evaluated every 10s. Higher priority (High &gt; Normal) allocated first; candidate robot must have battery &gt; 20% and capacity matching payload.
        </p>
      </div>
    </div>
  );
}
