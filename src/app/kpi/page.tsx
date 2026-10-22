'use client';

import React, { useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { KpiHeaderToolbar } from '@/components/kpi/KpiHeaderToolbar';
import { KpiSummaryCards } from '@/components/kpi/KpiSummaryCards';
import { ThroughputTrendChart } from '@/components/kpi/ThroughputTrendChart';
import { FleetUtilizationPanel } from '@/components/kpi/FleetUtilizationPanel';
import { AlarmParetoAnalysis } from '@/components/kpi/AlarmParetoAnalysis';
import { CycleTimeBreakdown } from '@/components/kpi/CycleTimeBreakdown';
import { ShiftReportTable } from '@/components/kpi/ShiftReportTable';
import { KpiExportModal } from '@/components/kpi/KpiExportModal';
import { KpiFilterState } from '@/types/kpi';
import { mockKpiMetrics } from '@/data/mockKpi';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastState {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export default function KpiPage() {
  const [filters, setFilters] = useState<KpiFilterState>({
    warehouse: 'Main Warehouse · Bekasi',
    timeRange: 'today',
    shift: 'all',
    zone: 'all',
  });

  const [metrics, setMetrics] = useState(mockKpiMetrics);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: 'success' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('success', 'KPI analytics and operational reports synchronized');
    }, 600);
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
            backgroundColor: toast.type === 'success' ? '#0f172a' : '#7f1d1d',
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
            <AlertCircle size={16} color="#f87171" />
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

      {/* Main Page Header & Filters */}
      <KpiHeaderToolbar
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Top 6 KPI Performance Gradient Cards */}
      <KpiSummaryCards metrics={metrics} />

      {/* Section 1: Throughput Trends (60%) + Fleet Productivity (40%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
          gap: '16px',
          marginBottom: '18px',
        }}
      >
        <ThroughputTrendChart timeRange={filters.timeRange} />
        <FleetUtilizationPanel />
      </div>

      {/* Section 2: Alarm Pareto Analysis (50%) + Cycle Time SLAs (50%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '16px',
          marginBottom: '18px',
        }}
      >
        <AlarmParetoAnalysis />
        <CycleTimeBreakdown />
      </div>

      {/* Section 3: Historical Shift Performance Reports Table */}
      <div style={{ marginBottom: '24px' }}>
        <ShiftReportTable
          onExportRow={(report) =>
            showToast('success', `Exported shift record ${report.id} to CSV`)
          }
        />
      </div>

      {/* Footer Operational Boundary Disclaimer (Consistent across Smart WCS) */}
      <div className="footer-disclaimer">
        <span>
          WCS coordinates tasks &amp; dispatch, WMS: inventory · RCS: robot execution · PLC: equipment control · Safety authority remains external.
        </span>
        <span className="demo-snapshot-tag">
          DEMO SNAPSHOT · {filters.warehouse} · 22 Oct 2026, 08:15 WIB
        </span>
      </div>

      {/* Export Report Modal */}
      <KpiExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        filters={filters}
        onSuccess={(msg) => showToast('success', msg)}
      />
    </AppShell>
  );
}
