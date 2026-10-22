'use client';

import React from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';

interface ResetDefaultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetDefaultsModal({
  isOpen,
  onClose,
  onConfirm,
}: ResetDefaultsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '460px', maxWidth: '95vw', padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Reset Factory Defaults?
              </h2>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Restore all parameters to Astra Winteq baseline
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', marginBottom: '20px' }}>
          This action will reset battery return thresholds (20%), retry attempts (3x), speed limits (1.2 m/s), and data retention policies to the standard factory baseline. Any custom threshold adjustments will be overridden.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn-primary"
            style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c' }}
          >
            <RotateCcw size={14} />
            Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
}
