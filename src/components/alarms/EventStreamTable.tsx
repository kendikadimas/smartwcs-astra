'use client';

import React, { useState } from 'react';
import { TelemetryEventItem } from '@/types/alarm';
import {
  Radio,
  ChevronDown,
  ChevronRight,
  Terminal,
  Copy,
  Check,
  Bot,
  Layers,
  Cable,
  FileText,
} from 'lucide-react';

interface EventStreamTableProps {
  events: TelemetryEventItem[];
  searchQuery?: string;
}

export function EventStreamTable({ events, searchQuery = '' }: EventStreamTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.id.toLowerCase().includes(q) ||
      ev.eventType.toLowerCase().includes(q) ||
      ev.source.toLowerCase().includes(q) ||
      ev.message.toLowerCase().includes(q) ||
      (ev.taskId && ev.taskId.toLowerCase().includes(q))
    );
  });

  const handleCopyPayload = (id: string, payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderSourceIcon = (sourceType: TelemetryEventItem['sourceType']) => {
    switch (sourceType) {
      case 'AMR':
        return <Bot size={12} style={{ color: '#2563eb' }} />;
      case 'PLC_CONVEYOR':
      case 'PLC_LIFT':
        return <Layers size={12} style={{ color: '#7c3aed' }} />;
      case 'RCS_GATEWAY':
        return <Cable size={12} style={{ color: '#059669' }} />;
      default:
        return <FileText size={12} style={{ color: '#475569' }} />;
    }
  };

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <div
        style={{
          padding: '10px 16px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11.5px',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={13} style={{ color: '#7c3aed', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            Live Telemetry Event Log Stream
          </span>
          <span>&bull; Direct stream from PUDU RCS Cloud, OPC UA, and WMS message broker</span>
        </div>
        <span style={{ fontWeight: 600 }}>Showing {filteredEvents.length} events</span>
      </div>

      <table
        id="table-telemetry-events"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          textAlign: 'left',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              color: '#475569',
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <th style={{ padding: '9px 12px', width: '40px' }} />
            <th style={{ padding: '9px 12px', width: '120px' }}>Timestamp</th>
            <th style={{ padding: '9px 12px', width: '100px' }}>Severity</th>
            <th style={{ padding: '9px 14px', width: '210px' }}>Event Type</th>
            <th style={{ padding: '9px 12px', width: '130px' }}>Source Asset</th>
            <th style={{ padding: '9px 12px', width: '90px' }}>Task Ref</th>
            <th style={{ padding: '9px 14px' }}>Event Message</th>
          </tr>
        </thead>
        <tbody>
          {filteredEvents.map((ev) => {
            const isExpanded = expandedId === ev.id;
            return (
              <React.Fragment key={ev.id}>
                <tr
                  id={`event-row-${ev.id.toLowerCase()}`}
                  style={{
                    borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                    backgroundColor: isExpanded
                      ? '#f8fafc'
                      : ev.severity === 'CRITICAL'
                      ? '#fffaf9'
                      : '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                >
                  {/* Expand Toggle */}
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {isExpanded ? (
                      <ChevronDown size={14} style={{ color: '#00529C' }} />
                    ) : (
                      <ChevronRight size={14} style={{ color: '#94a3b8' }} />
                    )}
                  </td>

                  {/* Timestamp */}
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono, monospace)', fontSize: '11.5px', color: '#0f172a' }}>
                    {ev.occurredAt}
                  </td>

                  {/* Severity */}
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        backgroundColor:
                          ev.severity === 'CRITICAL'
                            ? '#fee2e2'
                            : ev.severity === 'WARNING'
                            ? '#fef3c7'
                            : '#eff6ff',
                        color:
                          ev.severity === 'CRITICAL'
                            ? '#b91c1c'
                            : ev.severity === 'WARNING'
                            ? '#b45309'
                            : '#1d4ed8',
                      }}
                    >
                      {ev.severity}
                    </span>
                  </td>

                  {/* Event Type */}
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      {ev.eventType}
                    </span>
                  </td>

                  {/* Source Asset */}
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 600,
                        color: '#334155',
                        fontSize: '11.5px',
                      }}
                    >
                      {renderSourceIcon(ev.sourceType)}
                      <span>{ev.source}</span>
                    </span>
                  </td>

                  {/* Task Ref */}
                  <td style={{ padding: '10px 12px' }}>
                    {ev.taskId ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#0284c7',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        {ev.taskId}
                      </span>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>—</span>
                    )}
                  </td>

                  {/* Message */}
                  <td style={{ padding: '10px 14px', color: '#334155', fontSize: '11.5px' }}>
                    {ev.message}
                  </td>
                </tr>

                {/* Expanded Raw Payload Row */}
                {isExpanded && (
                  <tr
                    style={{
                      backgroundColor: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                    }}
                  >
                    <td colSpan={7} style={{ padding: '0 16px 14px 44px' }}>
                      <div
                        style={{
                          backgroundColor: '#0f172a',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          border: '1px solid #334155',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '6px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: '#94a3b8',
                              textTransform: 'uppercase',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <Terminal size={12} />
                            Event Payload JSON
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPayload(ev.id, ev.payload);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              fontSize: '10.5px',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '4px',
                              color: copiedId === ev.id ? '#34d399' : '#e2e8f0',
                              cursor: 'pointer',
                            }}
                          >
                            {copiedId === ev.id ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedId === ev.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre
                          style={{
                            margin: 0,
                            fontSize: '11px',
                            color: '#e2e8f0',
                            fontFamily: 'var(--font-mono, monospace)',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {JSON.stringify(ev.payload, null, 2)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
