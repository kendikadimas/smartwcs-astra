'use client';

import React, { useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { IntegrationHeaderToolbar } from '@/components/integrations/IntegrationHeaderToolbar';
import { IntegrationKpiCards } from '@/components/integrations/IntegrationKpiCards';
import { AdapterCardGrid } from '@/components/integrations/AdapterCardGrid';
import { IntegrationLogTable } from '@/components/integrations/IntegrationLogTable';
import { PayloadInspectorDrawer } from '@/components/integrations/PayloadInspectorDrawer';
import { IntegrationDetailModal } from '@/components/integrations/IntegrationDetailModal';
import { SyncFleetModal } from '@/components/integrations/SyncFleetModal';
import {
  mockIntegrationMetrics,
  mockAdapters,
  initialMockIntegrationLogs,
} from '@/data/mockIntegrations';
import {
  IntegrationAdapterItem,
  IntegrationLogItem,
} from '@/types/integration';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastState {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export default function IntegrationsPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState('Main Warehouse · Bekasi');
  const [adapters, setAdapters] = useState<IntegrationAdapterItem[]>(mockAdapters);
  const [logs, setLogs] = useState<IntegrationLogItem[]>(initialMockIntegrationLogs);
  const [metrics, setMetrics] = useState(mockIntegrationMetrics);

  // Modals & Drawer State
  const [selectedLog, setSelectedLog] = useState<IntegrationLogItem | null>(null);
  const [configTargetAdapter, setConfigTargetAdapter] = useState<IntegrationAdapterItem | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: 'success' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Ping Single Adapter
  const handlePingAdapter = (adapter: IntegrationAdapterItem) => {
    setPingingId(adapter.id);
    setTimeout(() => {
      setPingingId(null);
      showToast('success', `Health ping to ${adapter.name} succeeded (${adapter.latencyMs}ms roundtrip)`);
    }, 500);
  };

  // Test All Connections
  const handleTestAllConnections = () => {
    setIsTestingAll(true);
    setTimeout(() => {
      setIsTestingAll(false);
      showToast('success', 'All 4 external adapters tested successfully: 100% online');
    }, 800);
  };

  // Save Adapter Config
  const handleSaveAdapter = (updated: IntegrationAdapterItem) => {
    setAdapters((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    showToast('success', `Configuration for ${updated.name} updated successfully`);
  };

  return (
    <AppShell>
      {/* Toast Notification */}
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

      {/* Header Toolbar */}
      <IntegrationHeaderToolbar
        selectedWarehouse={selectedWarehouse}
        onSelectWarehouse={setSelectedWarehouse}
        onTestAllConnections={handleTestAllConnections}
        isTesting={isTestingAll}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenAddModal={() => showToast('info', 'Adapter registration dialog: Enter endpoint, protocol, and credentials')}
      />

      {/* 6 Top Integration Health KPI Cards */}
      <IntegrationKpiCards metrics={metrics} />

      {/* Adapter Cards Grid (PUDU, WMS, PLC, ERP) */}
      <AdapterCardGrid
        adapters={adapters}
        onConfigureAdapter={(adapter) => setConfigTargetAdapter(adapter)}
        onPingAdapter={handlePingAdapter}
        onSyncFleet={() => setIsSyncModalOpen(true)}
        pingingId={pingingId}
      />

      {/* Integration Message Exchange Logs Explorer */}
      <div style={{ marginBottom: '24px' }}>
        <IntegrationLogTable
          logs={logs}
          onInspectLog={(log) => setSelectedLog(log)}
          onRetryLog={(log) => showToast('info', `Queued retry for ${log.traceId}`)}
        />
      </div>

      {/* Footer Disclaimer */}
      <div className="footer-disclaimer">
        <span>
          WCS coordinates tasks &amp; dispatch, WMS: inventory · RCS: robot execution · PLC: equipment control · Safety authority remains external.
        </span>
        <span className="demo-snapshot-tag">
          DEMO SNAPSHOT · {selectedWarehouse} · 22 Oct 2026, 09:15 WIB
        </span>
      </div>

      {/* Modals & Drawers */}
      <PayloadInspectorDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />

      <IntegrationDetailModal
        isOpen={Boolean(configTargetAdapter)}
        onClose={() => setConfigTargetAdapter(null)}
        adapter={configTargetAdapter}
        onSave={handleSaveAdapter}
      />

      <SyncFleetModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSuccess={(msg) => showToast('success', msg)}
      />
    </AppShell>
  );
}
