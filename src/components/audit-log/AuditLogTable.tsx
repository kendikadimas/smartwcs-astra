'use client';

import React, { useState } from 'react';
import { AuditLogItem } from '@/types/auditLog';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  Shield,
  Clock,
} from 'lucide-react';

interface AuditLogTableProps {
  logs: AuditLogItem[];
  onInspectDiff: (log: AuditLogItem) => void;
}

export function AuditLogTable({
  logs,
  onInspectDiff,
}: AuditLogTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const paginatedLogs = logs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'TASK_MUTATION':
        return { bg: '#eff6ff', text: '#0284c7', border: '#bae6fd' };
      case 'ALARM_ACTION':
        return { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' };
      case 'EQUIPMENT_CONTROL':
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
      case 'SYSTEM_CONFIG':
        return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' };
      case 'INTEGRATION_SYNC':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Table Body */}
      <div className="panel-body" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ width: '180px' }}>Audit ID &amp; Time</th>
              <th>Actor / Role</th>
              <th>Category</th>
              <th>Action Name</th>
              <th>Target Entity</th>
              <th style={{ textAlign: 'center' }}>Result</th>
              <th>IP Address</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Diff</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No audit log entries matching criteria.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const catTheme = getCategoryTheme(log.actionCategory);
                const isSuccess = log.result === 'SUCCESS';

                return (
                  <tr key={log.auditId}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0284c7', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {log.auditId}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {log.occurredAt}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.userFullName}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        @{log.username} · {log.roleName.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: catTheme.bg,
                          color: catTheme.text,
                          border: `1px solid ${catTheme.border}`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}
                      >
                        {log.actionCategory.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#334155', fontSize: '11.5px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.targetLabel}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        ID: {log.targetId}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: isSuccess ? '#15803d' : '#b91c1c',
                          backgroundColor: isSuccess ? '#dcfce7' : '#fee2e2',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {log.result}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#475569' }}>
                      {log.ipAddress}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onInspectDiff(log)}
                        className="btn-icon"
                        title="Inspect change before/after values"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#475569',
                        }}
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '11.5px',
          color: '#64748b',
        }}
      >
        <span>
          Showing {logs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, logs.length)} of {logs.length} audit entries
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11px', height: '26px' }}
          >
            <ChevronLeft size={13} />
            Prev
          </button>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11px', height: '26px' }}
          >
            Next
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
