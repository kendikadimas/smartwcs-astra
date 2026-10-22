'use client';

import React, { useState } from 'react';
import { IntegrationLogItem } from '@/types/integration';
import {
  X,
  Copy,
  Check,
  Code2,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Server,
  Bot,
} from 'lucide-react';

interface PayloadInspectorDrawerProps {
  log: IntegrationLogItem | null;
  onClose: () => void;
}

export function PayloadInspectorDrawer({
  log,
  onClose,
}: PayloadInspectorDrawerProps) {
  const [activeTab, setActiveTab] = useState<'payload' | 'headers' | 'response'>('payload');
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const currentContent =
    activeTab === 'payload'
      ? JSON.stringify(log.payload, null, 2)
      : activeTab === 'headers'
      ? JSON.stringify(log.headers || {}, null, 2)
      : JSON.stringify(log.responsePayload || {}, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInbound = log.direction === 'INBOUND';

  return (
    <div className="drawer-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="drawer-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '560px',
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
                backgroundColor: isInbound ? '#ecfdf5' : '#eff6ff',
                color: isInbound ? '#059669' : '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isInbound ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                  Payload Inspector
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: isInbound ? '#dcfce7' : '#e0f2fe',
                    color: isInbound ? '#15803d' : '#0369a1',
                  }}
                >
                  {log.direction}
                </span>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#0284c7' }}>
                {log.traceId}
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

        {/* Metadata Strip */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '11.5px',
          }}
        >
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Adapter</span>
            <strong style={{ color: '#0f172a' }}>{log.adapterName}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Message Type</span>
            <strong style={{ color: '#0284c7', fontFamily: 'var(--font-mono)' }}>{log.messageType}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Target Resource</span>
            <span style={{ color: '#334155' }}>{log.robotId ? `${log.robotId} (${log.robotName})` : 'System Core'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Occurred At</span>
            <span style={{ color: '#334155' }}>{log.occurredAt}</span>
          </div>
        </div>

        {/* Tab Switcher & Copy Action */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('payload')}
              style={{
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: activeTab === 'payload' ? 700 : 500,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'payload' ? '#0f172a' : '#f1f5f9',
                color: activeTab === 'payload' ? '#ffffff' : '#64748b',
              }}
            >
              Body Payload
            </button>
            <button
              onClick={() => setActiveTab('headers')}
              style={{
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: activeTab === 'headers' ? 700 : 500,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'headers' ? '#0f172a' : '#f1f5f9',
                color: activeTab === 'headers' ? '#ffffff' : '#64748b',
              }}
            >
              Headers Metadata
            </button>
            {log.responsePayload && (
              <button
                onClick={() => setActiveTab('response')}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: activeTab === 'response' ? 700 : 500,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'response' ? '#0f172a' : '#f1f5f9',
                  color: activeTab === 'response' ? '#ffffff' : '#64748b',
                }}
              >
                Response Body
              </button>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11px', height: '26px' }}
          >
            {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>
        </div>

        {/* Code Content Viewport */}
        <div
          style={{
            flex: 1,
            padding: '16px 20px',
            overflowY: 'auto',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '1.6',
          }}
        >
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {currentContent}
          </pre>
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
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Stored in <code>IntegrationLog</code> table · Idempotent key: <code>traceId</code>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '4px 12px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
