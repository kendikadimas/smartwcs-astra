'use client';

import React, { useState } from 'react';
import { AuditLogItem } from '@/types/auditLog';
import {
  X,
  Copy,
  Check,
  FileDiff,
  ArrowRight,
  ShieldCheck,
  Clock,
  User,
  Laptop,
} from 'lucide-react';

interface AuditDiffDrawerProps {
  log: AuditLogItem | null;
  onClose: () => void;
}

export function AuditDiffDrawer({
  log,
  onClose,
}: AuditDiffDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopyDiff = () => {
    const diffData = {
      auditId: log.auditId,
      action: log.action,
      actor: `${log.userFullName} (@${log.username})`,
      target: `${log.targetType}: ${log.targetId}`,
      before: log.beforeValue || null,
      after: log.afterValue || null,
      occurredAt: log.occurredAt,
      ip: log.ipAddress,
    };
    navigator.clipboard.writeText(JSON.stringify(diffData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="drawer-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="drawer-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '580px',
          maxWidth: '92vw',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#eff6ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileDiff size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                  {log.action}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: log.result === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                    color: log.result === 'SUCCESS' ? '#15803d' : '#b91c1c',
                  }}
                >
                  {log.result}
                </span>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#0284c7' }}>
                {log.auditId}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Metadata Grid */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            fontSize: '11.5px',
          }}
        >
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Operator / Actor</span>
            <strong style={{ color: '#0f172a' }}>{log.userFullName}</strong>
            <div style={{ fontSize: '10px', color: '#64748b' }}>@{log.username} · {log.roleName}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Target Entity</span>
            <strong style={{ color: '#0f172a' }}>{log.targetLabel}</strong>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>ID: {log.targetId}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Timestamp</span>
            <span style={{ color: '#334155' }}>{log.occurredAt}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Network IP</span>
            <span style={{ color: '#334155', fontFamily: 'var(--font-mono)' }}>{log.ipAddress}</span>
          </div>
        </div>

        {/* Notes strip if any */}
        {log.notes && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: '#fffbeb',
              borderBottom: '1px solid #fef3c7',
              fontSize: '11.5px',
              color: '#92400e',
            }}
          >
            <strong>Operational Note:</strong> {log.notes}
          </div>
        )}

        {/* Diff Comparison View */}
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Before Value Box */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#dc2626' }}>
                Before Value (Previous State)
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Original JSON snapshot</span>
            </div>
            <div
              style={{
                backgroundColor: '#1e1e24',
                color: '#fca5a5',
                padding: '12px 14px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1.5',
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid #ef4444',
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(log.beforeValue || { state: 'INITIAL_CREATION' }, null, 2)}
              </pre>
            </div>
          </div>

          {/* After Value Box */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#16a34a' }}>
                After Value (Applied Mutation)
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Committed change state</span>
            </div>
            <div
              style={{
                backgroundColor: '#1a221f',
                color: '#86efac',
                padding: '12px 14px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1.5',
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid #22c55e',
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(log.afterValue || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#fafbfc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handleCopyDiff}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11.5px' }}
          >
            {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
            <span>{copied ? 'Diff Copied!' : 'Copy Audit Diff'}</span>
          </button>

          <button onClick={onClose} className="btn-secondary" style={{ padding: '4px 14px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
