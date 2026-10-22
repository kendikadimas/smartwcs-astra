'use client';

import React from 'react';
import { RobotResourceItem } from '@/types/equipment';
import {
  Bot,
  Battery,
  Zap,
  MapPin,
  Compass,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  ChevronRight,
  Radio,
  Play,
  RotateCw,
} from 'lucide-react';

interface RobotFleetTableProps {
  robots: RobotResourceItem[];
  onSelectRobot: (robot: RobotResourceItem) => void;
  onSendToDock: (robot: RobotResourceItem) => void;
}

export function RobotFleetTable({
  robots,
  onSelectRobot,
  onSendToDock,
}: RobotFleetTableProps) {
  if (robots.length === 0) {
    return (
      <div
        className="panel"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#64748b',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <Radio size={36} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
          No AMR resources match your filter criteria
        </div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          Try clearing your search term or changing the status filter.
        </div>
      </div>
    );
  }

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
            Active AMR / AGV Fleet
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {robots.length} units online / registered · {robots.filter((r) => r.runState === 'Working').length} working · {robots.filter((r) => r.runState === 'Idle').length} idle
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>
          PUDU Robotics Open Cloud Protocol
        </div>
      </div>

      <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', minWidth: '940px' }}>
          <thead>
            <tr>
              <th style={{ width: '18%' }}>ROBOT / IDENTIFIER</th>
              <th style={{ width: '13%' }}>TYPE &amp; MODEL</th>
              <th style={{ width: '12%' }}>OPERATIONAL STATE</th>
              <th style={{ width: '14%' }}>BATTERY &amp; CHARGING</th>
              <th style={{ width: '16%' }}>LIVE POSITION &amp; HEADING</th>
              <th style={{ width: '14%' }}>ACTIVE TASK &amp; SPEED</th>
              <th style={{ width: '13%', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {robots.map((robot) => {
              const isWorking = robot.runState === 'Working';
              const isIdle = robot.runState === 'Idle';
              const isError = robot.runState === 'Error' || !robot.online;
              const isCharging = robot.isCharging;

              // Battery status styling
              const isLowBatt = robot.battery <= 20;
              const isMediumBatt = robot.battery > 20 && robot.battery <= 50;
              const battColor = isLowBatt ? '#dc2626' : isMediumBatt ? '#d97706' : '#16a34a';

              // Run State Badge
              let stateBg = '#eff6ff';
              let stateBorder = '#bfdbfe';
              let stateColor = '#2563eb';

              if (isWorking) {
                stateBg = '#eff6ff';
                stateBorder = '#bfdbfe';
                stateColor = '#2563eb';
              } else if (isIdle) {
                stateBg = '#ecfdf5';
                stateBorder = '#a7f3d0';
                stateColor = '#059669';
              } else if (isError) {
                stateBg = '#fef2f2';
                stateBorder = '#fecaca';
                stateColor = '#dc2626';
              }

              return (
                <tr
                  key={robot.id}
                  style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                  onClick={() => onSelectRobot(robot)}
                >
                  {/* Robot Identifier & Serial Number */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: isError ? '#fee2e2' : '#f0f7ff',
                          color: isError ? '#dc2626' : '#00529C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: isError ? '1px solid #fecaca' : '1px solid #bfdbfe',
                        }}
                      >
                        <Bot size={17} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                            {robot.id}
                          </span>
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: robot.online ? '#22c55e' : '#94a3b8',
                            }}
                            title={robot.online ? 'Online' : 'Offline'}
                          />
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          {robot.serialNumber}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Robot Type & Model */}
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px' }}>
                      {robot.robotType}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {robot.vendor} · {robot.model.replace('Industrial AMR', '').replace('Delivery AMR', '')}
                    </div>
                  </td>

                  {/* Operational State (Online, runState, moveState) */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: stateBg,
                          border: `1px solid ${stateBorder}`,
                          color: stateColor,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: stateColor,
                          }}
                        />
                        {robot.runState}
                      </span>
                      <span style={{ fontSize: '10.5px', color: '#64748b', paddingLeft: '4px' }}>
                        Motion: <strong>{robot.moveState}</strong>
                      </span>
                    </div>
                  </td>

                  {/* Battery & Charging */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isCharging ? (
                            <Zap size={13} style={{ color: '#d97706' }} />
                          ) : (
                            <Battery size={13} style={{ color: battColor }} />
                          )}
                          <span style={{ fontWeight: 700, fontSize: '12px', color: battColor }}>
                            {robot.battery}%
                          </span>
                        </div>
                        {isCharging && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: '#d97706',
                              backgroundColor: '#fffbeb',
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            Charging
                          </span>
                        )}
                      </div>

                      {/* Battery Bar */}
                      <div
                        style={{
                          height: '5px',
                          borderRadius: '3px',
                          backgroundColor: '#e2e8f0',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${robot.battery}%`,
                            backgroundColor: battColor,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Live Position (x, y, yaw, lastPoseAt) */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#0f172a' }}>
                        <MapPin size={12} style={{ color: '#00529C', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          X: {robot.x.toFixed(1)}, Y: {robot.y.toFixed(1)}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>({robot.yaw}°)</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        Updated: {robot.lastPoseAt}
                      </div>
                    </div>
                  </td>

                  {/* Active Task & Speed (Calculated by WCS) */}
                  <td>
                    {robot.currentTaskId ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: '#00529C',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: '150px',
                          }}
                        >
                          {robot.currentTaskName || robot.currentTaskId}
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                          Speed: <strong>{robot.speedMps.toFixed(2)} m/s</strong> (WCS)
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                        No active task · 0.0 m/s
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {!isCharging && robot.battery < 90 && (
                        <button
                          type="button"
                          onClick={() => onSendToDock(robot)}
                          title="Dispatch AMR to nearest charging station"
                          style={{
                            padding: '5px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            color: '#b45309',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Zap size={11} />
                          Dock
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectRobot(robot)}
                        title="View telemetry & diagnostic drawer"
                        style={{
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <span>Telemetry</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
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
