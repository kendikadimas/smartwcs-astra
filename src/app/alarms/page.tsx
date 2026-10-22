'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AlarmKpis } from '@/components/alarms/AlarmKpis';
import { AlarmToolbar } from '@/components/alarms/AlarmToolbar';
import { AlarmTable } from '@/components/alarms/AlarmTable';
import { AlarmDetailDrawer } from '@/components/alarms/AlarmDetailDrawer';
import { AcknowledgeModal } from '@/components/alarms/AcknowledgeModal';
import { ClearAlarmModal } from '@/components/alarms/ClearAlarmModal';
import { EventStreamTable } from '@/components/alarms/EventStreamTable';
import {
  initialMockAlarms,
  mockTelemetryEvents,
  mockAlarmMetrics,
} from '@/data/mockAlarms';
import {
  AlarmItem,
  TelemetryEventItem,
  AlarmFilterState,
  AlarmMetrics,
} from '@/types/alarm';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  ChevronDown,
  Clock,
  ShieldCheck,
  Download,
  AlertOctagon,
} from 'lucide-react';

interface ToastState {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export default function AlarmsPage() {
  // Core State
  const [alarms, setAlarms] = useState<AlarmItem[]>(initialMockAlarms);
  const [events, setEvents] = useState<TelemetryEventItem[]>(mockTelemetryEvents);
  const [selectedFacility, setSelectedFacility] = useState('Main Warehouse · Bekasi');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [filterState, setFilterState] = useState<AlarmFilterState>({
    search: '',
    tab: 'ALL',
    severity: 'ALL',
    sourceType: 'ALL',
    timeRange: 'ALL',
  });

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Drawer State
  const [detailAlarm, setDetailAlarm] = useState<AlarmItem | null>(null);
  const [ackTargetAlarm, setAckTargetAlarm] = useState<AlarmItem | null>(null);
  const [clearTargetAlarm, setClearTargetAlarm] = useState<AlarmItem | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: 'success' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Web Audio chime helper for subtle industrial alert
  const playAlertChime = useCallback(() => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before gesture
    }
  }, [isAudioMuted]);

  // Dynamic Alarm Metrics Calculation
  const metrics: AlarmMetrics = useMemo(() => {
    const activeCritical = alarms.filter(
      (a) => a.state === 'ACTIVE' && a.severity === 'CRITICAL'
    ).length;
    const activeWarnings = alarms.filter(
      (a) => a.state === 'ACTIVE' && a.severity === 'WARNING'
    ).length;
    const acknowledged = alarms.filter((a) => a.state === 'ACKNOWLEDGED').length;
    const clearedToday = alarms.filter((a) => a.state === 'CLEARED').length;
    const totalActive = alarms.filter((a) => a.state === 'ACTIVE').length;

    return {
      activeCritical,
      activeWarnings,
      acknowledged,
      clearedToday,
      totalActive,
      mttaSec: mockAlarmMetrics.mttaSec,
      mttrMin: mockAlarmMetrics.mttrMin,
    };
  }, [alarms]);

  // Tab Counts
  const counts = useMemo(() => {
    return {
      all: alarms.length,
      active: alarms.filter((a) => a.state === 'ACTIVE').length,
      acknowledged: alarms.filter((a) => a.state === 'ACKNOWLEDGED').length,
      cleared: alarms.filter((a) => a.state === 'CLEARED').length,
      events: events.length,
    };
  }, [alarms, events]);

  // Filtered Alarms
  const filteredAlarms = useMemo(() => {
    return alarms.filter((a) => {
      // Tab filter
      if (filterState.tab === 'ACTIVE' && a.state !== 'ACTIVE') return false;
      if (filterState.tab === 'ACKNOWLEDGED' && a.state !== 'ACKNOWLEDGED') return false;
      if (filterState.tab === 'CLEARED' && a.state !== 'CLEARED') return false;

      // Severity filter
      if (filterState.severity !== 'ALL' && a.severity !== filterState.severity) {
        return false;
      }

      // Source filter
      if (filterState.sourceType !== 'ALL' && a.sourceType !== filterState.sourceType) {
        return false;
      }

      // Search query
      if (filterState.search.trim()) {
        const q = filterState.search.toLowerCase();
        const matchesId = a.id.toLowerCase().includes(q);
        const matchesCode = a.code.toLowerCase().includes(q);
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesDesc = a.description.toLowerCase().includes(q);
        const matchesSource = a.sourceId.toLowerCase().includes(q);
        const matchesLoc = a.sourceLocation.toLowerCase().includes(q);
        const matchesTask = a.taskId ? a.taskId.toLowerCase().includes(q) : false;

        if (
          !matchesId &&
          !matchesCode &&
          !matchesTitle &&
          !matchesDesc &&
          !matchesSource &&
          !matchesLoc &&
          !matchesTask
        ) {
          return false;
        }
      }

      return true;
    });
  }, [alarms, filterState]);

  // Action Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredAlarms.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAlarms.map((a) => a.id));
    }
  };

  const handleConfirmAcknowledge = (
    alarmId: string,
    ackBy: string,
    note: string
  ) => {
    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const timestampStr = `${nowTime} WIB`;

    setAlarms((prev) =>
      prev.map((a) =>
        a.id === alarmId
          ? {
              ...a,
              state: 'ACKNOWLEDGED',
              acknowledgedBy: ackBy,
              acknowledgedAt: timestampStr,
              acknowledgementNote: note,
            }
          : a
      )
    );

    // Append to event log stream
    const target = alarms.find((a) => a.id === alarmId);
    if (target) {
      setEvents((prev) => [
        {
          id: `EVT-${Date.now().toString().slice(-4)}`,
          occurredAt: timestampStr,
          eventType: 'ALARM_ACKNOWLEDGED',
          source: target.sourceId,
          sourceType: target.sourceType,
          severity: 'INFO',
          message: `Alarm ${alarmId} (${target.title}) acknowledged by ${ackBy}.`,
          taskId: target.taskId,
          payload: { alarmId, acknowledgedBy: ackBy, note },
        },
        ...prev,
      ]);
    }

    // Update detail drawer if open
    if (detailAlarm?.id === alarmId) {
      setDetailAlarm((prev) =>
        prev
          ? {
              ...prev,
              state: 'ACKNOWLEDGED',
              acknowledgedBy: ackBy,
              acknowledgedAt: timestampStr,
              acknowledgementNote: note,
            }
          : null
      );
    }

    showToast('success', `Alarm ${alarmId} acknowledged by ${ackBy}. State set to ACKNOWLEDGED.`);
  };

  const handleConfirmClear = (
    alarmId: string,
    clearedBy: string,
    reason: string
  ) => {
    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const timestampStr = `${nowTime} WIB`;

    setAlarms((prev) =>
      prev.map((a) =>
        a.id === alarmId
          ? {
              ...a,
              state: 'CLEARED',
              clearedBy,
              clearedAt: timestampStr,
              clearedReason: reason,
              elapsedDuration: 'Resolved',
            }
          : a
      )
    );

    // Append to event log stream
    const target = alarms.find((a) => a.id === alarmId);
    if (target) {
      setEvents((prev) => [
        {
          id: `EVT-${Date.now().toString().slice(-4)}`,
          occurredAt: timestampStr,
          eventType: 'ALARM_CLEARED',
          source: target.sourceId,
          sourceType: target.sourceType,
          severity: 'INFO',
          message: `Alarm ${alarmId} cleared by ${clearedBy}. Resolution: ${reason}`,
          taskId: target.taskId,
          payload: { alarmId, clearedBy, reason },
        },
        ...prev,
      ]);
    }

    if (detailAlarm?.id === alarmId) {
      setDetailAlarm((prev) =>
        prev
          ? {
              ...prev,
              state: 'CLEARED',
              clearedBy,
              clearedAt: timestampStr,
              clearedReason: reason,
              elapsedDuration: 'Resolved',
            }
          : null
      );
    }

    showToast('success', `Alarm ${alarmId} resolved & marked as CLEARED.`);
  };

  const handleBulkAcknowledge = () => {
    if (selectedIds.length === 0) return;
    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const timestampStr = `${nowTime} WIB`;
    const count = selectedIds.length;

    setAlarms((prev) =>
      prev.map((a) =>
        selectedIds.includes(a.id) && a.state === 'ACTIVE'
          ? {
              ...a,
              state: 'ACKNOWLEDGED',
              acknowledgedBy: 'Budi Santoso (Batch Ack)',
              acknowledgedAt: timestampStr,
              acknowledgementNote: 'Batch acknowledged by shift supervisor from main desk.',
            }
          : a
      )
    );

    setSelectedIds([]);
    showToast('success', `Batch acknowledged ${count} selected alarms.`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      playAlertChime();
      showToast('info', 'Live alarm states synchronized with PUDU RCS Cloud & OPC UA nodes.');
    }, 600);
  };

  const handleToggleAudio = () => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      if (!next) {
        showToast('info', 'Alarm audible siren enabled. Audio test chime dispatched.');
        setTimeout(() => playAlertChime(), 200);
      } else {
        showToast('warning', 'Alarm audible siren muted by operator.');
      }
      return next;
    });
  };

  const handleExportCsv = () => {
    const headers = [
      'Alarm ID',
      'Code',
      'Title',
      'Severity',
      'ISA State',
      'Category',
      'Source Asset',
      'Subsystem',
      'Location',
      'Facility',
      'Task ID',
      'Occurred At',
      'Duration (Min)',
      'Acknowledged By',
      'Acknowledged At',
      'Cleared By',
      'Cleared At',
      'Resolution Reason',
    ];

    const dataToExport =
      selectedIds.length > 0
        ? alarms.filter((a) => selectedIds.includes(a.id))
        : filteredAlarms;

    const rows = dataToExport.map((a) => [
      a.id,
      a.code,
      a.title,
      a.severity,
      a.state,
      a.category,
      a.sourceId,
      a.sourceType,
      a.sourceLocation,
      a.facility,
      a.taskId || '',
      a.occurredAt,
      a.durationMinutes,
      a.acknowledgedBy || '',
      a.acknowledgedAt || '',
      a.clearedBy || '',
      a.clearedAt || '',
      a.clearedReason || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `syntra-alarms-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', `Exported ${dataToExport.length} alarms to CSV.`);
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
        {/* =========================================================
            1. PAGE HEADER ROW
        ========================================================= */}
        <div className="page-header-row">
          <div>
            <h1 className="page-title" style={{ margin: 0, marginBottom: '4px' }}>
              Alarms &amp; Events
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Centralized incident management, 3-state tracking (Active &rarr; Acknowledged &rarr; Cleared), and technical telemetry payloads for AMR fleet, conveyors, lifts, and integration adapters.
            </p>
          </div>

          <div className="page-actions">
            {/* Facility Selector */}
            <div style={{ position: 'relative' }}>
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="select-input"
                style={{
                  appearance: 'none',
                  paddingRight: '28px',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  height: '34px',
                  paddingLeft: '10px',
                  fontSize: '12px',
                  color: '#1e293b',
                  cursor: 'pointer',
                }}
              >
                <option value="Main Warehouse · Bekasi">Main Warehouse · Bekasi</option>
                <option value="Karawang Plant · Staging">Karawang Plant · Staging</option>
                <option value="Sunter Logistics Hub">Sunter Logistics Hub</option>
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: '9px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                }}
              />
            </div>

            {/* Quick Bulk Acknowledge (if items selected) */}
            {selectedIds.length > 0 && (
              <button
                type="button"
                id="btn-bulk-ack-header"
                onClick={handleBulkAcknowledge}
                className="btn-primary"
                style={{
                  height: '34px',
                  backgroundColor: '#00529C',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={14} />
                Bulk Acknowledge ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* =========================================================
            2. FIVE GRADIENT KPI CARDS
        ========================================================= */}
        <AlarmKpis
          metrics={metrics}
          onSelectTab={(tabKey) => {
            setFilterState((prev) => ({ ...prev, tab: tabKey }));
          }}
        />

        {/* =========================================================
            3. ALARM TOOLBAR (TABS, SEARCH, SEVERITY, AUDIO, REFRESH)
        ========================================================= */}
        <AlarmToolbar
          filter={filterState}
          onFilterChange={(updates) => setFilterState((prev) => ({ ...prev, ...updates }))}
          counts={counts}
          isAudioMuted={isAudioMuted}
          onToggleAudio={handleToggleAudio}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onExportCsv={handleExportCsv}
        />

        {/* =========================================================
            4. MAIN DATA PANEL (TABLE VIEW OR TELEMETRY EVENT STREAM)
        ========================================================= */}
        <div
          className="panel"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          {/* Bulk Action Header Banner (when checkboxes checked) */}
          {filterState.tab !== 'EVENTS' && selectedIds.length > 0 && (
            <div
              style={{
                padding: '10px 18px',
                backgroundColor: '#eff6ff',
                borderBottom: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: 600 }}>
                <span>{selectedIds.length} alarms selected for batch intervention</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  id="btn-bulk-ack-banner"
                  onClick={handleBulkAcknowledge}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    backgroundColor: '#00529C',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <Clock size={12} />
                  Acknowledge Selected
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '5px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#2563eb',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={12} />
                  Export Selected
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  style={{
                    padding: '4px 8px',
                    background: 'none',
                    border: 'none',
                    fontSize: '11.5px',
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  Deselect all
                </button>
              </div>
            </div>
          )}

          {/* Conditional Rendering based on Tab */}
          {filterState.tab !== 'EVENTS' ? (
            <AlarmTable
              alarms={filteredAlarms}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onSelectAlarm={(alarm) => setDetailAlarm(alarm)}
              onOpenAcknowledge={(alarm) => setAckTargetAlarm(alarm)}
              onOpenClear={(alarm) => setClearTargetAlarm(alarm)}
            />
          ) : (
            <EventStreamTable
              events={events}
              searchQuery={filterState.search}
            />
          )}

          {/* Panel Footer */}
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid #f1f5f9',
              backgroundColor: '#fafbfc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              color: '#64748b',
            }}
          >
            <span>
              {filterState.tab !== 'EVENTS'
                ? `Showing ${filteredAlarms.length} of ${alarms.length} registered alarms`
                : `Streaming ${events.length} system telemetry events`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span>ISA-18.2 Alarm Rationalization Active</span>
              <span style={{ color: '#cbd5e1' }}>&bull;</span>
              <span>Audio siren: {isAudioMuted ? 'Muted' : 'Armed'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          5. MODALS & DRAWERS
      ========================================================= */}
      {/* Alarm Detail & Investigation Drawer */}
      <AlarmDetailDrawer
        alarm={detailAlarm}
        onClose={() => setDetailAlarm(null)}
        onAcknowledge={(alarm) => {
          setDetailAlarm(null);
          setAckTargetAlarm(alarm);
        }}
        onClear={(alarm) => {
          setDetailAlarm(null);
          setClearTargetAlarm(alarm);
        }}
      />

      {/* Acknowledge Modal */}
      <AcknowledgeModal
        isOpen={!!ackTargetAlarm}
        alarm={ackTargetAlarm}
        onClose={() => setAckTargetAlarm(null)}
        onConfirm={handleConfirmAcknowledge}
      />

      {/* Clear Alarm Modal */}
      <ClearAlarmModal
        isOpen={!!clearTargetAlarm}
        alarm={clearTargetAlarm}
        onClose={() => setClearTargetAlarm(null)}
        onConfirm={handleConfirmClear}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div
          id="alarm-toast-notification"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor:
              toast.type === 'success'
                ? '#065f46'
                : toast.type === 'warning'
                ? '#9a3412'
                : '#1e3a8a',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '13px',
            fontWeight: 500,
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: '#34d399' }} />}
          {toast.type === 'warning' && <AlertCircle size={18} style={{ color: '#fdba74' }} />}
          {toast.type === 'info' && <Sparkles size={18} style={{ color: '#93c5fd' }} />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              marginLeft: '8px',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </AppShell>
  );
}
