'use client';

import React from 'react';
import { AlarmSafetySettings } from '@/types/settings';
import { ShieldAlert, Volume2, Bell, AlertTriangle, Mail, Send } from 'lucide-react';

interface AlarmSafetySectionProps {
  settings: AlarmSafetySettings;
  onChange: (updated: AlarmSafetySettings) => void;
}

export function AlarmSafetySection({
  settings,
  onChange,
}: AlarmSafetySectionProps) {
  return (
    <div className="panel" style={{ borderRadius: '0 0 8px 8px', borderTop: 'none', padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
          Safety Interlocks, Alarm Sirens &amp; Notification Rules
        </h3>
        <p style={{ fontSize: '11.5px', color: '#64748b' }}>
          Emergency stop safety authority, audible alarm triggers, and supervisor notification escalations per PRD FR-08.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Audio Alert Critical */}
        <div
          style={{
            padding: '14px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Volume2 size={18} color="#b91c1c" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                Audible Siren on CRITICAL Alarms
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                Plays continuous alert chime on operator dashboard until acknowledged.
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.audioAlertCritical}
            onChange={(e) => onChange({ ...settings, audioAlertCritical: e.target.checked })}
            style={{ width: '18px', height: '18px' }}
          />
        </div>

        {/* Audio Alert Warning */}
        <div
          style={{
            padding: '14px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={18} color="#d97706" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                Audible Chime on WARNING Events
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                Single soft notification beep for non-blocking obstacle pauses.
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.audioAlertWarning}
            onChange={(e) => onChange({ ...settings, audioAlertWarning: e.target.checked })}
            style={{ width: '18px', height: '18px' }}
          />
        </div>

        {/* E-Stop Auto Pause Fleet */}
        <div
          style={{
            padding: '14px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={18} color="#dc2626" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                Zone E-Stop Automatic Fleet Pause
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                Broadcast emergency brake to all nearby robots when optical fence is tripped.
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoPauseFleetOnEStop}
            onChange={(e) => onChange({ ...settings, autoPauseFleetOnEStop: e.target.checked })}
            style={{ width: '18px', height: '18px' }}
          />
        </div>

        {/* Auto Clear Obstacle Seconds */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Obstacle Alert Auto-Clear Timeout
          </label>
          <select
            value={settings.autoClearObstacleAlertSeconds}
            onChange={(e) => onChange({ ...settings, autoClearObstacleAlertSeconds: Number(e.target.value) })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value={10}>10 seconds after path is cleared</option>
            <option value={15}>15 seconds (Standard)</option>
            <option value={30}>30 seconds</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Automatically clears temporary obstacle warnings when AMR resumes driving.
          </span>
        </div>

        {/* Escalation Timeout */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Unacknowledged Alarm Escalation Timeout
          </label>
          <select
            value={settings.escalationTimeoutMinutes}
            onChange={(e) => onChange({ ...settings, escalationTimeoutMinutes: Number(e.target.value) })}
            className="select-input"
            style={{ width: '100%', fontSize: '12px', height: '36px' }}
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes (Escalate to Division Head)</option>
            <option value={15}>15 minutes</option>
          </select>
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Sends urgent notification email if critical alarm is not acknowledged in time.
          </span>
        </div>

        {/* Notification Email */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
            Emergency Contact Email
          </label>
          <input
            type="email"
            value={settings.criticalAlarmEmail}
            onChange={(e) => onChange({ ...settings, criticalAlarmEmail: e.target.value })}
            className="input-field"
            style={{ width: '100%', fontSize: '12px', padding: '8px 12px' }}
          />
          <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Shift supervisor email receiving critical equipment stop events.
          </span>
        </div>
      </div>

      {/* Webhook Alert Integration */}
      <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
              External Webhook Alert Dispatcher
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Forward high-severity incidents to factory Teams or Slack operations channel.
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.webhookNotificationEnabled}
              onChange={(e) => onChange({ ...settings, webhookNotificationEnabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155' }}>
              {settings.webhookNotificationEnabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </label>
        </div>

        <input
          type="url"
          disabled={!settings.webhookNotificationEnabled}
          value={settings.webhookNotificationUrl}
          onChange={(e) => onChange({ ...settings, webhookNotificationUrl: e.target.value })}
          className="input-field"
          style={{ width: '100%', fontSize: '12px', padding: '8px 12px', fontFamily: 'var(--font-mono)' }}
          placeholder="https://alerts.astra-winteq.local/webhook/..."
        />
      </div>
    </div>
  );
}
