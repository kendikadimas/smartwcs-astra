'use client';

import React from 'react';
import { RetentionSettings } from '@/types/settings';
import { Database, Archive, HardDrive, Calendar, Trash2 } from 'lucide-react';

interface RetentionSettingsSectionProps {
  settings: RetentionSettings;
  onChange: (updated: RetentionSettings) => void;
}

export function RetentionSettingsSection({
  settings,
  onChange,
}: RetentionSettingsSectionProps) {
  return (
    <div className="panel" style={{ borderRadius: '0 0 8px 8px', borderTop: 'none', padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
          Data Retention &amp; Partition Storage Policy
        </h3>
        <p style={{ fontSize: '11.5px', color: '#64748b' }}>
          Manage lifecycle policies for high-frequency telemetry, vendor callback queues, and compliance audit records.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Robot Pose Log Retention */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Robot Pose Log Retention (<code>PuduPoseLog</code>)</span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>{settings.poseLogRetentionDays} Days</span>
          </label>
          <select
            value={settings.poseLogRetentionDays}
            onChange={(e) => onChange({ ...settings, poseLogRetentionDays: Number(e.target.value) })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value={30}>30 Days (1 Monthly Partition)</option>
            <option value={60}>60 Days (2 Partitions - Recommended)</option>
            <option value={90}>90 Days (Quarterly Audit)</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Monthly partitioned table storing raw AMR (x, y, angle) coordinates. Older partitions are dropped automatically.
          </span>
        </div>

        {/* Integration Log Retention */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Integration Message Log Retention (<code>IntegrationLog</code>)</span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>{settings.integrationLogRetentionDays} Days</span>
          </label>
          <select
            value={settings.integrationLogRetentionDays}
            onChange={(e) => onChange({ ...settings, integrationLogRetentionDays: Number(e.target.value) })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
            <option value={45}>45 Days (Standard)</option>
            <option value={60}>60 Days</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Raw JSON payloads received from PUDU callbacks and outbound dispatch commands.
          </span>
        </div>

        {/* Audit Log Retention */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Security &amp; Audit Trail Retention (<code>AuditLog</code>)</span>
            <span style={{ color: '#059669', fontWeight: 700 }}>{settings.auditLogRetentionDays} Days</span>
          </label>
          <select
            value={settings.auditLogRetentionDays}
            onChange={(e) => onChange({ ...settings, auditLogRetentionDays: Number(e.target.value) })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value={180}>180 Days (6 Months)</option>
            <option value={365}>365 Days (1 Year - Plant Compliance)</option>
            <option value={730}>730 Days (2 Years)</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Immutable records of operator manual overrides, task cancellations, and config updates.
          </span>
        </div>

        {/* Event Log Retention */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Equipment Event &amp; Error History</span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>{settings.eventLogRetentionDays} Days</span>
          </label>
          <select
            value={settings.eventLogRetentionDays}
            onChange={(e) => onChange({ ...settings, eventLogRetentionDays: Number(e.target.value) })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value={60}>60 Days</option>
            <option value={90}>90 Days (Recommended)</option>
            <option value={180}>180 Days</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Equipment alarms, obstacle stops, and sensor warnings history.
          </span>
        </div>
      </div>

      {/* Auto Archive Storage */}
      <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
              Cold Storage Automatic Archival (S3 / MinIO)
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Export expired database partitions to compressed parquet archives before dropping tables.
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.autoArchiveEnabled}
              onChange={(e) => onChange({ ...settings, autoArchiveEnabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155' }}>
              {settings.autoArchiveEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </label>
        </div>

        <input
          type="text"
          disabled={!settings.autoArchiveEnabled}
          value={settings.archiveStorageBucket}
          onChange={(e) => onChange({ ...settings, archiveStorageBucket: e.target.value })}
          className="input-field"
          style={{ width: '100%', fontSize: '12px', padding: '8px 12px', fontFamily: 'var(--font-mono)' }}
        />
      </div>
    </div>
  );
}
