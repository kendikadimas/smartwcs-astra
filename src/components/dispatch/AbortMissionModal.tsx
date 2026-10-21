'use client';

import React, { useState } from 'react';
import { DispatchMission } from '@/types/dispatch';
import {
  AlertTriangle,
  X,
  Ban,
  RotateCcw,
  OctagonAlert,
  ArrowRight,
  Bot,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface AbortMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: DispatchMission | null;
  onConfirmAbort: (
    missionId: string,
    reason: string,
    actionType: 'Abort' | 'Requeue' | 'EmergencyStop'
  ) => void;
}

export function AbortMissionModal({
  isOpen,
  onClose,
  mission,
  onConfirmAbort,
}: AbortMissionModalProps) {
  const [actionType, setActionType] = useState<'Abort' | 'Requeue' | 'EmergencyStop'>('Abort');
  const [reason, setReason] = useState<string>('Physical path obstacle / blocked aisle');
  const [customNote, setCustomNote] = useState<string>('');

  if (!isOpen || !mission) return null;

  const reasonOptions = [
    'Physical path obstacle / blocked aisle',
    'Low battery / battery degradation alarm',
    'Hardware / sensor warning reported by RCS',
    'Destination station buffer full / not ready',
    'Payload dislodged or barcode unreadable',
    'Supervisor operational schedule change',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNote.trim() ? `${reason} (${customNote.trim()})` : reason;
    onConfirmAbort(mission.id, finalReason, actionType);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="card-container"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          border: '1px solid #fee2e2',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #fee2e2',
            backgroundColor: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>
                Mission Intervention / Abort Command
              </div>
              <div style={{ fontSize: '11px', color: '#b91c1c' }}>
                Dispatch ID: <span style={{ fontWeight: 600 }}>{mission.id}</span> · Linked Task: <span style={{ fontWeight: 600 }}>{mission.taskId}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#991b1b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '16px 18px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Mission Summary Card */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={15} style={{ color: '#00529C' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  {mission.assignedResource} ({mission.resourceType})
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#e2e8f0',
                    color: '#475569',
                    fontWeight: 500,
                  }}
                >
                  {mission.dispatchStatus}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                {mission.progressPercent}% completed
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#334155',
              }}
            >
              <span style={{ fontWeight: 500 }}>{mission.origin}</span>
              <ArrowRight size={12} style={{ color: '#94a3b8' }} />
              <span style={{ fontWeight: 500 }}>{mission.destination}</span>
              <span style={{ color: '#94a3b8' }}>•</span>
              <span style={{ color: '#64748b' }}>Waypoint: {mission.currentWaypoint}</span>
            </div>
          </div>

          {/* Action Strategy Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '8px',
              }}
            >
              Intervention Action
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setActionType('Abort')}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: actionType === 'Abort' ? '2px solid #dc2626' : '1px solid #e2e8f0',
                  backgroundColor: actionType === 'Abort' ? '#fef2f2' : '#ffffff',
                  color: actionType === 'Abort' ? '#991b1b' : '#475569',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Ban size={16} style={{ color: actionType === 'Abort' ? '#dc2626' : '#64748b' }} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Cancel Mission</span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Return fleet to dock</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('Requeue')}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: actionType === 'Requeue' ? '2px solid #00529C' : '1px solid #e2e8f0',
                  backgroundColor: actionType === 'Requeue' ? '#f0f7ff' : '#ffffff',
                  color: actionType === 'Requeue' ? '#003e75' : '#475569',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={16} style={{ color: actionType === 'Requeue' ? '#00529C' : '#64748b' }} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Re-queue Task</span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Assign alternate AMR</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('EmergencyStop')}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: actionType === 'EmergencyStop' ? '2px solid #b91c1c' : '1px solid #e2e8f0',
                  backgroundColor: actionType === 'EmergencyStop' ? '#fff1f2' : '#ffffff',
                  color: actionType === 'EmergencyStop' ? '#881337' : '#475569',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <OctagonAlert size={16} style={{ color: actionType === 'EmergencyStop' ? '#b91c1c' : '#64748b' }} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Hold / E-Stop</span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Freeze in position</span>
              </button>
            </div>
          </div>

          {/* Reason Selection */}
          <div style={{ marginBottom: '14px' }}>
            <label
              htmlFor="abort-reason"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Primary Reason for Intervention
            </label>
            <select
              id="abort-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
              }}
            >
              {reasonOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="abort-note"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Operator Note / Telemetry Incident ID (Optional)
            </label>
            <textarea
              id="abort-note"
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Worker forklift blocking aisle 2, manual bypass approved by lead supervisor."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Safety Advisory Banner */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <ShieldAlert size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '11px', color: '#92400e', lineHeight: 1.45 }}>
              Issuing this command transmits an immediate abort payload via{' '}
              <strong>{mission.adapterChannel}</strong>. Telemetry log will register an operator
              override event for auditing.
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#475569',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: actionType === 'Requeue' ? '#00529C' : '#dc2626',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: actionType === 'Requeue' ? '0 1px 3px rgba(0,82,156,0.3)' : '0 1px 3px rgba(220,38,38,0.3)',
              }}
            >
              {actionType === 'Requeue' ? (
                <>
                  <RotateCcw size={15} />
                  Confirm Re-queue
                </>
              ) : (
                <>
                  <Ban size={15} />
                  Execute Command
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
