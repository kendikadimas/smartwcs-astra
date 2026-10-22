'use client';

import React from 'react';
import { Settings, Save, RotateCcw, Check, Sliders } from 'lucide-react';

interface SettingsHeaderToolbarProps {
  isDirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onOpenResetModal: () => void;
  isSaving: boolean;
}

export function SettingsHeaderToolbar({
  isDirty,
  onSave,
  onDiscard,
  onOpenResetModal,
  isSaving,
}: SettingsHeaderToolbarProps) {
  return (
    <div className="page-header-row" style={{ marginBottom: '16px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 className="page-title">System Settings &amp; Global Configuration</h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#0284c7',
              backgroundColor: '#e0f2fe',
              padding: '2px 8px',
              borderRadius: '9999px',
              border: '1px solid #bae6fd',
            }}
          >
            PRD FR-11
          </span>
          {isDirty && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#b45309',
                backgroundColor: '#fef3c7',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #fde68a',
              }}
            >
              Unsaved Changes
            </span>
          )}
        </div>
        <p className="page-subtitle">
          Configure dispatch thresholds, battery return rules, safety interlocks, log retention periods, and network parameters.
        </p>
      </div>

      <div className="page-actions">
        {/* Reset Defaults Action */}
        <button
          onClick={onOpenResetModal}
          className="btn-secondary"
          title="Restore factory default parameters"
        >
          <RotateCcw size={13} />
          <span>Reset Defaults</span>
        </button>

        {/* Discard Changes Button */}
        {isDirty && (
          <button
            onClick={onDiscard}
            className="btn-secondary"
            title="Discard unsaved changes"
          >
            <span>Discard</span>
          </button>
        )}

        {/* Save Settings Button */}
        <button
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className="btn-primary"
          style={{ opacity: !isDirty ? 0.65 : 1 }}
        >
          <Save size={14} />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
