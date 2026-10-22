'use client';

import React, { useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SettingsHeaderToolbar } from '@/components/settings/SettingsHeaderToolbar';
import { SettingsNavTabs } from '@/components/settings/SettingsNavTabs';
import { GeneralSettingsSection } from '@/components/settings/GeneralSettingsSection';
import { DispatchSettingsSection } from '@/components/settings/DispatchSettingsSection';
import { AlarmSafetySection } from '@/components/settings/AlarmSafetySection';
import { RetentionSettingsSection } from '@/components/settings/RetentionSettingsSection';
import { DiagnosticsSection } from '@/components/settings/DiagnosticsSection';
import { ResetDefaultsModal } from '@/components/settings/ResetDefaultsModal';
import { initialFullSystemSettings } from '@/data/mockSettings';
import { FullSystemSettings, SettingsTabKey } from '@/types/settings';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastState {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export default function SettingsPage() {
  const [savedSettings, setSavedSettings] = useState<FullSystemSettings>(initialFullSystemSettings);
  const [currentSettings, setCurrentSettings] = useState<FullSystemSettings>(initialFullSystemSettings);
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('general');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: 'success' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const isDirty = JSON.stringify(savedSettings) !== JSON.stringify(currentSettings);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setSavedSettings(currentSettings);
      setIsSaving(false);
      showToast('success', 'System parameters & operational rules saved successfully');
    }, 500);
  };

  const handleDiscard = () => {
    setCurrentSettings(savedSettings);
    showToast('info', 'Unsaved changes discarded');
  };

  const handleResetConfirm = () => {
    setCurrentSettings(initialFullSystemSettings);
    setSavedSettings(initialFullSystemSettings);
    showToast('warning', 'System parameters reset to Astra Winteq factory baseline');
  };

  const handleRunDiagnostic = (action: string) => {
    if (action === 'socket_ping') {
      showToast('success', 'Socket.IO ping verified: 0 packet loss, 3.2ms latency on /ws');
    } else if (action === 'worker_tick') {
      showToast('success', 'Worker tick triggered: 0 pending messages in IntegrationLog queue');
    } else if (action === 'db_vacuum') {
      showToast('success', 'Database table analysis complete: All 46 tables vacuumed and optimized');
    }
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
      <SettingsHeaderToolbar
        isDirty={isDirty}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        isSaving={isSaving}
      />

      {/* Settings Navigation Tabs */}
      <div style={{ marginBottom: '24px' }}>
        <SettingsNavTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Tab Content Panels */}
        {activeTab === 'general' && (
          <GeneralSettingsSection
            settings={currentSettings.general}
            onChange={(general) => setCurrentSettings({ ...currentSettings, general })}
          />
        )}

        {activeTab === 'dispatch' && (
          <DispatchSettingsSection
            settings={currentSettings.dispatch}
            onChange={(dispatch) => setCurrentSettings({ ...currentSettings, dispatch })}
          />
        )}

        {activeTab === 'safety' && (
          <AlarmSafetySection
            settings={currentSettings.safety}
            onChange={(safety) => setCurrentSettings({ ...currentSettings, safety })}
          />
        )}

        {activeTab === 'retention' && (
          <RetentionSettingsSection
            settings={currentSettings.retention}
            onChange={(retention) => setCurrentSettings({ ...currentSettings, retention })}
          />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsSection
            diagnostics={currentSettings.diagnostics}
            onRunDiagnostic={handleRunDiagnostic}
          />
        )}
      </div>

      {/* Footer Operational Boundary Disclaimer */}
      <div className="footer-disclaimer">
        <span>
          WCS coordinates tasks &amp; dispatch, WMS: inventory · RCS: robot execution · PLC: equipment control · Safety authority remains external.
        </span>
        <span className="demo-snapshot-tag">
          DEMO SNAPSHOT · {currentSettings.general.facilityName} · 22 Oct 2026, 09:45 WIB
        </span>
      </div>

      {/* Reset Defaults Confirmation Modal */}
      <ResetDefaultsModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetConfirm}
      />
    </AppShell>
  );
}
