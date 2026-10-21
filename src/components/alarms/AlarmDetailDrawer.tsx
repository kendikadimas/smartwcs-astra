'use client';

import React, { useState } from 'react';
import { AlarmItem } from '@/types/alarm';
import Link from 'next/link';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Bot,
  Layers,
  Cable,
  FileText,
  ExternalLink,
  ShieldAlert,
  Terminal,
  MapPin,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

interface AlarmDetailDrawerProps {
  alarm: AlarmItem | null;
  onClose: () => void;
  onAcknowledge: (alarm: AlarmItem) => void;
  onClear: (alarm: AlarmItem) => void;
}

export function AlarmDetailDrawer({
  alarm,
  onClose,
  onAcknowledge,
  onClear,
}: AlarmDetailDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!alarm) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(alarm.rawPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        id="alarm-drawer-backdrop"
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

      {/* Drawer Panel */}
      <aside
        id="alarm-detail-drawer"
        role="dialog"
        aria-label="Alarm Investigation Details"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '560px',
          maxWidth: '92vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 24px rgba(15, 23, 42, 0.18)',
          zIndex: 1060,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  backgroundColor: '#00529C',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {alarm.id}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#475569',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {alarm.code}
              </span>
              {alarm.severity === 'CRITICAL' && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                  }}
                >
                  CRITICAL
                </span>
              )}
              {alarm.severity === 'WARNING' && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                  }}
                >
                  WARNING
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              {alarm.title}
            </h2>
          </div>

          <button
            type="button"
            id="btn-close-alarm-drawer"
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

        {/* Drawer Body - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Description Card */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor:
                  alarm.severity === 'CRITICAL'
                    ? '#fef2f2'
                    : alarm.severity === 'WARNING'
                    ? '#fffbeb'
                    : '#f0f9ff',
                border:
                  alarm.severity === 'CRITICAL'
                    ? '1px solid #fecaca'
                    : alarm.severity === 'WARNING'
                    ? '1px solid #fde68a'
                    : '1px solid #bae6fd',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <ShieldAlert
                  size={14}
                  style={{
                    color:
                      alarm.severity === 'CRITICAL'
                        ? '#dc2626'
                        : alarm.severity === 'WARNING'
                        ? '#b45309'
                        : '#0284c7',
                  }}
                />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
                  Incident Summary
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#334155', margin: 0, lineHeight: 1.5 }}>
                {alarm.description}
              </p>
            </div>

            {/* General Metadata Key-Values */}
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                Equipment & Operational Location
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Source Asset</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                      {alarm.sourceId}
                    </span>
                    <Link
                      href="/equipment"
                      style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <ExternalLink size={10} />
                      Equipment
                    </Link>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Subsystem Source</span>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                    {alarm.sourceType}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Specific Location</span>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                    📍 {alarm.sourceLocation}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Warehouse Facility</span>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                    {alarm.facility}
                  </div>
                </div>

                {alarm.taskId && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Associated Task</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#0284c7',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        {alarm.taskId}
                      </span>
                      <Link
                        href="/tasks"
                        style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        <ExternalLink size={10} />
                        Tasks
                      </Link>
                    </div>
                  </div>
                )}

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Occurred At</span>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                    {alarm.occurredAt}
                  </div>
                </div>
              </div>
            </div>

            {/* ISA-18.2 3-Stage Lifecycle Timeline */}
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                ISA-18.2 Alarm Lifecycle Audit Trail
              </h3>
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Step 1: Raised */}
                <div style={{ display: 'flex', gap: '12px', position: 'relative', paddingBottom: '16px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  >
                    1
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '11px',
                      top: '24px',
                      bottom: '0',
                      width: '2px',
                      backgroundColor: '#e2e8f0',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                      Alarm Raised by Subsystem
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {alarm.occurredAt} · Triggered by {alarm.sourceId} ({alarm.code})
                    </div>
                  </div>
                </div>

                {/* Step 2: Acknowledged */}
                <div style={{ display: 'flex', gap: '12px', position: 'relative', paddingBottom: '16px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: alarm.state !== 'ACTIVE' ? '#eff6ff' : '#f1f5f9',
                      color: alarm.state !== 'ACTIVE' ? '#2563eb' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  >
                    2
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '11px',
                      top: '24px',
                      bottom: '0',
                      width: '2px',
                      backgroundColor: '#e2e8f0',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: alarm.state !== 'ACTIVE' ? '#0f172a' : '#94a3b8',
                      }}
                    >
                      Operator Acknowledgement
                    </div>
                    {alarm.acknowledgedBy ? (
                      <div>
                        <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
                          Acknowledged by {alarm.acknowledgedBy} at {alarm.acknowledgedAt}
                        </div>
                        {alarm.acknowledgementNote && (
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: '#334155',
                              backgroundColor: '#f8fafc',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              border: '1px solid #e2e8f0',
                              marginTop: '4px',
                              fontStyle: 'italic',
                            }}
                          >
                            &ldquo;{alarm.acknowledgementNote}&rdquo;
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
                        Pending operator review (SLA timer ticking...)
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Cleared */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: alarm.state === 'CLEARED' ? '#dcfce7' : '#f1f5f9',
                      color: alarm.state === 'CLEARED' ? '#15803d' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  >
                    3
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: alarm.state === 'CLEARED' ? '#0f172a' : '#94a3b8',
                      }}
                    >
                      Resolution &amp; Clearance
                    </div>
                    {alarm.clearedBy ? (
                      <div>
                        <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                          Cleared by {alarm.clearedBy} at {alarm.clearedAt}
                        </div>
                        {alarm.clearedReason && (
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: '#334155',
                              backgroundColor: '#f0fdf4',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              border: '1px solid #bbf7d0',
                              marginTop: '4px',
                            }}
                          >
                            Resolution: {alarm.clearedReason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Asset still under investigation / active alarm condition
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Operating Procedure (SOP) Action */}
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                Recommended Maintenance SOP
              </h3>
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#166534',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                <span>{alarm.recommendedAction}</span>
              </div>
            </div>

            {/* Raw Robot / Adapter JSON Payload (Event.payload) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={14} style={{ color: '#64748b' }} />
                  <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: 0 }}>
                    Raw Adapter Payload (`Event.payload`)
                  </h3>
                </div>
                <button
                  type="button"
                  id="btn-copy-raw-json"
                  onClick={handleCopyJson}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    color: copied ? '#15803d' : '#334155',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={12} style={{ color: '#15803d' }} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <div
                style={{
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  border: '1px solid #334155',
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(alarm.rawPayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
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
            {alarm.state === 'ACTIVE' && (
              <button
                type="button"
                id="btn-drawer-ack"
                onClick={() => onAcknowledge(alarm)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#00529C',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Clock size={13} />
                <span>Acknowledge Alarm</span>
              </button>
            )}

            {alarm.state === 'ACKNOWLEDGED' && (
              <button
                type="button"
                id="btn-drawer-clear"
                onClick={() => onClear(alarm)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={13} />
                <span>Clear / Resolve Alarm</span>
              </button>
            )}

            {alarm.state === 'CLEARED' && (
              <div
                style={{
                  fontSize: '11.5px',
                  color: '#16a34a',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={14} />
                <span>Alarm Already Cleared</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
