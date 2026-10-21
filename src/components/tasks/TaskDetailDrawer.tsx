'use client';

import React from 'react';
import { TaskItem, PrdTaskStatus } from '@/types/task';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { X, ArrowRight, AlertCircle, RotateCcw, Ban } from 'lucide-react';

interface TaskDetailDrawerProps {
  task: TaskItem | null;
  onClose: () => void;
  onCancelTask: (task: TaskItem) => void;
  onRetryTask: (task: TaskItem) => void;
}

const PRD_STATES: PrdTaskStatus[] = [
  'CREATED',
  'VALIDATED',
  'QUEUED',
  'ASSIGNED',
  'DISPATCHED',
  'RUNNING',
  'COMPLETED',
];

export function TaskDetailDrawer({
  task,
  onClose,
  onCancelTask,
  onRetryTask,
}: TaskDetailDrawerProps) {
  if (!task) return null;

  const isFailed = task.prdStatus === 'FAILED' || task.status === 'Failed';
  const isCancelled = task.prdStatus === 'CANCELLED';

  const getStateIndex = (status: PrdTaskStatus) => {
    return PRD_STATES.indexOf(status);
  };

  const currentIdx = getStateIndex(task.prdStatus);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(1.5px)',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideInRight 0.2s ease-out',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fafbfc',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                {task.id}
              </span>
              <StatusBadge status={task.status} />
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Created at {task.createdAt} · {task.createdDate}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
              borderRadius: '6px',
            }}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {/* Origin -> Destination Box */}
          <div
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Origin
              </span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {task.origin}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#0284c7' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>{task.type}</span>
              <ArrowRight size={18} />
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Destination
              </span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {task.destination}
              </div>
            </div>
          </div>

          {/* Key Attributes Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12.5px',
            }}
          >
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Priority</span>
              <PriorityBadge priority={task.priority} />
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Assigned Resource</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{task.resource}</span>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Elapsed Time</span>
              <span style={{ fontWeight: 600, color: task.isDelayed ? '#dc2626' : '#0f172a' }}>
                {task.elapsed}
              </span>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Container / Bin</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{task.containerId || '—'}</span>
            </div>
          </div>

          {/* Material Specs */}
          {task.material && (
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12.5px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Material Information
              </div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{task.material}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11.5px', marginTop: '4px' }}>
                <span>SKU: {task.materialSku || 'N/A'}</span>
                <span>Qty: {task.quantity || 1} units</span>
              </div>
            </div>
          )}

          {/* Failure Alert (if any) */}
          {(isFailed || task.failureReason) && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                gap: '8px',
                color: '#b91c1c',
                fontSize: '12px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block' }}>Execution Stalled / Failed</strong>
                <span>{task.failureReason || 'Equipment communication or safety controller timeout reported.'}</span>
              </div>
            </div>
          )}

          {/* Lifecycle State Machine (PRD Section 11) */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
              PRD State Machine Lifecycle (FR-02)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {PRD_STATES.map((state, idx) => {
                const isPassed = !isFailed && !isCancelled && currentIdx >= idx;
                const isCurrent = task.prdStatus === state;

                return (
                  <div
                    key={state}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      backgroundColor: isCurrent ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: isCurrent ? '#0284c7' : isPassed ? '#16a34a' : '#e2e8f0',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {isPassed && !isCurrent ? '✓' : idx + 1}
                    </div>

                    <span
                      style={{
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? '#0284c7' : isPassed ? '#0f172a' : '#94a3b8',
                      }}
                    >
                      {state}
                    </span>

                    {isCurrent && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '10.5px',
                          color: '#0284c7',
                          fontWeight: 600,
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                );
              })}

              {isFailed && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#fee2e2',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </div>
                  <span style={{ fontWeight: 700, color: '#b91c1c' }}>FAILED</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#fafbfc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          {isFailed && (
            <button
              onClick={() => onRetryTask(task)}
              className="btn-primary"
              style={{ fontSize: '12px' }}
            >
              <RotateCcw size={13} />
              Retry Task
            </button>
          )}

          {!isFailed && !isCancelled && task.prdStatus !== 'COMPLETED' && (
            <button
              onClick={() => onCancelTask(task)}
              className="btn-secondary"
              style={{ color: '#dc2626', borderColor: '#fecaca', fontSize: '12px' }}
            >
              <Ban size={13} />
              Cancel Task
            </button>
          )}

          <button onClick={onClose} className="btn-secondary" style={{ fontSize: '12px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
