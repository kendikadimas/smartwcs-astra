'use client';

import React from 'react';
import {
  ConveyorResource,
  LifterResource,
  TransferStationResource,
} from '@/types/equipment';
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';

interface ConveyorsTableProps {
  conveyors: ConveyorResource[];
  lifters: LifterResource[];
  transferStations: TransferStationResource[];
}

export function ConveyorsTable({
  conveyors,
  lifters,
  transferStations,
}: ConveyorsTableProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Automated Conveyors Table */}
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
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: '#fafbfc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
              Roller &amp; Belt Conveyor Lines
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              PLC Modbus / OPC UA telemetry &amp; live roller status
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {conveyors.filter((c) => c.status === 'Operating').length} / {conveyors.length} operating
          </span>
        </div>

        <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '880px' }}>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>CONVEYOR / CODE</th>
                <th style={{ width: '18%' }}>ZONE &amp; TYPE</th>
                <th style={{ width: '14%' }}>STATUS</th>
                <th style={{ width: '16%' }}>SPEED &amp; DIRECTION</th>
                <th style={{ width: '18%' }}>ACTIVE LOAD / PALLET</th>
                <th style={{ width: '12%' }}>GATEWAY IP</th>
              </tr>
            </thead>
            <tbody>
              {conveyors.map((c) => {
                const isOperating = c.status === 'Operating';
                const isReady = c.status === 'Ready';
                const isFault = c.status === 'Fault' || c.status === 'Maintenance';

                let statusBg = '#eff6ff';
                let statusColor = '#2563eb';
                if (isOperating) {
                  statusBg = '#ecfdf5';
                  statusColor = '#059669';
                } else if (isReady) {
                  statusBg = '#f8fafc';
                  statusColor = '#475569';
                } else if (isFault) {
                  statusBg = '#fef2f2';
                  statusColor = '#dc2626';
                }

                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                        {c.id} ({c.code})
                      </div>
                    </td>
                    <td>
                      <div style={{ color: '#0f172a', fontSize: '12px', fontWeight: 500 }}>
                        {c.zone}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{c.type} Conveyor</div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: statusBg,
                          color: statusColor,
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {c.direction === 'Forward' && <ArrowRight size={13} style={{ color: '#16a34a' }} />}
                        {c.direction === 'Reverse' && <ArrowLeft size={13} style={{ color: '#d97706' }} />}
                        {c.direction === 'Stopped' && <Pause size={13} style={{ color: '#94a3b8' }} />}
                        <span style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>
                          {c.speedMps.toFixed(1)} m/s
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>({c.direction})</span>
                      </div>
                    </td>
                    <td>
                      {c.activeLoad ? (
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: '#00529C',
                            backgroundColor: '#eff6ff',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {c.activeLoad}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                          Empty / Clear
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#334155' }}>
                        {c.plcGatewayIp}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{c.plcProtocol}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Vertical Pallet Lifts & Transfer Stations Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '16px',
        }}
      >
        {/* Vertical Pallet Lifts */}
        <div
          className="panel"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: '#fafbfc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                Vertical Pallet Lifts
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                AS/RS Mezzanine vertical transfer
              </div>
            </div>
          </div>

          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {lifters.map((lift) => {
              const isFault = lift.status === 'Fault';
              return (
                <div
                  key={lift.id}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-lg)',
                    border: isFault ? '1px solid #fee2e2' : '1px solid #e2e8f0',
                    backgroundColor: isFault ? '#fff5f5' : '#f8fafc',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '12.5px', color: '#0f172a' }}>
                      {lift.name}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '1px 7px',
                        borderRadius: '10px',
                        backgroundColor: isFault ? '#fef2f2' : '#ecfdf5',
                        color: isFault ? '#dc2626' : '#059669',
                      }}
                    >
                      {lift.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: '#475569' }}>
                    <div>
                      Level: <strong style={{ color: '#0f172a' }}>L{lift.levelCurrent}</strong> of L{lift.maxLevels}
                    </div>
                    <div>•</div>
                    <div>
                      Door Interlock:{' '}
                      <strong style={{ color: lift.doorInterlock === 'Tripped' ? '#dc2626' : '#16a34a' }}>
                        {lift.doorInterlock}
                      </strong>
                    </div>
                  </div>

                  {lift.activeLoad && (
                    <div style={{ fontSize: '11px', marginTop: '6px', color: isFault ? '#b91c1c' : '#64748b' }}>
                      {lift.activeLoad}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Automatic Transfer Stations */}
        <div
          className="panel"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: '#fafbfc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                Automatic Transfer Stations
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Inbound &amp; FGW transfer buffers
              </div>
            </div>
          </div>

          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {transferStations.map((ts) => (
              <div
                key={ts.id}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '12.5px', color: '#0f172a' }}>
                    {ts.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '1px 7px',
                      borderRadius: '10px',
                      backgroundColor: ts.status === 'Transferring' ? '#eff6ff' : '#ecfdf5',
                      color: ts.status === 'Transferring' ? '#2563eb' : '#059669',
                    }}
                  >
                    {ts.status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: '#475569' }}>
                  <div>
                    Optical Sensors:{' '}
                    <strong style={{ color: ts.opticalSensorsOk ? '#16a34a' : '#dc2626' }}>
                      {ts.opticalSensorsOk ? 'Clear / Active' : 'Blocked'}
                    </strong>
                  </div>
                  {ts.activePalletId && (
                    <>
                      <div>•</div>
                      <div>
                        Pallet:{' '}
                        <strong style={{ color: '#00529C', fontFamily: 'monospace' }}>
                          {ts.activePalletId}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
