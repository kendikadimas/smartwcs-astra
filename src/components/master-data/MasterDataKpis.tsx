'use client';

import React from 'react';
import { MasterDataKpis as MasterDataKpisType, MasterCategoryKey } from '@/types/masterData';
import {
  Bot,
  Box,
  MapPin,
  Package,
  FileText,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface MasterDataKpisProps {
  kpis: MasterDataKpisType;
  activeCategory: MasterCategoryKey;
  onSelectCategory: (cat: MasterCategoryKey) => void;
  categoryCounts?: Record<MasterCategoryKey, number>;
}

export function MasterDataKpis({
  kpis,
  activeCategory,
  onSelectCategory,
  categoryCounts,
}: MasterDataKpisProps) {
  const cards = [
    {
      key: 'robots' as MasterCategoryKey,
      title: 'Robots Fleet',
      value: kpis.robots.total,
      subtext: `${kpis.robots.active} active · ${kpis.robots.offline} offline · ${kpis.robots.fault} fault`,
      tag: '//fleet-amr',
      theme: 'theme-blue',
      icon: Bot,
    },
    {
      key: 'equipment' as MasterCategoryKey,
      title: 'Equipment Assets',
      value: kpis.equipment.total,
      subtext: `${kpis.equipment.online} online · ${kpis.equipment.offline} offline`,
      tag: '//hardware-plc',
      theme: 'theme-teal',
      icon: Box,
    },
    {
      key: 'locations' as MasterCategoryKey,
      title: 'Locations & Nodes',
      value: kpis.locations.total,
      subtext: `${kpis.locations.active} active · ${kpis.locations.inactive} inactive`,
      tag: '//topology',
      theme: 'theme-orange',
      icon: MapPin,
    },
    {
      key: 'materials' as MasterCategoryKey,
      title: 'Materials / SKUs',
      value: kpis.materials.total.toLocaleString(),
      subtext: `${kpis.materials.available.toLocaleString()} available · ${kpis.materials.inUse} in use`,
      tag: '//inventory',
      theme: 'theme-green',
      icon: Package,
    },
    {
      key: 'task-types' as MasterCategoryKey,
      title: 'Task Types SOP',
      value: kpis.taskTypes.total,
      subtext: `${kpis.taskTypes.activeCount} SOPs · all active`,
      tag: '//dispatch-sop',
      theme: 'theme-purple',
      icon: FileText,
    },
    {
      key: 'zones' as MasterCategoryKey,
      title: 'Facility Zones',
      value: categoryCounts?.zones ?? 4,
      subtext: `${categoryCounts?.zones ?? 4} active zones · staging & docks`,
      tag: '//facility-zones',
      theme: 'theme-rose',
      icon: Layers,
    },
  ];

  return (
    <div className="kpi-grid-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeCategory === card.key;

        return (
          <div
            key={card.key}
            onClick={() => onSelectCategory(card.key)}
            className={`gradient-card ${card.theme}`}
            style={{
              cursor: 'pointer',
              ...(isActive
                ? {
                    boxShadow: '0 0 0 2.5px #ffffff, 0 14px 28px -4px rgba(0, 0, 0, 0.35)',
                    transform: 'translateY(-2px)',
                  }
                : {}),
            }}
          >
            {/* Background Decorative Concentric Circles */}
            <div className="card-decor-circles" aria-hidden="true">
              <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="130" cy="130" r="115" fill="white" fillOpacity="0.08" />
                <circle cx="130" cy="130" r="80" fill="white" fillOpacity="0.12" />
                <circle cx="130" cy="130" r="48" fill="white" fillOpacity="0.16" />
              </svg>
            </div>

            {/* Top Bar: Icon on Left + Active/Select indicator on Right */}
            <div className="gradient-card-header">
              <div className="gradient-card-icon-wrap">
                <Icon size={17} />
              </div>

              {isActive ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.24)',
                    padding: '2.5px 9px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <span>Active View</span>
                </div>
              ) : (
                <div className="gradient-card-view-btn">
                  <span>Select</span>
                  <ChevronRight size={12} />
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="gradient-card-body">
              <div className="gradient-card-tag">{card.tag}</div>
              <div className="gradient-card-title">{card.title}</div>
              <div className="gradient-card-value">{card.value}</div>
              <div className="gradient-card-subtext">{card.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
