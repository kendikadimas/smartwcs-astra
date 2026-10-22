'use client';

import React, { useState, useMemo } from 'react';
import {
  IntegrationLogItem,
  IntegrationLogFilterState,
  LogDirection,
  LogStatus,
} from '@/types/integration';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Code2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
} from 'lucide-react';

interface IntegrationLogTableProps {
  logs: IntegrationLogItem[];
  onInspectLog: (log: IntegrationLogItem) => void;
  onRetryLog?: (log: IntegrationLogItem) => void;
}

export function IntegrationLogTable({
  logs,
  onInspectLog,
  onRetryLog,
}: IntegrationLogTableProps) {
  const [filterState, setFilterState] = useState<IntegrationLogFilterState>({
    search: '',
    system: 'ALL',
    direction: 'ALL',
    status: 'ALL',
    timeRange: 'ALL',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      if (filterState.search.trim()) {
        const q = filterState.search.toLowerCase();
        const matchesTrace = log.traceId.toLowerCase().includes(q);
        const matchesType = log.messageType.toLowerCase().includes(q);
        const matchesRobot = log.robotId?.toLowerCase().includes(q) || log.robotName?.toLowerCase().includes(q);
        const matchesAdapter = log.adapterName.toLowerCase().includes(q);
        if (!matchesTrace && !matchesType && !matchesRobot && !matchesAdapter) {
          return false;
        }
      }

      // Direction
      if (filterState.direction !== 'ALL' && log.direction !== filterState.direction) {
        return false;
      }

      // System
      if (filterState.system !== 'ALL' && log.systemType !== filterState.system) {
        return false;
      }

      // Status
      if (filterState.status !== 'ALL' && log.status !== filterState.status) {
        return false;
      }

      return true;
    });
  }, [logs, filterState]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div id="logs" className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header Row */}
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
            <Code2 size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
              Integration Message Logs (<code>IntegrationLog</code>)
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Idempotent audit trail of inbound webhook callbacks and outbound vendor commands
            </div>
          </div>
        </div>

        {/* Filter Ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
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
              placeholder="Search trace, type, robot..."
              value={filterState.search}
              onChange={(e) => {
                setFilterState({ ...filterState, search: e.target.value });
                setCurrentPage(1);
              }}
              className="search-input"
              style={{
                width: '100%',
                paddingLeft: '28px',
                fontSize: '11.5px',
                height: '30px',
              }}
            />
          </div>

          {/* Direction Filter */}
          <select
            value={filterState.direction}
            onChange={(e) => {
              setFilterState({ ...filterState, direction: e.target.value });
              setCurrentPage(1);
            }}
            className="select-input"
            style={{ height: '30px', fontSize: '11.5px', padding: '0 8px' }}
          >
            <option value="ALL">All Directions</option>
            <option value="INBOUND">Inbound (Webhooks)</option>
            <option value="OUTBOUND">Outbound (Commands)</option>
          </select>

          {/* System Filter */}
          <select
            value={filterState.system}
            onChange={(e) => {
              setFilterState({ ...filterState, system: e.target.value });
              setCurrentPage(1);
            }}
            className="select-input"
            style={{ height: '30px', fontSize: '11.5px', padding: '0 8px' }}
          >
            <option value="ALL">All Systems</option>
            <option value="RCS">PUDU RCS</option>
            <option value="WMS">Astra WMS</option>
            <option value="PLC">Mitsubishi PLC</option>
            <option value="ERP">SAP ERP</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterState.status}
            onChange={(e) => {
              setFilterState({ ...filterState, status: e.target.value });
              setCurrentPage(1);
            }}
            className="select-input"
            style={{ height: '30px', fontSize: '11.5px', padding: '0 8px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending (Queue)</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="panel-body" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ width: '190px' }}>Trace ID</th>
              <th style={{ width: '100px' }}>Direction</th>
              <th>System Adapter</th>
              <th>Message Type</th>
              <th>Target / Robot</th>
              <th style={{ textAlign: 'center' }}>HTTP Code</th>
              <th>Callback Code</th>
              <th style={{ textAlign: 'center' }}>Attempts</th>
              <th>Occurred At</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Payload</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No integration logs found matching the filter criteria.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const isSuccess = log.status === 'SUCCESS';
                const isFailed = log.status === 'FAILED';
                const isInbound = log.direction === 'INBOUND';

                return (
                  <tr key={log.logId}>
                    <td>
                      <button
                        onClick={() => onInspectLog(log)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0284c7',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          textAlign: 'left',
                          display: 'block',
                          textDecoration: 'underline',
                        }}
                        title="Click to inspect raw JSON payload"
                      >
                        {log.traceId}
                      </button>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor: isInbound ? '#ecfdf5' : '#eff6ff',
                          color: isInbound ? '#059669' : '#0284c7',
                          border: `1px solid ${isInbound ? '#a7f3d0' : '#bae6fd'}`,
                        }}
                      >
                        {isInbound ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                        {log.direction}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.adapterName}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{log.systemType} Gateway</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#334155',
                          backgroundColor: '#f1f5f9',
                          padding: '2px 5px',
                          borderRadius: '3px',
                        }}
                      >
                        {log.messageType}
                      </span>
                    </td>
                    <td>
                      {log.robotId ? (
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {log.robotId}{' '}
                          <span style={{ fontSize: '10.5px', fontWeight: 400, color: '#64748b' }}>
                            ({log.robotName})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>— System Level —</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {log.httpStatus && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: log.httpStatus < 400 ? '#dcfce7' : '#fee2e2',
                            color: log.httpStatus < 400 ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {log.httpStatus}
                        </span>
                      )}
                    </td>
                    <td>
                      {log.callbackCodeValid !== undefined ? (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            color: log.callbackCodeValid ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {log.callbackCodeValid ? 'Verified' : 'Invalid'}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '10.5px' }}>N/A (Outbound)</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', color: '#475569', fontSize: '11px' }}>
                      {log.attempts}/{log.maxAttempts}
                    </td>
                    <td style={{ fontSize: '11px', color: '#475569' }}>
                      {log.occurredAt}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onInspectLog(log)}
                        className="btn-icon"
                        title="View JSON Payload"
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
                        <Code2 size={13} />
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
          Showing {filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} logs
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
