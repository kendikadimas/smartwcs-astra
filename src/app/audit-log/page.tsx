'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuditLogHeaderToolbar } from '@/components/audit-log/AuditLogHeaderToolbar';
import { AuditLogKpiCards } from '@/components/audit-log/AuditLogKpiCards';
import { AuditLogTable } from '@/components/audit-log/AuditLogTable';
import { AuditDiffDrawer } from '@/components/audit-log/AuditDiffDrawer';
import { initialMockAuditLogs, mockAuditMetrics } from '@/data/mockAuditLog';
import { AuditLogItem } from '@/types/auditLog';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastState {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export default function AuditLogPage() {
  const [logs] = useState<AuditLogItem[]>(initialMockAuditLogs);
  const [metrics] = useState(mockAuditMetrics);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');

  // Selected Log for Diff Drawer
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: 'success' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = log.auditId.toLowerCase().includes(q);
        const matchesUser = log.username.toLowerCase().includes(q) || log.userFullName.toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesTarget = log.targetId.toLowerCase().includes(q) || log.targetLabel.toLowerCase().includes(q);
        if (!matchesId && !matchesUser && !matchesAction && !matchesTarget) {
          return false;
        }
      }

      if (categoryFilter !== 'ALL' && log.actionCategory !== categoryFilter) {
        return false;
      }

      if (resultFilter !== 'ALL' && log.result !== resultFilter) {
        return false;
      }

      return true;
    });
  }, [logs, searchQuery, categoryFilter, resultFilter]);

  const handleExportCsv = () => {
    const csvRows: string[] = [
      'Audit ID,Timestamp,Actor,Username,Role,Category,Action,Target ID,Target Description,Result,IP Address',
    ];

    filteredLogs.forEach((l) => {
      csvRows.push(
        `"${l.auditId}","${l.occurredAt}","${l.userFullName}","${l.username}","${l.roleName}","${l.actionCategory}","${l.action}","${l.targetId}","${l.targetLabel}","${l.result}","${l.ipAddress}"`
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `syntra-audit-log-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast('success', `Exported ${filteredLogs.length} audit trail records to CSV`);
  };

  return (
    <AppShell>
      {/* Toast Alert Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#0f172a' : toast.type === 'warning' ? '#78350f' : '#1e3a8a',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12.5px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} color="#4ade80" />
          ) : (
            <AlertCircle size={16} color="#fbbf24" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              marginLeft: '6px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Toolbar */}
      <AuditLogHeaderToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        resultFilter={resultFilter}
        onResultFilterChange={setResultFilter}
        onExportCsv={handleExportCsv}
      />

      {/* 4 Audit Metrics KPI Cards */}
      <AuditLogKpiCards metrics={metrics} />

      {/* Audit Log Table */}
      <div style={{ marginBottom: '24px' }}>
        <AuditLogTable
          logs={filteredLogs}
          onInspectDiff={(log) => setSelectedLog(log)}
        />
      </div>

      {/* Footer Operational Boundary Disclaimer */}
      <div className="footer-disclaimer">
        <span>
          WCS coordinates tasks &amp; dispatch, WMS: inventory · RCS: robot execution · PLC: equipment control · Safety authority remains external.
        </span>
        <span className="demo-snapshot-tag">
          DEMO SNAPSHOT · Immutable Audit Ledger · 22 Oct 2026, 09:55 WIB
        </span>
      </div>

      {/* Diff Inspector Drawer */}
      <AuditDiffDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </AppShell>
  );
}
