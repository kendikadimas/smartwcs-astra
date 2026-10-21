'use client';

import React from 'react';
import { DispatchMission } from '@/types/dispatch';
import {
  ArrowRight,
  Battery,
  Bot,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  ChevronRight,
  Play,
  RotateCcw,
  Ban,
  Radio,
} from 'lucide-react';
import { PriorityBadge } from '@/components/ui/Badge';

interface DispatchTableProps {
  missions: DispatchMission[];
  onSelectMission: (mission: DispatchMission) => void;
  onOpenAbortModal: (mission: DispatchMission) => void;
  onQuickAssign: (mission: DispatchMission) => void;
}

export function DispatchTable({
  missions,
  onSelectMission,
  onOpenAbortModal,
  onQuickAssign,
}: DispatchTableProps) {
  if (missions.length === 0) {
    return (
      <div
        className="panel"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#64748b',
          backgroundColor: '#ffffff',
        }}
      >
        <Radio size={36} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
          No dispatch missions match your filter
        </div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          Try selecting a different status filter or clearing your search term.
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
      <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ width: '14%' }}>MISSION / TASK</th>
              <th style={{ width: '9%' }}>TYPE</th>
              <th style={{ width: '20%' }}>ROUTE &amp; WAYPOINT</th>
              <th style={{ width: '16%' }}>ASSIGNED RESOURCE</th>
              <th style={{ width: '9%' }}>PRIORITY</th>
              <th style={{ width: '18%' }}>PROGRESS &amp; STATUS</th>
              <th style={{ width: '9%' }}>ETA / ELAPSED</th>
              <th style={{ width: '5%', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => {
              const isExecuting = mission.dispatchStatus === 'Executing';
              const isDelayed = mission.dispatchStatus === 'Delayed';
              const isQueued = mission.dispatchStatus === 'Queued';
              const isCompleted = mission.dispatchStatus === 'Completed';
              const isDispatched = mission.dispatchStatus === 'Dispatched';

              // Status Badge styles
              let badgeBg = '#eff6ff';
              let badgeBorder = '#bfdbfe';
              let badgeColor = '#2563eb';

              if (isExecuting) {
                badgeBg = '#eff6ff';
                badgeBorder = '#bfdbfe';
                badgeColor = '#2563eb';
              } else if (isDelayed) {
                badgeBg = '#fef2f2';
                badgeBorder = '#fecaca';
                badgeColor = '#dc2626';
              } else if (isQueued) {
                badgeBg = '#fffbeb';
                badgeBorder = '#fde68a';
                badgeColor = '#d97706';
              } else if (isCompleted) {
                badgeBg = '#ecfdf5';
                badgeBorder = '#a7f3d0';
                badgeColor = '#059669';
              } else if (isDispatched) {
                badgeBg = '#f5f3ff';
                badgeBorder = '#ddd6fe';
                badgeColor = '#7c3aed';
              }

              // Battery Color
              const batt = mission.currentBattery;
              const isLowBatt = batt > 0 && batt <= 20;
              const battColor = isLowBatt ? '#dc2626' : batt <= 40 ? '#d97706' : '#16a34a';

              return (
                <tr
                  key={mission.id}
                  style={{
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onClick={() => onSelectMission(mission)}
                >
                  {/* Column 1: Mission ID + Task ID */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '12.5px' }}>
                        {mission.id}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        Task: {mission.taskId}
                      </span>
                    </div>
                  </td>

                  {/* Column 2: Type */}
                  <td>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#334155',
                        backgroundColor: '#f1f5f9',
                        padding: '2px 7px',
                        borderRadius: '4px',
                      }}
                    >
                      {mission.taskType}
                    </span>
                  </td>

                  {/* Column 3: Origin -> Destination & Current Waypoint */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{mission.origin}</span>
                        <ArrowRight size={12} style={{ color: '#94a3b8' }} />
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{mission.destination}</span>
                      </div>
                      <div
                        style={{
                          fontSize: '10.5px',
                          color: isDelayed ? '#dc2626' : '#64748b',
                          fontWeight: isDelayed ? 600 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isDelayed && <AlertTriangle size={11} />}
                        <span>{mission.currentWaypoint}</span>
                      </div>
                    </div>
                  </td>

                  {/* Column 4: Assigned Resource + Battery */}
                  <td>
                    {mission.assignedResource === 'Unassigned' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            fontStyle: 'italic',
                            border: '1px dashed #cbd5e1',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          Unassigned
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickAssign(mission);
                          }}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#2563eb',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '4px',
                            padding: '2px 7px',
                            cursor: 'pointer',
                          }}
                        >
                          Assign
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Bot size={13} style={{ color: '#2563eb' }} />
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '12px' }}>
                            {mission.assignedResource}
                          </span>
                        </div>
                        {mission.resourceType === 'AMR' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px' }}>
                            <span style={{ color: battColor, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Battery size={11} /> {batt}%
                            </span>
                            <span style={{ color: '#cbd5e1' }}>/</span>
                            <span style={{ color: '#64748b' }}>{mission.speedMps} m/s</span>
                          </div>
                        )}
                        {mission.resourceType === 'Conveyor' && (
                          <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 500 }}>
                            PLC Sync Active
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Column 5: Priority */}
                  <td>
                    <PriorityBadge priority={mission.priority} />
                  </td>

                  {/* Column 6: Progress Bar & Status */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            backgroundColor: badgeBg,
                            border: `1px solid ${badgeBorder}`,
                            color: badgeColor,
                          }}
                        >
                          {mission.dispatchStatus}
                        </span>

                        <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569' }}>
                          {mission.progressPercent}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div
                        style={{
                          height: '5px',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${mission.progressPercent}%`,
                            backgroundColor: isDelayed ? '#ef4444' : isCompleted ? '#10b981' : '#2563eb',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>

                      <span
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '170px',
                        }}
                      >
                        Step {mission.stepCurrent}/{mission.stepTotal}: {mission.stepDescription}
                      </span>
                    </div>
                  </td>

                  {/* Column 7: ETA / Elapsed */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a' }}>
                        {isCompleted ? 'Done' : mission.estimatedCompletion}
                      </span>
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {mission.elapsed}
                      </span>
                    </div>
                  </td>

                  {/* Column 8: Actions */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {!isCompleted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAbortModal(mission);
                          }}
                          className="icon-button"
                          style={{ width: '26px', height: '26px', color: '#ef4444' }}
                          title="Abort / Reroute Mission"
                        >
                          <Ban size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMission(mission);
                        }}
                        className="icon-button"
                        style={{ width: '26px', height: '26px' }}
                        title="View Full Telemetry"
                      >
                        <ChevronRight size={13} />
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
