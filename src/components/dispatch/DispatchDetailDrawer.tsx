'use client';

import React from 'react';
import Link from 'next/link';
import { DispatchMission } from '@/types/dispatch';
import {
  X,
  Send,
  Bot,
  MapPin,
  Clock,
  Battery,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Maximize2,
  Ban,
  RotateCw,
} from 'lucide-react';
import { PriorityBadge } from '@/components/ui/Badge';

interface DispatchDetailDrawerProps {
  mission: DispatchMission | null;
  onClose: () => void;
  onOpenAbortModal: (mission: DispatchMission) => void;
}

export function DispatchDetailDrawer({
  mission,
  onClose,
  onOpenAbortModal,
}: DispatchDetailDrawerProps) {
  if (!mission) return null;

  const isExecuting = mission.dispatchStatus === 'Executing';
  const isDelayed = mission.dispatchStatus === 'Delayed';
  const isCompleted = mission.dispatchStatus === 'Completed';

  // 5 Lifecycle Steps
  const lifecycleSteps = [
    { title: 'Queued', sub: 'Task submitted to pool', done: true },
    { title: 'Resource Matched', sub: mission.assignedResource !== 'Unassigned' ? `Assigned ${mission.assignedResource}` : 'Pending allocation', done: mission.assignedResource !== 'Unassigned' },
    { title: 'Dispatched', sub: `Sent via ${mission.adapterChannel.split('/')[0]}`, done: mission.dispatchStatus !== 'Queued' && mission.dispatchStatus !== 'Assigning' },
    { title: 'In Execution', sub: `Progress ${mission.progressPercent}%`, done: isExecuting || isCompleted || isDelayed, active: isExecuting },
    { title: 'Completed', sub: isCompleted ? 'Handover verified' : 'Pending drop-off', done: isCompleted },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(2px)',
        zIndex: 55,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 25px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {mission.id}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: isDelayed ? '#fef2f2' : isCompleted ? '#ecfdf5' : '#eff6ff',
                  color: isDelayed ? '#dc2626' : isCompleted ? '#059669' : '#2563eb',
                  border: `1px solid ${isDelayed ? '#fecaca' : isCompleted ? '#a7f3d0' : '#bfdbfe'}`,
                }}
              >
                {mission.dispatchStatus}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
              Task Reference: <strong>{mission.taskId}</strong> ({mission.taskType})
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-button"
            style={{ width: '30px', height: '30px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Section 1: Route Banner */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} style={{ color: '#2563eb' }} />
              <div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>ORIGIN</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{mission.origin}</div>
              </div>
            </div>

            <ArrowRight size={14} style={{ color: '#94a3b8' }} />

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>DESTINATION</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{mission.destination}</div>
            </div>
          </div>

          {/* Section 2: 5-Stage Lifecycle Progress Tracker */}
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Execution Lifecycle Progress
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px' }}>
              {lifecycleSteps.map((step, idx) => (
                <div key={step.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', position: 'relative' }}>
                  {/* Step Dot */}
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: step.done ? '#2563eb' : '#f1f5f9',
                      color: step.done ? '#ffffff' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700,
                      flexShrink: 0,
                      zIndex: 2,
                    }}
                  >
                    {step.done ? <CheckCircle2 size={12} /> : idx + 1}
                  </div>

                  {/* Connecting Line */}
                  {idx < lifecycleSteps.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '9px',
                        top: '20px',
                        bottom: '-12px',
                        width: '2px',
                        backgroundColor: step.done ? '#bfdbfe' : '#e2e8f0',
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* Step Info */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: step.done ? '#0f172a' : '#94a3b8' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {step.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Telemetry & Payload Specs */}
          <div
            style={{
              border: '1px solid #f1f5f9',
              borderRadius: '8px',
              padding: '14px',
              backgroundColor: '#fafbfc',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
              Mission Telemetry &amp; Specs
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Assigned Resource:</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{mission.assignedResource}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Resource Battery:</span>
                <div style={{ fontWeight: 600, color: mission.currentBattery <= 20 ? '#dc2626' : '#16a34a' }}>
                  {mission.currentBattery}% ({mission.speedMps} m/s)
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Payload Container:</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{mission.payloadId}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Payload Weight:</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{mission.payloadWeightKg} kg</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Elapsed Time:</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{mission.elapsed}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Adapter Channel:</span>
                <div style={{ fontWeight: 600, color: '#2563eb' }}>{mission.adapterChannel}</div>
              </div>
              {mission.externalMissionId && (
                <div>
                  <span style={{ color: '#64748b' }}>Vendor Mission ID:</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{mission.externalMissionId}</div>
                </div>
              )}
              {mission.attempt !== undefined && (
                <div>
                  <span style={{ color: '#64748b' }}>Dispatch Attempt:</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>Attempt #{mission.attempt}</div>
                </div>
              )}
            </div>

            {/* Vendor Robot Response */}
            {mission.robotResponseCode && (
              <div
                style={{
                  marginTop: '4px',
                  padding: '8px 10px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  fontSize: '11px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Robot Response:</span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: mission.robotResponseCode.includes('WARN') ? '#fef3c7' : '#dcfce7',
                      color: mission.robotResponseCode.includes('WARN') ? '#b45309' : '#15803d',
                      fontWeight: 600,
                    }}
                  >
                    {mission.robotResponseCode}
                  </span>
                </div>
                {mission.robotResponseMessage && (
                  <div style={{ color: '#64748b' }}>{mission.robotResponseMessage}</div>
                )}
              </div>
            )}

            {/* Waypoint Stops Sequence (PuduTaskStop) */}
            {mission.stops && mission.stops.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Waypoint Stop Sequence (PuduTaskStop):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {mission.stops.map((stop) => {
                    const isArrived = stop.status === 'Arrived' || stop.status === 'Departed';
                    const isHeading = stop.status === 'Heading';

                    return (
                      <div
                        key={stop.seq}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          backgroundColor: isHeading ? '#eff6ff' : '#f8fafc',
                          border: isHeading ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: isArrived ? '#00529C' : isHeading ? '#0284c7' : '#cbd5e1',
                              color: '#ffffff',
                              fontSize: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                            }}
                          >
                            {stop.seq}
                          </span>
                          <span style={{ fontWeight: isHeading ? 600 : 500, color: '#0f172a' }}>
                            {stop.pointName}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {stop.arrivedAt && (
                            <span style={{ color: '#64748b', fontSize: '10px' }}>{stop.arrivedAt}</span>
                          )}
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: isArrived ? '#16a34a' : isHeading ? '#0284c7' : '#94a3b8',
                            }}
                          >
                            {stop.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mission.overrideReason && (
              <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#fffbeb', borderRadius: '4px', fontSize: '11px', color: '#b45309' }}>
                <strong>Note / Override:</strong> {mission.overrideReason}
              </div>
            )}
          </div>

          {/* Section 4: Quick Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
            <Link
              href="/warehouse-map"
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                textDecoration: 'none',
              }}
            >
              <Maximize2 size={13} />
              <span>Track in 2.5D Warehouse Map</span>
            </Link>

            {!isCompleted && (
              <button
                onClick={() => onOpenAbortModal(mission)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Ban size={14} />
                <span>Abort / Reassign Mission</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
