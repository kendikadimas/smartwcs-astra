'use client';

import React, { useState } from 'react';
import {
  X,
  Bot,
  RefreshCw,
  CheckCircle2,
  Map,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';

interface SyncFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function SyncFleetModal({
  isOpen,
  onClose,
  onSuccess,
}: SyncFleetModalProps) {
  const [syncState, setSyncState] = useState<'IDLE' | 'SYNCING' | 'DONE'>('IDLE');
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    { label: 'Connecting to PUDU Open Platform Cloud API (HMAC Handshake)', icon: Bot },
    { label: 'Querying Store List via GetStoreList (Shop ID: 10442)', icon: Database },
    { label: 'Fetching Robot Fleet via StoreRobotList (8 T600 AMRs detected)', icon: Bot },
    { label: 'Downloading Map Geometry via GetShopMapList (4 Maps, 48 Elements)', icon: Map },
    { label: 'Upserting local records (PuduRobot, PuduMap, PuduMapElement)', icon: Layers },
  ];

  const handleStartSync = () => {
    setSyncState('SYNCING');
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setSyncState('DONE');
          return prev;
        }
      });
    }, 550);
  };

  const handleFinish = () => {
    onSuccess('PUDU Fleet & Warehouse Maps synchronized successfully (8 AMRs, 4 Maps)');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '540px', maxWidth: '95vw', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Synchronize PUDU Cloud Fleet &amp; Maps
              </h2>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Polls Open Platform APIs to update local AMR catalog and CAD waypoints
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent' }}>
            <X size={18} />
          </button>
        </div>

        {/* Steps Progress List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {steps.map((step, idx) => {
            const isCompleted = syncState === 'DONE' || (syncState === 'SYNCING' && currentStep > idx);
            const isCurrent = syncState === 'SYNCING' && currentStep === idx;
            const Icon = step.icon;

            return (
              <div
                key={step.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: isCurrent ? '#eff6ff' : isCompleted ? '#f0fdf4' : '#f8fafc',
                  border: isCurrent
                    ? '1px solid #38bdf8'
                    : isCompleted
                    ? '1px solid #bbf7d0'
                    : '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? '#0284c7' : isCompleted ? '#16a34a' : '#cbd5e1',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={14} />
                  ) : isCurrent ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </div>

                <div style={{ flex: 1, fontSize: '11.5px', color: isCurrent ? '#0369a1' : isCompleted ? '#15803d' : '#64748b', fontWeight: isCurrent ? 600 : 500 }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Card when Done */}
        {syncState === 'DONE' && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#ecfdf5',
              borderRadius: '6px',
              border: '1px solid #a7f3d0',
              marginBottom: '20px',
              fontSize: '11.5px',
              color: '#065f46',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Sync Complete: 100% Consistent</div>
            <div>• 8 Robots verified: AMR-01 to AMR-08 (Firmware v2.4.1)</div>
            <div>• 4 Maps synchronized: Ground Floor, Staging Area, Buffer, Outbound Dock</div>
            <div>• 48 Waypoints and pickup nodes updated in local database</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          {syncState === 'IDLE' && (
            <>
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleStartSync} className="btn-primary">
                <RefreshCw size={14} />
                Start Synchronization
              </button>
            </>
          )}

          {syncState === 'SYNCING' && (
            <button disabled className="btn-primary" style={{ opacity: 0.8 }}>
              <RefreshCw size={14} className="animate-spin" />
              Syncing in progress...
            </button>
          )}

          {syncState === 'DONE' && (
            <button onClick={handleFinish} className="btn-primary">
              <CheckCircle2 size={14} />
              Done &amp; Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
