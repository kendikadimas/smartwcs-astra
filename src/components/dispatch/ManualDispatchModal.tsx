'use client';

import React, { useState } from 'react';
import {
  DispatchMission,
  FleetResourceItem,
} from '@/types/dispatch';
import {
  X,
  Send,
  Bot,
  AlertCircle,
  CheckCircle2,
  Battery,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ManualDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  queuedMissions: DispatchMission[];
  availableRobots: FleetResourceItem[];
  preselectedRobotId?: string;
  onConfirmDispatch: (missionId: string, robotId: string, reason: string) => void;
}

export function ManualDispatchModal({
  isOpen,
  onClose,
  queuedMissions,
  availableRobots,
  preselectedRobotId,
  onConfirmDispatch,
}: ManualDispatchModalProps) {
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    queuedMissions.length > 0 ? queuedMissions[0].id : ''
  );
  const [selectedRobotId, setSelectedRobotId] = useState<string>(
    preselectedRobotId || (availableRobots.length > 0 ? availableRobots[0].id : '')
  );
  const [reason, setReason] = useState<string>('Supervisor manual dispatch override');

  if (!isOpen) return null;

  const currentMission = queuedMissions.find((m) => m.id === selectedMissionId) || queuedMissions[0];
  const currentRobot = availableRobots.find((r) => r.id === selectedRobotId) || availableRobots[0];

  const hasCapacity = currentRobot && currentMission ? currentRobot.maxPayloadKg >= currentMission.payloadWeightKg : true;
  const hasBattery = currentRobot ? currentRobot.battery >= 20 : false;
  const canDispatch = currentMission && currentRobot && hasCapacity && hasBattery;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDispatch) return;
    onConfirmDispatch(currentMission.id, currentRobot.id, reason);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={16} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Manual Mission Dispatch
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Manually pair a pending queued task with an idle robot fleet resource
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-button"
            style={{ width: '28px', height: '28px' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* 1. Select Queued Task */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Select Queued Mission / Task:
            </label>
            {queuedMissions.length === 0 ? (
              <div style={{ padding: '10px', fontSize: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', color: '#64748b' }}>
                No queued missions currently waiting in dispatch queue.
              </div>
            ) : (
              <select
                value={selectedMissionId}
                onChange={(e) => setSelectedMissionId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  backgroundColor: '#ffffff',
                }}
              >
                {queuedMissions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} · Task {m.taskId} ({m.taskType}): {m.origin} ➔ {m.destination} · {m.payloadWeightKg}kg ({m.priority} Prio)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Select Candidate Robot */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Assign to AMR / Robot:
            </label>
            {availableRobots.length === 0 ? (
              <div style={{ padding: '10px', fontSize: '12px', backgroundColor: '#fffbeb', borderRadius: '6px', color: '#d97706' }}>
                No idle robots available. Wait for robots to complete active tasks or finish charging.
              </div>
            ) : (
              <select
                value={selectedRobotId}
                onChange={(e) => setSelectedRobotId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  backgroundColor: '#ffffff',
                }}
              >
                {availableRobots.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.name}) · Battery: {r.battery}% · Max Payload: {r.maxPayloadKg}kg · At: {r.currentLocation}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Real-time Verification Checklist */}
          {currentMission && currentRobot && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                Resource Compatibility Checklist:
              </div>

              {/* Check 1: Battery */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Battery Level (&ge; 20% required):</span>
                <span style={{ color: hasBattery ? '#16a34a' : '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {hasBattery ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {currentRobot.battery}% ({hasBattery ? 'Passed' : 'Low Battery'})
                </span>
              </div>

              {/* Check 2: Payload Capacity */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>
                  Payload ({currentMission.payloadWeightKg}kg &le; {currentRobot.maxPayloadKg}kg limit):
                </span>
                <span style={{ color: hasCapacity ? '#16a34a' : '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {hasCapacity ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {hasCapacity ? 'Capacity OK' : 'Exceeds Payload!'}
                </span>
              </div>

              {/* Check 3: Adapter Channel */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Target Dispatch Adapter:</span>
                <span style={{ color: '#2563eb', fontWeight: 600 }}>
                  {currentMission.adapterChannel}
                </span>
              </div>
            </div>
          )}

          {/* 4. Reason for Manual Override */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Override Reason / Operator Note:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Expedited priority requested by supervisor"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
              }}
            />
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '16px',
              marginTop: '4px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '6px 14px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canDispatch}
              className="btn-primary"
              style={{
                padding: '6px 16px',
                opacity: canDispatch ? 1 : 0.5,
                cursor: canDispatch ? 'pointer' : 'not-allowed',
              }}
            >
              <Send size={14} />
              <span>Confirm &amp; Dispatch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
