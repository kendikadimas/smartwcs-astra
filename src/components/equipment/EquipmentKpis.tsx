'use client';

import React from 'react';
import { EquipmentMetrics } from '@/types/equipment';
import {
  Bot,
  Zap,
  Battery,
  Layers,
  Activity,
} from 'lucide-react';

interface EquipmentKpisProps {
  metrics: EquipmentMetrics;
}

export function EquipmentKpis({ metrics }: EquipmentKpisProps) {
  const cards = [
    {
      title: 'Active Fleet Online',
      value: `${metrics.robotsOnline} / ${metrics.totalRobots}`,
      subtext: `${metrics.robotsMoving} moving · ${metrics.robotsCharging} charging`,
      theme: 'theme-blue',
      icon: Bot,
      pill: '83% READY',
    },
    {
      title: 'Fleet Battery Health',
      value: `${metrics.avgFleetBattery}%`,
      subtext: 'Fleet average charge level',
      theme: 'theme-teal',
      icon: Battery,
      pill: metrics.avgFleetBattery >= 50 ? 'OPTIMAL' : 'LOW',
    },
    {
      title: 'Active In-Motion',
      value: metrics.robotsMoving,
      subtext: 'AMRs executing active routes',
      theme: 'theme-purple',
      icon: Activity,
      pill: 'TRAJECTORY',
    },
    {
      title: 'Charging Capacity',
      value: `${metrics.chargingDocksAvailable} Docks`,
      subtext: 'Ready for auto-docking',
      theme: 'theme-orange',
      icon: Zap,
      pill: `${metrics.totalChargingStations} HUBS`,
    },
    {
      title: 'Conveyors & Lifts',
      value: `${metrics.conveyorsOperating} / ${metrics.conveyorsTotal}`,
      subtext: 'PLC automated systems operating',
      theme: 'theme-green',
      icon: Layers,
      pill: 'PLC ONLINE',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: '12px',
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className={`gradient-card ${card.theme}`}>
            {/* Background Decorative Concentric Circles */}
            <div className="card-decor-circles" aria-hidden="true">
              <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="130" cy="130" r="115" fill="white" fillOpacity="0.08" />
                <circle cx="130" cy="130" r="80" fill="white" fillOpacity="0.12" />
                <circle cx="130" cy="130" r="48" fill="white" fillOpacity="0.16" />
              </svg>
            </div>

            {/* Top Bar: Icon */}
            <div
              className="gradient-card-header"
              style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '6px' }}
            >
              <div className="gradient-card-icon-wrap">
                <Icon size={16} />
              </div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '1.5px 7px',
                  borderRadius: '12px',
                }}
              >
                {card.pill}
              </span>
            </div>

            {/* Card Body */}
            <div className="gradient-card-body">
              <div className="gradient-card-title">{card.title}</div>
              <div className="gradient-card-value-row">
                <div className="gradient-card-value" style={{ fontSize: '24px' }}>
                  {card.value}
                </div>
              </div>
              <div className="gradient-card-subtext">{card.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
