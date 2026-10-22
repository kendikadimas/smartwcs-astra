'use client';

import React, { useState } from 'react';
import { IntegrationAdapterItem } from '@/types/integration';
import {
  Cable,
  Server,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Settings,
  Activity,
  Bot,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface AdapterCardGridProps {
  adapters: IntegrationAdapterItem[];
  onConfigureAdapter: (adapter: IntegrationAdapterItem) => void;
  onPingAdapter: (adapter: IntegrationAdapterItem) => void;
  onSyncFleet: () => void;
  pingingId: string | null;
}

export function AdapterCardGrid({
  adapters,
  onConfigureAdapter,
  onPingAdapter,
  onSyncFleet,
  pingingId,
}: AdapterCardGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyEndpoint = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const getSystemIcon = (systemType: string) => {
    switch (systemType) {
      case 'RCS':
        return Bot;
      case 'WMS':
        return Layers;
      case 'PLC':
        return Cpu;
      case 'ERP':
        return Server;
      default:
        return Cable;
    }
  };

  return (
    <div id="adapters" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            Registered System Adapters
          </h2>
          <p style={{ fontSize: '11px', color: '#64748b' }}>
            Active connectors bridging WCS Core with robot fleet, warehouse inventory, and factory floor PLC
          </p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
          4 Configured Connectors
        </span>
      </div>

      <div className="adapter-cards-grid">
        {adapters.map((adapter) => {
          const Icon = getSystemIcon(adapter.systemType);
          const isPinging = pingingId === adapter.id;

          const typeColors =
            adapter.systemType === 'RCS'
              ? { bg: '#eff6ff', text: '#0284c7', border: '#bae6fd' }
              : adapter.systemType === 'WMS'
              ? { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' }
              : adapter.systemType === 'PLC'
              ? { bg: '#fef3c7', text: '#d97706', border: '#fde68a' }
              : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' };

          return (
            <div
              key={adapter.id}
              className="panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: typeColors.bg,
                        color: typeColors.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${typeColors.border}`,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                          {adapter.name}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: typeColors.bg,
                            color: typeColors.text,
                            border: `1px solid ${typeColors.border}`,
                          }}
                        >
                          {adapter.systemType}
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        Protocol: <strong>{adapter.protocol}</strong> · Latency: <strong>{adapter.latencyMs} ms</strong>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <span>Connected</span>
                  </div>
                </div>

                {/* Endpoint URL Pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: '#334155',
                    marginBottom: '10px',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                    {adapter.endpointUrl}
                  </span>
                  <button
                    onClick={() => handleCopyEndpoint(adapter.id, adapter.endpointUrl)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedId === adapter.id ? '#16a34a' : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                    title="Copy URL"
                  >
                    {copiedId === adapter.id ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>

                <p style={{ fontSize: '11.5px', color: '#475569', marginBottom: '8px', lineHeight: '1.45' }}>
                  {adapter.description}
                </p>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#0284c7',
                    backgroundColor: '#f0f9ff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #e0f2fe',
                    marginBottom: '12px',
                  }}
                >
                  <strong>Scope:</strong> {adapter.scopeSummary}
                </div>

                {/* Metrics Stats Ribbon */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    padding: '8px 10px',
                    backgroundColor: '#fafbfc',
                    borderRadius: '6px',
                    border: '1px solid #f1f5f9',
                    fontSize: '11px',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Today Calls</span>
                    <strong style={{ color: '#0f172a' }}>{adapter.metrics.todayRequests.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Success Rate</span>
                    <strong style={{ color: '#15803d' }}>{adapter.metrics.successRate}%</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Last Tested</span>
                    <span style={{ color: '#475569', fontSize: '10.5px' }}>{adapter.lastTestedAt.split(',')[1]}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#64748b' }}>
                  <ShieldCheck size={13} color="#059669" />
                  <span>Key Hash: {adapter.credentialsMasked.appKey}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {adapter.systemType === 'RCS' && (
                    <button
                      onClick={onSyncFleet}
                      className="btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px', height: '28px' }}
                      title="Sync PUDU robots and maps"
                    >
                      <Bot size={13} />
                      <span>Sync</span>
                    </button>
                  )}

                  <button
                    onClick={() => onPingAdapter(adapter)}
                    disabled={isPinging}
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px', height: '28px' }}
                    title="Ping test adapter endpoint"
                  >
                    <Activity size={13} className={isPinging ? 'animate-pulse' : ''} />
                    <span>{isPinging ? 'Pinging...' : 'Ping Test'}</span>
                  </button>

                  <button
                    onClick={() => onConfigureAdapter(adapter)}
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px', height: '28px' }}
                    title="Configure adapter settings"
                  >
                    <Settings size={13} />
                    <span>Config</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
