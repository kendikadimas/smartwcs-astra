'use client';

import React, { useState } from 'react';
import { AlarmItem } from '@/types/alarm';
import { X, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ClearAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarm: AlarmItem | null;
  onConfirm: (alarmId: string, clearedBy: string, reason: string) => void;
}

export function ClearAlarmModal({
  isOpen,
  onClose,
  alarm,
  onConfirm,
}: ClearAlarmModalProps) {
  const [operatorName, setOperatorName] = useState('Budi Santoso (Supervisor)');
  const [resolutionCategory, setResolutionCategory] = useState('Obstacle / Jam Cleared');
  const [resolutionNote, setResolutionNote] = useState('');

  if (!isOpen || !alarm) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = resolutionNote.trim()
      ? `[${resolutionCategory}] ${resolutionNote.trim()}`
      : `[${resolutionCategory}] Incident resolved and asset restored to nominal service.`;
    onConfirm(alarm.id, operatorName, finalReason);
    onClose();
  };

  return (
    <div
      id="clear-modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="clear-modal-dialog"
        role="dialog"
        aria-modal="true"
        style={{
          width: '500px',
          maxWidth: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Clear &amp; Close Alarm ({alarm.id})
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                ISA-18.2 State Transition: &rarr; CLEARED / HISTORICAL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Alarm Preview Box */}
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{alarm.title}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Asset: <strong>{alarm.sourceId}</strong> · Location: {alarm.sourceLocation}
              </div>
            </div>

            {/* Operator Name */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Cleared By (Supervisor / Engineer)
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>

            {/* Resolution Root Cause Category */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Root Cause &amp; Resolution Category
              </label>
              <select
                value={resolutionCategory}
                onChange={(e) => setResolutionCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="Obstacle / Jam Cleared">Physical Obstacle / Conveyor Jam Removed</option>
                <option value="Controller Reset & Nominal Reboot">Controller Reset & Nominal Reboot</option>
                <option value="Sensor Cleaned / Recalibrated">Sensor Cleaned / Optical Lens Wiped</option>
                <option value="Battery Charged / Docked">Battery Swapped / Docked at Charging Station</option>
                <option value="Network / AP Reconnected">WiFi Access Point / Gateway Link Restored</option>
                <option value="Safety E-Stop Knob Reset">Safety E-Stop Knob Twisted & Safety Loop Closed</option>
                <option value="WMS Barcode / Manifest Corrected">WMS Barcode / Manifest Corrected</option>
                <option value="False Alarm / Test Routine">False Positive / Routine Sensor Test</option>
              </select>
            </div>

            {/* Resolution Verification Note */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Verification Note
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Details of physical fix and test validation before restoring asset to automated WCS dispatch..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '7px 14px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-clear"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={14} />
              Mark as Cleared / Resolved
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
