'use client';

import React from 'react';
import { ChargingStationResource } from '@/types/equipment';
import {
  Zap,
  BatteryCharging,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ChargingStationsPanelProps {
  stations: ChargingStationResource[];
}

export function ChargingStationsPanel({ stations }: ChargingStationsPanelProps) {
  return (
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
      {/* Panel Header Inside Card */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Automatic Charging Stations
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {stations.length} charging hubs · {stations.reduce((acc, s) => acc + s.dockCount, 0)} total docking bays
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>
          Autonomous PUDU Fast-Charging Protocol
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {stations.map((st) => {
            const availableDocks = st.dockCount - st.occupiedCount;
            const isFull = availableDocks === 0;

            return (
              <div
                key={st.id}
                className="panel"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: '#fafbfc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {st.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '1px' }}>
                      {st.code} · {st.zone}
                    </div>
                  </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: isFull ? '#fee2e2' : '#ecfdf5',
                  color: isFull ? '#dc2626' : '#059669',
                  border: isFull ? '1px solid #fecaca' : '1px solid #a7f3d0',
                }}
              >
                {availableDocks} / {st.dockCount} Docks Available
              </span>
            </div>

            {/* Power & Electrical Specs */}
            <div
              style={{
                padding: '12px 18px',
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #f1f5f9',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ padding: '6px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Total Power</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {st.powerKw} kW
                </div>
              </div>
              <div style={{ padding: '6px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Voltage</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {st.voltageV} V
                </div>
              </div>
              <div style={{ padding: '6px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Max Current</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {st.currentA} A
                </div>
              </div>
            </div>

            {/* Docked Robots Status */}
            <div style={{ padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Docked AMR Status ({st.dockedRobots.length} connected):
              </div>

              {st.dockedRobots.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    fontSize: '11.5px',
                  }}
                >
                  All docks idle &amp; ready for automatic docking
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {st.dockedRobots.map((dock) => (
                    <div
                      key={dock.robotId}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bot size={15} style={{ color: '#d97706' }} />
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>
                          {dock.robotId}
                        </span>
                        <span style={{ fontSize: '11px', color: '#b45309' }}>
                          Stage: <strong>{dock.chargeStage}</strong>
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#d97706' }}>
                          {dock.battery}%
                        </div>
                        <div style={{ fontSize: '10px', color: '#92400e' }}>
                          {dock.chargingSince}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
        </div>
      </div>
    </div>
  );
}
