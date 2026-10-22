'use client';

import React, { useState } from 'react';
import { FleetUtilizationItem } from '@/types/kpi';
import { mockFleetUtilization } from '@/data/mockKpi';
import { Bot, Battery, Zap, Clock, ShieldAlert } from 'lucide-react';

export function FleetUtilizationPanel() {
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);

  // Overall calculations
  const totalRobots = mockFleetUtilization.length;
  const avgMoving = Math.round(
    mockFleetUtilization.reduce((acc, curr) => acc + curr.movingPercent, 0) / totalRobots
  );
  const avgIdle = Math.round(
    mockFleetUtilization.reduce((acc, curr) => acc + curr.idlePercent, 0) / totalRobots
  );
  const avgCharging = Math.round(
    mockFleetUtilization.reduce((acc, curr) => acc + curr.chargingPercent, 0) / totalRobots
  );
  const avgError = Math.round(
    mockFleetUtilization.reduce((acc, curr) => acc + curr.errorPercent, 0) / totalRobots
  );

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Panel Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#f5f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed',
            }}
          >
            <Bot size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
              Fleet Time Allocation &amp; Productivity
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Status distribution derived from AMR state logs
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#15803d',
            backgroundColor: '#dcfce7',
            padding: '2px 8px',
            borderRadius: '9999px',
          }}
        >
          8/8 AMRs Active
        </span>
      </div>

      {/* Aggregate Overview Bar */}
      <div style={{ padding: '14px 18px 12px 18px', borderBottom: '1px solid #f8fafc', backgroundColor: '#fafbfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11.5px' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Fleet Aggregate Duty Cycle</span>
          <span style={{ fontWeight: 700, color: '#7c3aed' }}>{avgMoving}% Productive Run</span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div
          style={{
            height: '10px',
            width: '100%',
            backgroundColor: '#e2e8f0',
            borderRadius: '5px',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <div style={{ width: `${avgMoving}%`, backgroundColor: '#10b981' }} title={`Moving: ${avgMoving}%`} />
          <div style={{ width: `${avgCharging}%`, backgroundColor: '#38bdf8' }} title={`Charging: ${avgCharging}%`} />
          <div style={{ width: `${avgIdle}%`, backgroundColor: '#94a3b8' }} title={`Idle: ${avgIdle}%`} />
          <div style={{ width: `${avgError}%`, backgroundColor: '#ef4444' }} title={`Error: ${avgError}%`} />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Moving ({avgMoving}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
            <span>Charging ({avgCharging}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
            <span>Idle ({avgIdle}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span>Fault ({avgError}%)</span>
          </div>
        </div>
      </div>

      {/* Per-Robot Breakdown List */}
      <div
        className="panel-body"
        style={{
          padding: '10px 18px',
          flex: 1,
          overflowY: 'auto',
          maxHeight: '330px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {mockFleetUtilization.map((robot) => {
          const isSelected = selectedRobotId === robot.robotId;
          return (
            <div
              key={robot.robotId}
              onClick={() => setSelectedRobotId(isSelected ? null : robot.robotId)}
              style={{
                padding: '9px 12px',
                borderRadius: '6px',
                border: isSelected ? '1px solid #7c3aed' : '1px solid #f1f5f9',
                backgroundColor: isSelected ? '#f5f3ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{robot.robotId}</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>{robot.robotName}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
                  <span style={{ color: '#64748b' }}>
                    <strong>{robot.totalMissions}</strong> missions
                  </span>
                  <span style={{ color: '#64748b' }}>
                    <strong>{robot.mileageKm}</strong> km
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontWeight: 600,
                      color: robot.batteryStatus > 50 ? '#15803d' : '#b45309',
                    }}
                  >
                    <Battery size={12} />
                    {robot.batteryStatus}%
                  </span>
                </div>
              </div>

              {/* Proportional Mini Bar */}
              <div
                style={{
                  height: '6px',
                  width: '100%',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div style={{ width: `${robot.movingPercent}%`, backgroundColor: '#10b981' }} />
                <div style={{ width: `${robot.chargingPercent}%`, backgroundColor: '#38bdf8' }} />
                <div style={{ width: `${robot.idlePercent}%`, backgroundColor: '#cbd5e1' }} />
                <div style={{ width: `${robot.errorPercent}%`, backgroundColor: '#ef4444' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
