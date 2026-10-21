'use client';

import React, { useState } from 'react';
import { AlarmItem } from '@/types/alarm';
import { X, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AcknowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarm: AlarmItem | null;
  onConfirm: (alarmId: string, ackBy: string, note: string) => void;
}

export function AcknowledgeModal({
  isOpen,
  onClose,
  alarm,
  onConfirm,
}: AcknowledgeModalProps) {
  const [operatorName, setOperatorName] = useState('Budi Santoso (Supervisor)');
  const [assignedTechnician, setAssignedTechnician] = useState('Ahmad (Electrical Tech)');
  const [eta, setEta] = useState('15 mins');
  const [note, setNote] = useState('');

  if (!isOpen || !alarm) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullNote = note.trim()
      ? `${assignedTechnician} dispatched (ETA: ${eta}). Note: ${note.trim()}`
      : `${assignedTechnician} dispatched to investigate on-site (ETA: ${eta}).`;
    onConfirm(alarm.id, operatorName, fullNote);
    onClose();
  };

  return (
    <div
      id="ack-modal-backdrop"
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
        id="ack-modal-dialog"
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
                backgroundColor: '#eff6ff',
                color: '#00529C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Acknowledge Alarm ({alarm.id})
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                ISA-18.2 Standard State Transition: ACTIVE &rarr; ACKNOWLEDGED
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
                Acknowledged By
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

            {/* Assigned Technician & ETA Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Assigned Technician
                </label>
                <select
                  value={assignedTechnician}
                  onChange={(e) => setAssignedTechnician(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="Ahmad (Electrical Tech)">Ahmad (Electrical Tech)</option>
                  <option value="Doni (Mechanical Tech)">Doni (Mechanical Tech)</option>
                  <option value="Dewi Lestari (Network IT)">Dewi Lestari (Network IT)</option>
                  <option value="Shift 1 Line Operator">Shift 1 Line Operator</option>
                  <option value="PUDU Vendor Support">PUDU Vendor Support</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Expected Resolution ETA
                </label>
                <select
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="10 mins">10 mins (Urgent)</option>
                  <option value="15 mins">15 mins</option>
                  <option value="30 mins">30 mins</option>
                  <option value="1 hour+">1 hour+ (Major fault)</option>
                </select>
              </div>
            </div>

            {/* Investigation Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Intervention Notes / Action Plan
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe action taken or initial assessment (e.g., verifying WiFi AP-04 connection, resetting Omron VFD brake switch)..."
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
              id="btn-confirm-ack"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                backgroundColor: '#00529C',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ShieldCheck size={14} />
              Confirm Acknowledgement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
