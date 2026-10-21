'use client';

import React from 'react';
import { AlarmItem } from '@/types/alarm';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2,
  Bot,
  Layers,
  Cable,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface AlarmTableProps {
  alarms: AlarmItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSelectAlarm: (alarm: AlarmItem) => void;
  onOpenAcknowledge: (alarm: AlarmItem) => void;
  onOpenClear: (alarm: AlarmItem) => void;
}

export function AlarmTable({
  alarms,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSelectAlarm,
  onOpenAcknowledge,
  onOpenClear,
}: AlarmTableProps) {
  const isAllSelected = alarms.length > 0 && selectedIds.length === alarms.length;

  const renderSourceBadge = (alarm: AlarmItem) => {
    switch (alarm.sourceType) {
      case 'AMR':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            }}
          >
            <Bot size={12} />
            <span>{alarm.sourceId}</span>
          </span>
        );
      case 'PLC_CONVEYOR':
      case 'PLC_LIFT':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#f5f3ff',
              color: '#6d28d9',
              border: '1px solid #ddd6fe',
            }}
          >
            <Layers size={12} />
            <span>{alarm.sourceId}</span>
          </span>
        );
      case 'RCS_GATEWAY':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
            }}
          >
            <Cable size={12} />
            <span>{alarm.sourceId}</span>
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
            }}
          >
            <FileText size={12} />
            <span>{alarm.sourceId}</span>
          </span>
        );
    }
  };

  const renderSeverityBadge = (severity: AlarmItem['severity']) => {
    if (severity === 'CRITICAL') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)',
              animation: 'pulse 1.5s infinite',
            }}
          />
          CRITICAL
        </span>
      );
    }
    if (severity === 'WARNING') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: '#fffbeb',
            color: '#b45309',
            border: '1px solid #fde68a',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
            }}
          />
          WARNING
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          border: '1px solid #bfdbfe',
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
          }}
        />
        INFO
      </span>
    );
  };

  const renderStateBadge = (alarm: AlarmItem) => {
    switch (alarm.state) {
      case 'ACTIVE':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
            }}
          >
            <AlertOctagon size={11} />
            UNACKNOWLEDGED
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
              }}
            >
              <Clock size={11} />
              ACKNOWLEDGED
            </span>
            {alarm.acknowledgedBy && (
              <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                By {alarm.acknowledgedBy.split(' ')[0]}
              </span>
            )}
          </div>
        );
      case 'CLEARED':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              }}
            >
              <CheckCircle2 size={11} />
              CLEARED
            </span>
            {alarm.clearedBy && (
              <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                {alarm.clearedBy.split(' ')[0]}
              </span>
            )}
          </div>
        );
    }
  };

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table
        id="table-alarms-list"
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
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              color: '#475569',
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <th style={{ padding: '10px 14px', width: '38px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                aria-label="Select all alarms"
                style={{ cursor: 'pointer', accentColor: '#00529C' }}
              />
            </th>
            <th style={{ padding: '10px 12px', width: '110px' }}>Severity</th>
            <th style={{ padding: '10px 12px', width: '130px' }}>Alarm ID & Code</th>
            <th style={{ padding: '10px 14px' }}>Title & Root Location</th>
            <th style={{ padding: '10px 12px', width: '130px' }}>Source Asset</th>
            <th style={{ padding: '10px 12px', width: '100px' }}>Task Ref</th>
            <th style={{ padding: '10px 12px', width: '130px' }}>Occurred / Age</th>
            <th style={{ padding: '10px 12px', width: '140px' }}>ISA-18.2 State</th>
            <th style={{ padding: '10px 16px', width: '160px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {alarms.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={32} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    No Alarms Found
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    All warehouse automation assets and adapter loops are operating within nominal thresholds.
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            alarms.map((alarm) => {
              const isSelected = selectedIds.includes(alarm.id);
              return (
                <tr
                  key={alarm.id}
                  id={`alarm-row-${alarm.id.toLowerCase()}`}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: isSelected
                      ? '#eff6ff'
                      : alarm.severity === 'CRITICAL' && alarm.state === 'ACTIVE'
                      ? '#fffaf9'
                      : '#ffffff',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor =
                        alarm.severity === 'CRITICAL' && alarm.state === 'ACTIVE'
                          ? '#fffaf9'
                          : '#ffffff';
                    }
                  }}
                >
                  {/* Selection Checkbox */}
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(alarm.id)}
                      aria-label={`Select alarm ${alarm.id}`}
                      style={{ cursor: 'pointer', accentColor: '#00529C' }}
                    />
                  </td>

                  {/* Severity Badge */}
                  <td style={{ padding: '12px 12px' }}>{renderSeverityBadge(alarm.severity)}</td>

                  {/* Alarm ID & Technical Error Code */}
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '12px' }}>
                        {alarm.id}
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: '#64748b',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        {alarm.code}
                      </span>
                    </div>
                  </td>

                  {/* Title & Location */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#0f172a',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                        }}
                        onClick={() => onSelectAlarm(alarm)}
                      >
                        {alarm.title}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          📍 {alarm.sourceLocation}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#475569',
                          marginTop: '2px',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {alarm.description}
                      </span>
                    </div>
                  </td>

                  {/* Source Asset */}
                  <td style={{ padding: '12px 12px' }}>{renderSourceBadge(alarm)}</td>

                  {/* Task Reference */}
                  <td style={{ padding: '12px 12px' }}>
                    {alarm.taskId ? (
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#0284c7',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '11.5px',
                          backgroundColor: '#f0f9ff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #bae6fd',
                        }}
                      >
                        {alarm.taskId}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>

                  {/* Occurred / Elapsed */}
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '11.5px' }}>
                        {alarm.occurredAt}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color:
                            alarm.state === 'ACTIVE'
                              ? alarm.severity === 'CRITICAL'
                                ? '#dc2626'
                                : '#d97706'
                              : '#64748b',
                        }}
                      >
                        {alarm.state === 'CLEARED' ? 'Resolved' : `Open: ${alarm.elapsedDuration}`}
                      </span>
                    </div>
                  </td>

                  {/* State */}
                  <td style={{ padding: '12px 12px' }}>{renderStateBadge(alarm)}</td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '6px',
                      }}
                    >
                      {/* Contextual Action Button */}
                      {alarm.state === 'ACTIVE' && (
                        <button
                          type="button"
                          id={`btn-ack-${alarm.id.toLowerCase()}`}
                          onClick={() => onOpenAcknowledge(alarm)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#00529C',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={11} />
                          Ack
                        </button>
                      )}

                      {alarm.state === 'ACKNOWLEDGED' && (
                        <button
                          type="button"
                          id={`btn-clear-${alarm.id.toLowerCase()}`}
                          onClick={() => onOpenClear(alarm)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={11} />
                          Clear
                        </button>
                      )}

                      {/* Detail Drawer Button */}
                      <button
                        type="button"
                        id={`btn-inspect-${alarm.id.toLowerCase()}`}
                        onClick={() => onSelectAlarm(alarm)}
                        title="View technical root-cause & raw robot payload"
                        style={{
                          padding: '4px 8px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <span>Details</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
