'use client';

import React from 'react';
import Link from 'next/link';
import { RobotResourceItem } from '@/types/equipment';
import {
  X,
  Bot,
  Battery,
  Zap,
  MapPin,
  Clock,
  Compass,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Pause,
  Play,
  RotateCw,
  Maximize2,
  FileText,
} from 'lucide-react';

interface RobotDetailDrawerProps {
  robot: RobotResourceItem | null;
  onClose: () => void;
  onSendToDock: (robot: RobotResourceItem) => void;
}

export function RobotDetailDrawer({
  robot,
  onClose,
  onSendToDock,
}: RobotDetailDrawerProps) {
  if (!robot) return null;

  const isWorking = robot.runState === 'Working';
  const isIdle = robot.runState === 'Idle';
  const isError = robot.runState === 'Error' || !robot.online;
  const isCharging = robot.isCharging;

  const battColor =
    robot.battery <= 20 ? '#dc2626' : robot.battery <= 50 ? '#d97706' : '#16a34a';

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 1040,
        }}
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className="card-container"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#fafbfc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: isError ? '#fee2e2' : '#eff6ff',
                color: isError ? '#dc2626' : '#00529C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isError ? '1px solid #fecaca' : '1px solid #bfdbfe',
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  {robot.id}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '1px 7px',
                    borderRadius: '10px',
                    backgroundColor: isError ? '#fef2f2' : isWorking ? '#eff6ff' : '#ecfdf5',
                    color: isError ? '#dc2626' : isWorking ? '#2563eb' : '#059669',
                    border: isError ? '1px solid #fecaca' : '1px solid #bfdbfe',
                  }}
                >
                  {robot.runState} ({robot.moveState})
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                SN: {robot.serialNumber} · {robot.model}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div
          style={{
            padding: '20px',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Section 1: Live Pose & Spatial Coordinates */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} style={{ color: '#00529C' }} />
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                  Live Spatial Pose (PuduRobotState)
                </span>
              </div>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>{robot.lastPoseAt}</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Coordinate X</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                  {robot.x.toFixed(2)} m
                </div>
              </div>
              <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Coordinate Y</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                  {robot.y.toFixed(2)} m
                </div>
              </div>
              <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Heading (Yaw)</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#00529C', fontFamily: 'monospace' }}>
                  {robot.yaw}°
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
              Map Context: <strong>{robot.currentMapName}</strong> ({robot.currentMapId})
            </div>
          </div>

          {/* Section 2: Battery & Energy State */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Battery size={15} style={{ color: battColor }} />
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                  Battery &amp; Energy Status
                </span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: battColor }}>
                {robot.battery}%
              </span>
            </div>

            <div
              style={{
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#f1f5f9',
                overflow: 'hidden',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${robot.battery}%`,
                  backgroundColor: battColor,
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Charging Mode:</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {isCharging ? 'Docked & Charging' : 'Discharging / In Service'}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Charge Stage:</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{robot.chargeStage}</div>
              </div>
            </div>
          </div>

          {/* Section 3: Performance & Trajectory Telemetry */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
              Performance &amp; Hardware Telemetry
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Current Calculated Speed:</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{robot.speedMps.toFixed(2)} m/s (WCS)</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Total Odometer (Distance):</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {(robot.totalDistanceMeters / 1000).toFixed(2)} km
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Total Service Hours:</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{robot.totalRunHours} hrs</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Payload Capacity:</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {robot.currentPayloadKg ? `${robot.currentPayloadKg} / ` : ''}
                  {robot.maxPayloadKg} kg max
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>IP Address / Port:</span>
                <div style={{ fontWeight: 600, color: '#00529C', fontFamily: 'monospace' }}>
                  {robot.ipAddress}:8080
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Firmware Version:</span>
                <div style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
                  {robot.firmwareVersion}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b' }}>Adapter Channel:</span>
                <div style={{ fontWeight: 600, color: '#2563eb' }}>{robot.adapterChannel}</div>
              </div>
            </div>
          </div>

          {/* Section 4: Riwayat Status (PuduRobotStatusLog) */}
          {robot.recentStatusLogs && robot.recentStatusLogs.length > 0 && (
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Recent Status History (PuduRobotStatusLog)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {robot.recentStatusLogs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{log.status}</span>
                      <span style={{ color: '#64748b' }}>{log.timestamp} ({log.durationMinutes} min)</span>
                    </div>
                    <div style={{ color: '#64748b', marginTop: '2px' }}>{log.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#fafbfc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <Link
            href="/warehouse-map"
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              textDecoration: 'none',
            }}
          >
            <Maximize2 size={13} />
            Track on Map
          </Link>

          {!isCharging && robot.battery < 90 && (
            <button
              type="button"
              onClick={() => onSendToDock(robot)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#d97706',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <Zap size={14} />
              Dispatch to Dock
            </button>
          )}
        </div>
      </div>
    </>
  );
}
