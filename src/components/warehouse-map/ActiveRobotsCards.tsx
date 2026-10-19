'use client';

import React from 'react';
import Link from 'next/link';
import { WarehouseRobot } from '@/types/warehouseMap';

interface ActiveRobotsCardsProps {
  robots: WarehouseRobot[];
  selectedRobotId: string;
  onSelectRobot: (id: string) => void;
}

export function ActiveRobotsCards({
  robots,
  selectedRobotId,
  onSelectRobot,
}: ActiveRobotsCardsProps) {
  // Vector illustration helpers for robots
  const renderRobotIllustration = (robot: WarehouseRobot) => {
    if (robot.type === 'FORKLIFT') {
      const isOrange = robot.id === 'AMR-03';
      const bodyColor = isOrange ? '#f97316' : '#ef4444';
      const darkColor = isOrange ? '#c2410c' : '#b91c1c';

      return (
        <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
          {/* Shadow */}
          <ellipse cx="22" cy="35" rx="16" ry="4" fill="rgba(15,23,42,0.12)" />
          {/* Forklift Mast & Forks */}
          <path d="M 8 10 L 8 32 M 12 10 L 12 32" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 3 31 L 12 31" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          {/* Main Chassis */}
          <rect x="12" y="18" width="22" height="13" rx="3" fill={bodyColor} />
          {/* Counterweight rear */}
          <path d="M 34 21 C 36 21 38 23 38 26 L 38 31 L 34 31 Z" fill={darkColor} />
          {/* Cabin Cage */}
          <path d="M 16 18 L 18 10 L 28 10 L 30 18" stroke="#334155" strokeWidth="2" strokeLinejoin="round" fill="none" />
          {/* Wheels */}
          <circle cx="16" cy="32" r="4.5" fill="#1e293b" />
          <circle cx="16" cy="32" r="2" fill="#94a3b8" />
          <circle cx="32" cy="32" r="4.5" fill="#1e293b" />
          <circle cx="32" cy="32" r="2" fill="#94a3b8" />
          {/* Overhead warning light */}
          <circle cx="23" cy="9" r="1.5" fill={isOrange ? '#f59e0b' : '#ef4444'} />
        </svg>
      );
    }

    if (robot.id === 'PUDU-001') {
      // Pudu Tugger Bot
      return (
        <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
          <ellipse cx="22" cy="35" rx="15" ry="3.5" fill="rgba(15,23,42,0.12)" />
          {/* Lower chassis */}
          <rect x="10" y="24" width="24" height="8" rx="3" fill="#1e293b" />
          {/* Upper Body */}
          <rect x="12" y="14" width="20" height="11" rx="4" fill="#3b82f6" />
          {/* White screen/face */}
          <rect x="14" y="16" width="16" height="6" rx="2" fill="#0f172a" />
          {/* Blue digital eyes */}
          <circle cx="18" cy="19" r="1.2" fill="#38bdf8" />
          <circle cx="26" cy="19" r="1.2" fill="#38bdf8" />
          {/* Wheels */}
          <rect x="8" y="28" width="4" height="5" rx="1" fill="#0f172a" />
          <rect x="32" y="28" width="4" height="5" rx="1" fill="#0f172a" />
        </svg>
      );
    }

    // Standard Flatbed AMR (AMR-01, AMR-02)
    const isAmr02 = robot.id === 'AMR-02';
    const accentColor = isAmr02 ? '#2563eb' : '#0ea5e9';

    return (
      <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
        <ellipse cx="22" cy="35" rx="16" ry="4" fill="rgba(15,23,42,0.12)" />
        {/* Chassis Lower */}
        <rect x="8" y="24" width="28" height="9" rx="3.5" fill="#1e293b" />
        {/* Chassis Upper Deck */}
        <rect x="9" y="18" width="26" height="7" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        {/* Accent Stripe */}
        <rect x="12" y="26" width="20" height="2" rx="1" fill={accentColor} />
        {/* Wheels */}
        <rect x="11" y="32" width="5" height="3" rx="1" fill="#0f172a" />
        <rect x="28" y="32" width="5" height="3" rx="1" fill="#0f172a" />
        {/* Sensor LiDAR Puck */}
        <rect x="19" y="15" width="6" height="3" rx="1.5" fill="#0f172a" />
        <circle cx="22" cy="16.5" r="1" fill="#38bdf8" />
      </svg>
    );
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
          Active robots (17/20)
        </span>
        <Link
          href="/equipment"
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#2563eb',
            textDecoration: 'none',
          }}
        >
          View all →
        </Link>
      </div>

      {/* Cards Row */}
      <div
        className="panel-body"
        style={{
          padding: '12px 14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '10px',
        }}
      >
        {robots.map((robot) => {
          const isSelected = selectedRobotId === robot.id;

          // Status colors
          let badgeBg = '#eff6ff';
          let badgeColor = '#2563eb';
          let badgeBorder = '#bfdbfe';

          if (robot.status === 'Idle') {
            badgeBg = '#ecfdf5';
            badgeColor = '#15803d';
            badgeBorder = '#a7f3d0';
          } else if (robot.status === 'Charging') {
            badgeBg = '#fffbeb';
            badgeColor = '#d97706';
            badgeBorder = '#fde68a';
          } else if (robot.status === 'Offline') {
            badgeBg = '#fef2f2';
            badgeColor = '#dc2626';
            badgeBorder = '#fecaca';
          }

          const isLowBatt = robot.battery <= 20;
          const battBarColor =
            robot.battery > 50 ? '#10b981' : robot.battery > 20 ? '#f59e0b' : '#ef4444';

          return (
            <div
              key={robot.id}
              onClick={() => onSelectRobot(robot.id)}
              style={{
                border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: isSelected ? '#ffffff' : '#fafbfc',
                boxShadow: isSelected
                  ? '0 4px 12px rgba(37, 99, 235, 0.12)'
                  : '0 1px 3px rgba(0,0,0,0.02)',
                borderRadius: '10px',
                padding: '10px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Left Vector Robot */}
              <div style={{ flexShrink: 0 }}>{renderRobotIllustration(robot)}</div>

              {/* Right Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
                  {robot.id}
                </div>

                <div style={{ marginTop: '2px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '1.5px 6px',
                      borderRadius: '10px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      backgroundColor: badgeBg,
                      border: `1px solid ${badgeBorder}`,
                      color: badgeColor,
                      lineHeight: 1.2,
                    }}
                  >
                    {robot.status}
                  </span>
                </div>

                {/* Battery bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${robot.battery}%`,
                        height: '100%',
                        backgroundColor: battBarColor,
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: isLowBatt ? '#dc2626' : '#64748b',
                    }}
                  >
                    {robot.battery}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
