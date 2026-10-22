'use client';

import React, { useState } from 'react';
import { KpiFilterState } from '@/types/kpi';
import {
  mockKpiMetrics,
  mockHourlyThroughput,
  mockFleetUtilization,
  mockAlarmPareto,
  mockCycleTimeBreakdown,
  mockShiftReports,
} from '@/data/mockKpi';
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
} from 'lucide-react';

interface KpiExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: KpiFilterState;
  onSuccess: (message: string) => void;
}

export function KpiExportModal({
  isOpen,
  onClose,
  filters,
  onSuccess,
}: KpiExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'json' | 'summary'>('csv');
  const [includeSections, setIncludeSections] = useState({
    kpis: true,
    throughput: true,
    fleet: true,
    alarms: true,
    cycleTimes: true,
    shiftReports: true,
  });

  if (!isOpen) return null;

  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameBase = `syntra-wcs-kpi-report-${filters.timeRange}-${timestamp}`;

    if (format === 'json') {
      const payload: Record<string, unknown> = {
        metadata: {
          facility: filters.warehouse,
          period: filters.timeRange,
          shift: filters.shift,
          zone: filters.zone,
          generatedAt: new Date().toISOString(),
        },
      };

      if (includeSections.kpis) payload.topMetrics = mockKpiMetrics;
      if (includeSections.throughput) payload.throughputTrends = mockHourlyThroughput;
      if (includeSections.fleet) payload.fleetUtilization = mockFleetUtilization;
      if (includeSections.alarms) payload.alarmPareto = mockAlarmPareto;
      if (includeSections.cycleTimes) payload.cycleTimes = mockCycleTimeBreakdown;
      if (includeSections.shiftReports) payload.shiftReports = mockShiftReports;

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${filenameBase}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else if (format === 'csv') {
      const csvRows: string[] = [];
      csvRows.push('# SYNTRA SMART WCS - OPERATIONAL KPI REPORT');
      csvRows.push(`# Facility: ${filters.warehouse}`);
      csvRows.push(`# Period: ${filters.timeRange} | Shift: ${filters.shift}`);
      csvRows.push('');

      if (includeSections.kpis) {
        csvRows.push('## TOP PERFORMANCE METRICS');
        csvRows.push('Metric,Value,Unit,Note');
        csvRows.push(`Total Throughput,${mockKpiMetrics.totalThroughput},pallets,${mockKpiMetrics.throughputDiff}`);
        csvRows.push(`Dispatch Success Rate,${mockKpiMetrics.successRate},%,${mockKpiMetrics.successRateSub}`);
        csvRows.push(`Avg Cycle Time,${mockKpiMetrics.avgCycleTime},min:sec,${mockKpiMetrics.cycleTimeDiff}`);
        csvRows.push(`Fleet Utilization,${mockKpiMetrics.fleetUtilization},%,${mockKpiMetrics.fleetUtilizationSub}`);
        csvRows.push(`Alarm MTTR,${mockKpiMetrics.alarmMttr},min:sec,${mockKpiMetrics.alarmMttrSub}`);
        csvRows.push(`Total Mileage,${mockKpiMetrics.totalMileageKm},km,${mockKpiMetrics.mileageSub}`);
        csvRows.push('');
      }

      if (includeSections.shiftReports) {
        csvRows.push('## SHIFT PERFORMANCE AUDIT TRAIL');
        csvRows.push('Report ID,Date,Shift,Completed,Failed,Avg Cycle,Fleet Avail,Mileage,Alarms,Supervisor,Compliance');
        mockShiftReports.forEach((r) => {
          csvRows.push(
            `"${r.id}","${r.date}","${r.shift}",${r.completed},${r.failed},"${r.avgCycleTime}","${r.fleetAvailability}",${r.mileageKm},${r.alarmCount},"${r.supervisor}","${r.complianceRate}%"`
          );
        });
      }

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvContent);
      downloadAnchor.setAttribute('download', `${filenameBase}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      // Formatted Summary Text
      const textContent = `=====================================================
SYNTRA SMART WCS - EXECUTIVE KPI & REPORT SUMMARY
Warehouse: ${filters.warehouse}
Period: ${filters.timeRange.toUpperCase()} | Shift: ${filters.shift}
Generated: ${new Date().toLocaleString()}
=====================================================

[1. OPERATIONAL HIGHLIGHTS]
- Throughput: ${mockKpiMetrics.totalThroughput} pallets (${mockKpiMetrics.throughputDiff})
- Success Rate: ${mockKpiMetrics.successRate}% (${mockKpiMetrics.successRateSub})
- Average Task Duration: ${mockKpiMetrics.avgCycleTime} (${mockKpiMetrics.cycleTimeDiff})
- Active Fleet Availability: ${mockKpiMetrics.fleetUtilization}%
- Mean Time to Resolve Alarms (MTTR): ${mockKpiMetrics.alarmMttr}
- Fleet Travel Mileage: ${mockKpiMetrics.totalMileageKm} km

[2. TOP ROOT CAUSES OF FLEET PAUSES (PARETO 80/20)]
1. ${mockAlarmPareto[0].category}: ${mockAlarmPareto[0].count} incidents (${mockAlarmPareto[0].percentage}%)
2. ${mockAlarmPareto[1].category}: ${mockAlarmPareto[1].count} incidents (${mockAlarmPareto[1].percentage}%)
3. ${mockAlarmPareto[2].category}: ${mockAlarmPareto[2].count} incidents (${mockAlarmPareto[2].percentage}%)
Note: Top 3 incident types account for 80.6% of overall downtime.

[3. SLA COMPLIANCE SUMMARY]
- Raw Material Delivery: 97.4% on-time (Avg 4m 48s, SLA 6m 00s)
- WIP Transfer: 98.8% on-time (Avg 3m 24s, SLA 4m 30s)
- Finished Goods to Packaging: 96.2% on-time (Avg 4m 06s, SLA 5m 00s)

Astra Otoparts - Division Winteq Smart Warehouse Platform
`;
      const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${filenameBase}-summary.txt`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    onSuccess(`KPI report exported successfully as ${format.toUpperCase()}`);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '520px', maxWidth: '95vw', padding: '24px' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Download size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Export KPI &amp; Performance Report
              </h2>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Download audit summaries, charts data, and shift records
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent' }}>
            <X size={18} />
          </button>
        </div>

        {/* Format Selector Cards */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
            Select File Format
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div
              onClick={() => setFormat('csv')}
              style={{
                border: format === 'csv' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                backgroundColor: format === 'csv' ? '#eff6ff' : '#ffffff',
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <FileSpreadsheet size={22} color={format === 'csv' ? '#0284c7' : '#64748b'} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>CSV Table</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Excel &amp; BI Tool ready</div>
            </div>

            <div
              onClick={() => setFormat('summary')}
              style={{
                border: format === 'summary' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                backgroundColor: format === 'summary' ? '#eff6ff' : '#ffffff',
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={22} color={format === 'summary' ? '#0284c7' : '#64748b'} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Exec Summary</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Clean audit brief (.txt)</div>
            </div>

            <div
              onClick={() => setFormat('json')}
              style={{
                border: format === 'json' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                backgroundColor: format === 'json' ? '#eff6ff' : '#ffffff',
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <FileCode size={22} color={format === 'json' ? '#0284c7' : '#64748b'} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>JSON Data</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Raw programmatic feed</div>
            </div>
          </div>
        </div>

        {/* Section Checkboxes */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
            Include Report Sections
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '11.5px',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeSections.kpis}
                onChange={(e) => setIncludeSections({ ...includeSections, kpis: e.target.checked })}
              />
              <span>Top KPI Metrics</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeSections.throughput}
                onChange={(e) => setIncludeSections({ ...includeSections, throughput: e.target.checked })}
              />
              <span>Throughput Trends</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeSections.fleet}
                onChange={(e) => setIncludeSections({ ...includeSections, fleet: e.target.checked })}
              />
              <span>Fleet Utilization</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeSections.alarms}
                onChange={(e) => setIncludeSections({ ...includeSections, alarms: e.target.checked })}
              />
              <span>Alarm Pareto Breakdown</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeSections.cycleTimes}
                onChange={(e) => setIncludeSections({ ...includeSections, cycleTimes: e.target.checked })}
              />
              <span>Cycle Times &amp; SLAs</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeSections.shiftReports}
                onChange={(e) => setIncludeSections({ ...includeSections, shiftReports: e.target.checked })}
              />
              <span>Historical Shift Audits</span>
            </label>
          </div>
        </div>

        {/* Filter Summary Context */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#f1f5f9',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#475569',
            marginBottom: '20px',
          }}
        >
          <strong>Export Context:</strong> {filters.warehouse} · Period: {filters.timeRange} · Shift: {filters.shift}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleDownload} className="btn-primary">
            <Download size={14} />
            Generate &amp; Download
          </button>
        </div>
      </div>
    </div>
  );
}
