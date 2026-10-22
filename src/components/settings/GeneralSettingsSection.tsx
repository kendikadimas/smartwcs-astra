'use client';

import React from 'react';
import { GeneralSettings } from '@/types/settings';
import { Building2, Globe, Clock, ShieldAlert } from 'lucide-react';

interface GeneralSettingsSectionProps {
  settings: GeneralSettings;
  onChange: (updated: GeneralSettings) => void;
}

export function GeneralSettingsSection({
  settings,
  onChange,
}: GeneralSettingsSectionProps) {
  return (
    <div className="panel" style={{ borderRadius: '0 0 8px 8px', borderTop: 'none', padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
          Facility Identification &amp; Regional Localization
        </h3>
        <p style={{ fontSize: '11.5px', color: '#64748b' }}>
          Define the warehouse plant identity, operating timezone, and user interface preferences.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
        {/* Facility Name */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Facility / Warehouse Name
          </label>
          <input
            type="text"
            value={settings.facilityName}
            onChange={(e) => onChange({ ...settings, facilityName: e.target.value })}
            className="input-field"
            style={{ width: '100%', fontSize: '12px', padding: '8px 12px' }}
          />
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Official name displayed across dashboards and export reports.
          </span>
        </div>

        {/* Facility Code */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Facility Code (SAP / WMS Key)
          </label>
          <input
            type="text"
            value={settings.facilityCode}
            onChange={(e) => onChange({ ...settings, facilityCode: e.target.value })}
            className="input-field"
            style={{ width: '100%', fontSize: '12px', padding: '8px 12px', fontFamily: 'var(--font-mono)' }}
          />
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Unique code used for integration routing (e.g. BKS-WH-01).
          </span>
        </div>

        {/* Operating Timezone */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Operating Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => onChange({ ...settings, timezone: e.target.value })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value="Asia/Jakarta (WIB, UTC+7)">Asia/Jakarta (WIB, UTC+7)</option>
            <option value="Asia/Makassar (WITA, UTC+8)">Asia/Makassar (WITA, UTC+8)</option>
            <option value="Asia/Jayapura (WIT, UTC+9)">Asia/Jayapura (WIT, UTC+9)</option>
            <option value="UTC">UTC (Universal Coordinated Time)</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Internal timestamps stored as UTC; display converted to this zone.
          </span>
        </div>

        {/* Language */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            System Interface Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => onChange({ ...settings, language: e.target.value as 'en' | 'id' })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value="en">English (US - Industrial Standard)</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Default language for operators and supervisors.
          </span>
        </div>

        {/* Date Format */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Date &amp; Time Display Format
          </label>
          <select
            value={settings.dateFormat}
            onChange={(e) => onChange({ ...settings, dateFormat: e.target.value })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px', fontFamily: 'var(--font-mono)' }}
          >
            <option value="DD/MM/YYYY HH:mm:ss">DD/MM/YYYY HH:mm:ss (22/10/2026 08:30:00)</option>
            <option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss (ISO 8601)</option>
            <option value="DD MMM YYYY, HH:mm WIB">DD MMM YYYY, HH:mm WIB (22 Oct 2026)</option>
          </select>
        </div>

        {/* Auto Refresh Interval */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Dashboard Polling Refresh Rate
          </label>
          <select
            value={settings.autoRefreshIntervalSeconds}
            onChange={(e) => onChange({ ...settings, autoRefreshIntervalSeconds: Number(e.target.value) })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value={2}>2 seconds (Real-time telemetry)</option>
            <option value={5}>5 seconds (Standard balance)</option>
            <option value={10}>10 seconds (Low bandwidth mode)</option>
            <option value={30}>30 seconds</option>
          </select>
        </div>
      </div>

      {/* Maintenance Mode Toggle */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: settings.maintenanceMode ? '#fef2f2' : '#f8fafc',
          border: settings.maintenanceMode ? '1px solid #fecaca' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: settings.maintenanceMode ? '#fee2e2' : '#e2e8f0',
              color: settings.maintenanceMode ? '#b91c1c' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Facility Maintenance Mode
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              When enabled, incoming WMS and ERP tasks are held in QUEUED state without being dispatched to robots.
            </div>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => onChange({ ...settings, maintenanceMode: e.target.checked })}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600, color: settings.maintenanceMode ? '#b91c1c' : '#334155' }}>
            {settings.maintenanceMode ? 'ENABLED (DISPATCH PAUSED)' : 'NORMAL OPERATION'}
          </span>
        </label>
      </div>
    </div>
  );
}
