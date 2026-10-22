'use client';

import React from 'react';
import { DispatchSettings, ChargingStrategy } from '@/types/settings';
import { Bot, Battery, Zap, RotateCcw, Gauge } from 'lucide-react';

interface DispatchSettingsSectionProps {
  settings: DispatchSettings;
  onChange: (updated: DispatchSettings) => void;
}

export function DispatchSettingsSection({
  settings,
  onChange,
}: DispatchSettingsSectionProps) {
  return (
    <div className="panel" style={{ borderRadius: '0 0 8px 8px', borderTop: 'none', padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
          Dispatching Engine &amp; AMR Fleet Parameters
        </h3>
        <p style={{ fontSize: '11.5px', color: '#64748b' }}>
          Define automated allocation policies, battery return docks, retry limits, and robot kinematics.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
        {/* Low Battery Return Threshold */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Auto Return to Charging Dock Threshold</span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>{settings.lowBatteryThresholdPercent}%</span>
          </label>
          <input
            type="range"
            min={15}
            max={40}
            step={1}
            value={settings.lowBatteryThresholdPercent}
            onChange={(e) => onChange({ ...settings, lowBatteryThresholdPercent: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#0284c7' }}
          />
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            When battery drops below this, AMR will not accept new missions and dispatches to nearest dock.
          </span>
        </div>

        {/* Critical Battery Emergency Stop Threshold */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Critical Battery Cutoff Threshold</span>
            <span style={{ color: '#b91c1c', fontWeight: 700 }}>{settings.criticalBatteryThresholdPercent}%</span>
          </label>
          <input
            type="range"
            min={5}
            max={15}
            step={1}
            value={settings.criticalBatteryThresholdPercent}
            onChange={(e) => onChange({ ...settings, criticalBatteryThresholdPercent: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#b91c1c' }}
          />
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Emergency threshold where robot halts to protect lithium cell longevity.
          </span>
        </div>

        {/* Max Retry Attempts */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Task Maximum Retry Attempts
          </label>
          <select
            value={settings.maxRetryAttempts}
            onChange={(e) => onChange({ ...settings, maxRetryAttempts: Number(e.target.value) })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value={1}>1 Attempt (No retry on failure)</option>
            <option value={2}>2 Attempts</option>
            <option value={3}>3 Attempts (PRD standard default)</option>
            <option value={5}>5 Attempts</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Number of times WCS re-submits mission to another resource before flagging task as FAILED.
          </span>
        </div>

        {/* Dispatch Timeout */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Robot Acknowledgment Timeout
          </label>
          <select
            value={settings.dispatchTimeoutSeconds}
            onChange={(e) => onChange({ ...settings, dispatchTimeoutSeconds: Number(e.target.value) })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds (Default)</option>
            <option value={60}>60 seconds (High latency network)</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Timeout waiting for AMR vendor API to accept a dispatched delivery mission.
          </span>
        </div>

        {/* Fleet Speed Limit */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>AMR Factory Corridor Speed Limit</span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>{settings.fleetSpeedLimitMps} m/s</span>
          </label>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={settings.fleetSpeedLimitMps}
            onChange={(e) => onChange({ ...settings, fleetSpeedLimitMps: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#0284c7' }}
          />
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Max linear speed sent via PUDU vendor command (Recommended: 1.2 m/s for plant safety).
          </span>
        </div>

        {/* Charging Strategy */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Charging Station Allocation Strategy
          </label>
          <select
            value={settings.chargingStrategy}
            onChange={(e) => onChange({ ...settings, chargingStrategy: e.target.value as ChargingStrategy })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value="NEAREST_DOCK">Nearest Available Dock (Min Travel)</option>
            <option value="LEAST_USED">Round-Robin Equal Wear</option>
            <option value="FAST_CHARGER">Prioritize High-Power Docks (60kW)</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Rule applied by Dispatch Engine when assigning returning robots to charging pads.
          </span>
        </div>
      </div>

      {/* Auto Reassign on Fault toggle */}
      <div
        style={{
          marginTop: '20px',
          padding: '14px 16px',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
            Auto-Reassign Mission on Robot Hardware Fault
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            If assigned AMR experiences an unexpected error or communication loss, automatically re-dispatch task to next available robot.
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.autoReassignOnFault}
            onChange={(e) => onChange({ ...settings, autoReassignOnFault: e.target.checked })}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155' }}>
            {settings.autoReassignOnFault ? 'ENABLED' : 'DISABLED'}
          </span>
        </label>
      </div>
    </div>
  );
}
