'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Activity,
  Gauge,
  Weight,
  Cable,
  Check,
  ChevronRight,
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !mission) return null;

  const isExecuting = mission.dispatchStatus === 'Executing';
  const isDelayed = mission.dispatchStatus === 'Delayed';
  const isCompleted = mission.dispatchStatus === 'Completed';
  const isQueued = mission.dispatchStatus === 'Queued';

  // 5 Lifecycle Steps per PRD
  const lifecycleSteps = [
    {
      step: 1,
      title: 'Queued',
      desc: 'Task registered into dispatch pool',
      time: '10:24:00 WIB',
      done: true,
      active: false,
    },
    {
      step: 2,
      title: 'Resource Matched',
      desc:
        mission.assignedResource !== 'Unassigned'
          ? `Allocated to ${mission.assignedResource}`
          : 'Awaiting eligible idle AMR',
      time: '10:24:08 WIB',
      done: mission.assignedResource !== 'Unassigned',
      active: isQueued && mission.assignedResource !== 'Unassigned',
    },
    {
      step: 3,
      title: 'Dispatched',
      desc: `Route package sent via ${mission.adapterChannel.split('/')[0].trim()}`,
      time: '10:24:15 WIB',
      done: !isQueued && mission.dispatchStatus !== 'Assigning',
      active: mission.dispatchStatus === 'Dispatched',
    },
    {
      step: 4,
      title: 'In Execution',
      desc: `In transit (${mission.progressPercent}% completed) · ${mission.stepDescription}`,
      time: 'In Progress',
      done: isExecuting || isCompleted || isDelayed,
      active: isExecuting || isDelayed,
    },
    {
      step: 5,
      title: 'Completed',
      desc: isCompleted ? 'Handover verified and load placed' : 'Pending drop-off confirmation',
      time: isCompleted ? '10:27:00 WIB' : 'Estimated ~2m',
      done: isCompleted,
      active: false,
    },
  ];

  let statusBg = '#eff6ff';
  let statusBorder = '#bfdbfe';
  let statusColor = '#2563eb';

  if (isDelayed) {
    statusBg = '#fef2f2';
    statusBorder = '#fecaca';
    statusColor = '#dc2626';
  } else if (isCompleted) {
    statusBg = '#ecfdf5';
    statusBorder = '#a7f3d0';
    statusColor = '#059669';
  } else if (isQueued) {
    statusBg = '#fffbeb';
    statusBorder = '#fde68a';
    statusColor = '#d97706';
  }

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div
        id="dispatch-drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 1050,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Slide-over Aside Panel */}
      <aside
        id="dispatch-detail-drawer"
        role="dialog"
        aria-label="Mission Dispatch Telemetry"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '560px',
          maxWidth: '92vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 28px rgba(15, 23, 42, 0.2)',
          zIndex: 1060,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* =========================================================
            1. STICKY HEADER (Fixed at top when scrolling content)
        ========================================================= */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  backgroundColor: '#00529C',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {mission.id}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: statusBg,
                  color: statusColor,
                  border: `1px solid ${statusBorder}`,
                }}
              >
                {mission.dispatchStatus}
              </span>

              <PriorityBadge priority={mission.priority} />
            </div>

            <div style={{ fontSize: '12px', color: '#475569' }}>
              Task Reference: <strong style={{ color: '#0f172a' }}>{mission.taskId}</strong> &bull; {mission.taskType}
            </div>
          </div>

          <button
            type="button"
            id="btn-close-dispatch-drawer"
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* =========================================================
            2. SCROLLABLE BODY (Scrolls cleanly between header & footer)
        ========================================================= */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Route & Waypoint Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                {/* Origin */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: '#eff6ff',
                      color: '#00529C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MapPin size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Origin
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {mission.origin}
                    </div>
                  </div>
                </div>

                <ArrowRight size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />

                {/* Destination */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Destination
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {mission.destination}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={15} />
                  </div>
                </div>
              </div>

              {/* Waypoint Subtext */}
              <div
                style={{
                  paddingTop: '8px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                }}
              >
                <span style={{ color: '#64748b' }}>
                  Current Waypoint: <strong style={{ color: '#0f172a' }}>{mission.currentWaypoint}</strong>
                </span>
                <span style={{ color: isDelayed ? '#dc2626' : '#2563eb', fontWeight: 600 }}>
                  {isDelayed ? 'Delayed at Intersection' : `${mission.progressPercent}% in transit`}
                </span>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  height: '6px',
                  backgroundColor: '#e2e8f0',
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
            </div>

            {/* 5-Stage Lifecycle Execution Stepper */}
            <div>
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                Execution Lifecycle Progress
              </h3>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {lifecycleSteps.map((step, idx) => (
                  <div
                    key={step.title}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      position: 'relative',
                    }}
                  >
                    {/* Step Icon / Number */}
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: step.done
                          ? '#00529C'
                          : step.active
                          ? '#eff6ff'
                          : '#f1f5f9',
                        color: step.done ? '#ffffff' : step.active ? '#00529C' : '#94a3b8',
                        border: step.active ? '2px solid #00529C' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0,
                        zIndex: 2,
                      }}
                    >
                      {step.done ? <Check size={12} /> : step.step}
                    </div>

                    {/* Connecting Vertical Line */}
                    {idx < lifecycleSteps.length - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '22px',
                          bottom: '-14px',
                          width: '2px',
                          backgroundColor: step.done ? '#00529C' : '#e2e8f0',
                          zIndex: 1,
                        }}
                      />
                    )}

                    {/* Step Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '12.5px',
                            fontWeight: step.active || step.done ? 700 : 500,
                            color: step.done || step.active ? '#0f172a' : '#94a3b8',
                          }}
                        >
                          {step.title}
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>{step.time}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mission Telemetry & Specs (6 Clean Grid Tiles) */}
            <div>
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                Telemetry &amp; Resource Metrics
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '10px',
                }}
              >
                {/* Tile 1: Assigned Resource */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '10.5px', fontWeight: 600 }}>
                    <Bot size={13} style={{ color: '#00529C' }} />
                    <span>ASSIGNED RESOURCE</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {mission.assignedResource}
                    </span>
                    <Link
                      href="/equipment"
                      style={{
                        fontSize: '11px',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Fleet &rarr;
                    </Link>
                  </div>
                </div>

                {/* Tile 2: Battery & Speed */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '10.5px', fontWeight: 600 }}>
                    <Battery size={13} style={{ color: mission.currentBattery <= 20 ? '#dc2626' : '#16a34a' }} />
                    <span>BATTERY &amp; SPEED</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {mission.currentBattery}%
                    </span>
                    <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                      {mission.speedMps} m/s
                    </span>
                  </div>
                </div>

                {/* Tile 3: Payload Container */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '10.5px', fontWeight: 600 }}>
                    <Package size={13} style={{ color: '#d97706' }} />
                    <span>CONTAINER ID</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '4px', fontFamily: 'var(--font-mono, monospace)' }}>
                    {mission.payloadId}
                  </div>
                </div>

                {/* Tile 4: Payload Weight */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '10.5px', fontWeight: 600 }}>
                    <Weight size={13} style={{ color: '#64748b' }} />
                    <span>PAYLOAD LOAD</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                    {mission.payloadWeightKg} kg
                  </div>
                </div>

                {/* Tile 5: Elapsed / ETA */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '10.5px', fontWeight: 600 }}>
                    <Clock size={13} style={{ color: '#2563eb' }} />
                    <span>ELAPSED TIME</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {mission.elapsed}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                      ETA: {mission.estimatedCompletion}
                    </span>
                  </div>
                </div>

                {/* Tile 6: Adapter Channel */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '10.5px', fontWeight: 600 }}>
                    <Cable size={13} style={{ color: '#7c3aed' }} />
                    <span>ADAPTER CHANNEL</span>
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#2563eb', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {mission.adapterChannel}
                  </div>
                </div>
              </div>
            </div>

            {/* Waypoint Stop Sequence (PuduTaskStop alignment) */}
            {mission.stops && mission.stops.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  Waypoint Stop Sequence (PuduTaskStop)
                </h3>

                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  {mission.stops.map((stop, index) => {
                    const isArrived = stop.status === 'Arrived' || stop.status === 'Departed';
                    const isHeading = stop.status === 'Heading';

                    return (
                      <div
                        key={stop.seq}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderBottom: index < (mission.stops?.length || 0) - 1 ? '1px solid #f1f5f9' : 'none',
                          backgroundColor: isHeading ? '#eff6ff' : '#ffffff',
                          fontSize: '11.5px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              backgroundColor: isArrived ? '#00529C' : isHeading ? '#2563eb' : '#e2e8f0',
                              color: isArrived || isHeading ? '#ffffff' : '#64748b',
                              fontSize: '10.5px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                            }}
                          >
                            {stop.seq}
                          </span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {stop.pointName}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {stop.arrivedAt && (
                            <span style={{ color: '#64748b', fontSize: '11px' }}>
                              {stop.arrivedAt}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: isArrived ? '#16a34a' : isHeading ? '#2563eb' : '#94a3b8',
                              backgroundColor: isArrived ? '#f0fdf4' : isHeading ? '#eff6ff' : '#f8fafc',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: `1px solid ${isArrived ? '#bbf7d0' : isHeading ? '#bfdbfe' : '#e2e8f0'}`,
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

            {/* Vendor Diagnostics Box */}
            {(mission.externalMissionId || mission.robotResponseCode || mission.overrideReason) && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#334155' }}>Adapter Telemetry Diagnostics</div>
                {mission.externalMissionId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Vendor Mission ID:</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono, monospace)' }}>
                      {mission.externalMissionId}
                    </strong>
                  </div>
                )}
                {mission.robotResponseCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Robot Response:</span>
                    <strong style={{ color: '#16a34a' }}>{mission.robotResponseCode}</strong>
                  </div>
                )}
                {mission.overrideReason && (
                  <div style={{ color: '#b45309', backgroundColor: '#fffbeb', padding: '6px 8px', borderRadius: '4px', marginTop: '2px' }}>
                    <strong>Manual Override:</strong> {mission.overrideReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            3. STICKY FOOTER ACTIONS (Always visible and anchored at bottom)
        ========================================================= */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600 }}
          >
            Close
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/warehouse-map"
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Maximize2 size={13} />
              <span>Track in Map</span>
            </Link>

            {!isCompleted && (
              <button
                type="button"
                onClick={() => onOpenAbortModal(mission)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Ban size={13} />
                <span>Abort / Reassign</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );

  return createPortal(drawerContent, document.body);
}
