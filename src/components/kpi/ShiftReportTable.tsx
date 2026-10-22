'use client';

import React, { useState, useMemo } from 'react';
import { ShiftReportItem } from '@/types/kpi';
import { mockShiftReports } from '@/data/mockKpi';
import {
  Search,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

interface ShiftReportTableProps {
  onExportRow?: (report: ShiftReportItem) => void;
}

export function ShiftReportTable({ onExportRow }: ShiftReportTableProps) {
  const [reports] = useState<ShiftReportItem[]>(mockShiftReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.shift.toLowerCase().includes(q) ||
        r.supervisor.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q)
      );
    });
  }, [reports, searchQuery]);

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportCsv = (report: ShiftReportItem) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Report ID,Date,Shift,Warehouse,Total Tasks,Completed,Failed,Avg Cycle Time,Fleet Availability,Mileage Km,Alarm Count,Supervisor,Compliance Rate',
        `"${report.id}","${report.date}","${report.shift}","${report.warehouse}",${report.totalTasks},${report.completed},${report.failed},"${report.avgCycleTime}","${report.fleetAvailability}",${report.mileageKm},${report.alarmCount},"${report.supervisor}","${report.complianceRate}%"`,
      ].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${report.id}-shift-summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Table Header Row */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <ClipboardList size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
              Historical Shift Performance Reports
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              End-of-shift operational audits, fleet mileage, exception counts, and supervisor sign-offs
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '240px' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: '9px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search shift or supervisor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{
              width: '100%',
              paddingLeft: '28px',
              fontSize: '11.5px',
              height: '30px',
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="panel-body" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Report ID</th>
              <th>Date &amp; Shift</th>
              <th>Tasks (Done / Fail)</th>
              <th style={{ textAlign: 'right' }}>Avg Cycle</th>
              <th style={{ textAlign: 'right' }}>Fleet Avail.</th>
              <th style={{ textAlign: 'right' }}>Mileage</th>
              <th style={{ textAlign: 'right' }}>Alarms</th>
              <th>Supervisor on Duty</th>
              <th>Compliance</th>
              <th style={{ width: '70px', textAlign: 'center' }}>Export</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReports.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No shift reports found matching &quot;{searchQuery}&quot;
                </td>
              </tr>
            ) : (
              paginatedReports.map((r) => {
                const statusTheme =
                  r.status === 'EXCELLENT'
                    ? { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', label: 'EXCELLENT' }
                    : r.status === 'NORMAL'
                    ? { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: 'NORMAL' }
                    : { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'ATTENTION' };

                return (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                        {r.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.shift}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {r.date} · {r.shiftHours}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#15803d' }}>{r.completed}</span>
                        <span style={{ color: '#94a3b8' }}>/</span>
                        <span style={{ color: '#64748b' }}>{r.totalTasks}</span>
                        {r.failed > 0 && (
                          <span style={{ fontSize: '10.5px', color: '#ef4444', fontWeight: 600 }}>
                            ({r.failed} fail)
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      {r.avgCycleTime}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0369a1' }}>
                      {r.fleetAvailability}
                    </td>
                    <td style={{ textAlign: 'right', color: '#475569' }}>
                      {r.mileageKm} km
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: r.alarmCount > 5 ? '#b45309' : '#475569' }}>
                      {r.alarmCount}
                    </td>
                    <td style={{ color: '#334155', fontWeight: 500 }}>
                      {r.supervisor}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor: statusTheme.bg,
                          color: statusTheme.text,
                          border: `1px solid ${statusTheme.border}`,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}
                      >
                        {r.complianceRate}% · {statusTheme.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleExportCsv(r)}
                        className="btn-icon"
                        title="Download shift CSV"
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
                        <Download size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
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
          Showing {filteredReports.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredReports.length)} of {filteredReports.length} reports
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
