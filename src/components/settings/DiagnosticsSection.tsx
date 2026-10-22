'use client';

import React, { useState } from 'react';
import { SystemDiagnostics } from '@/types/settings';
import {
  Cpu,
  Database,
  Radio,
  Server,
  Activity,
  CheckCircle2,
  RefreshCw,
  HardDrive,
} from 'lucide-react';

interface DiagnosticsSectionProps {
  diagnostics: SystemDiagnostics;
  onRunDiagnostic: (action: string) => void;
}

export function DiagnosticsSection({
  diagnostics,
  onRunDiagnostic,
}: DiagnosticsSectionProps) {
  const [isRunning, setIsRunning] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setIsRunning(action);
    setTimeout(() => {
      setIsRunning(null);
      onRunDiagnostic(action);
    }, 600);
  };

  return (
    <div className="panel" style={{ borderRadius: '0 0 8px 8px', borderTop: 'none', padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
          Runtime Diagnostics &amp; Infrastructure Health
        </h3>
        <p style={{ fontSize: '11.5px', color: '#64748b' }}>
          Architecture status of Next.js server, PostgreSQL 18 database, worker queue, and WebSocket telemetry stream.
        </p>
      </div>

      {/* Grid of Diagnostics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: Worker Core */}
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="#0284c7" />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>Background Worker</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
              ACTIVE
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Script: <code>worker.ts</code> (Standalone process)</div>
            <div>Poll Interval: <strong>{diagnostics.workerPollIntervalMs} ms</strong></div>
            <div>Max Retry Attempts: <strong>{diagnostics.workerMaxAttempts}x</strong></div>
          </div>
        </div>

        {/* Card 2: Database Engine */}
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} color="#059669" />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>Database Engine</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
              HEALTHY
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Engine: <strong>{diagnostics.databaseHost}</strong></div>
            <div>ORM: <strong>Prisma 7 (@prisma/adapter-pg)</strong></div>
            <div>Active Connections: <strong>{diagnostics.databaseConnections}</strong></div>
          </div>
        </div>

        {/* Card 3: WebSocket Stream */}
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} color="#7c3aed" />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>Real-time Stream</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
              CONNECTED
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Server: <code>server.ts</code> (Socket.IO 4.8.x)</div>
            <div>Mount Path: <code>/ws</code></div>
            <div>Active Connected Clients: <strong>{diagnostics.activeClientsCount} browser sessions</strong></div>
          </div>
        </div>

        {/* Card 4: Platform Version */}
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={16} color="#d97706" />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>App Runtime</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#0369a1', backgroundColor: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
              DEV SERVER
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Version: <strong>{diagnostics.wcsVersion}</strong></div>
            <div>Environment: <strong>{diagnostics.nodeEnvironment}</strong></div>
            <div>Uptime: <strong>{diagnostics.uptimeHours} operating hours</strong></div>
          </div>
        </div>
      </div>

      {/* Manual Diagnostic Actions */}
      <div style={{ padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
            Operational Maintenance Utilities
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Trigger manual health verifications, queue flush, or socket pings without restarting the Node server.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => handleAction('socket_ping')}
            disabled={Boolean(isRunning)}
            className="btn-secondary"
            style={{ fontSize: '11px', height: '30px' }}
          >
            <Radio size={13} className={isRunning === 'socket_ping' ? 'animate-spin' : ''} />
            <span>Ping Socket.IO</span>
          </button>

          <button
            onClick={() => handleAction('worker_tick')}
            disabled={Boolean(isRunning)}
            className="btn-secondary"
            style={{ fontSize: '11px', height: '30px' }}
          >
            <RefreshCw size={13} className={isRunning === 'worker_tick' ? 'animate-spin' : ''} />
            <span>Force Worker Tick</span>
          </button>

          <button
            onClick={() => handleAction('db_vacuum')}
            disabled={Boolean(isRunning)}
            className="btn-secondary"
            style={{ fontSize: '11px', height: '30px' }}
          >
            <HardDrive size={13} className={isRunning === 'db_vacuum' ? 'animate-spin' : ''} />
            <span>Analyze DB Tables</span>
          </button>
        </div>
      </div>
    </div>
  );
}
