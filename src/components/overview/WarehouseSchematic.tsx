'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Maximize2,
  Box,
  Cpu,
  PackageCheck,
  Zap,
  Package,
} from 'lucide-react';

export function WarehouseSchematic() {
  const [activeLayer, setActiveLayer] = useState('All layers');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Panel Header */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Warehouse schematic
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Main Warehouse · Ground floor
          </div>
        </div>

        {/* Right Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>{activeLayer}</span>
              <ChevronDown size={13} />
            </button>

            {isLayerMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  zIndex: 20,
                  minWidth: '130px',
                  padding: '4px 0',
                }}
              >
                {['All layers', 'Robots & Routes', 'Zones & Shelves', 'Charging Stations'].map((layer) => (
                  <button
                    key={layer}
                    onClick={() => {
                      setActiveLayer(layer);
                      setIsLayerMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      color: activeLayer === layer ? '#2563eb' : '#334155',
                      fontWeight: activeLayer === layer ? 600 : 400,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/warehouse-map"
            className="icon-button"
            style={{
              width: '28px',
              height: '28px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              color: '#64748b',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Open Interactive 2.5D Digital Twin Map"
            aria-label="Open Interactive 2.5D Digital Twin Map"
          >
            <Maximize2 size={13} />
          </Link>
        </div>
      </div>

      {/* Schematic Canvas Container */}
      <div className="panel-body" style={{ padding: '14px 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          style={{
            position: 'relative',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            backgroundColor: '#ffffff',
            padding: '14px 14px 16px 14px',
            minHeight: '240px',
            overflow: 'hidden',
          }}
        >
          {/* Top: 3 Zones Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Zone 1: RMW */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 10px 12px 10px',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box size={14} style={{ color: '#2563eb' }} />
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>RMW</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Raw material</div>
                </div>
              </div>

              {/* 3 Shelving Bays with 2 columns x 5 horizontal tiers each */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', margin: '4px 0 8px 0' }}>
                {[0, 1, 2].map((bay) => (
                  <div
                    key={bay}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      padding: '2px',
                    }}
                  >
                    {[0, 1].map((subCol) => (
                      <div key={subCol} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {[0, 1, 2, 3, 4].map((tier) => (
                          <div
                            key={tier}
                            style={{
                              height: '8px',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              borderRadius: '1px',
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Robot AMR-01 Badge */}
              <div
                style={{
                  alignSelf: 'center',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #22c55e',
                  borderRadius: '6px',
                  padding: '3px 12px',
                  boxShadow: '0 2px 6px rgba(34, 197, 94, 0.12)',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  AMR-01
                </div>
                <div style={{ fontSize: '9.5px', color: '#16a34a', fontWeight: 600 }}>Idle</div>
              </div>
            </div>

            {/* Zone 2: ASSEMBLY */}
            <div
              style={{
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '10px 10px 12px 10px',
                backgroundColor: '#f0f9ff',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} style={{ color: '#2563eb' }} />
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>ASSEMBLY</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Production staging</div>
                </div>
              </div>

              {/* 3 Shelving Bays with 2 columns x 5 horizontal tiers each */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', margin: '4px 0 8px 0' }}>
                {[0, 1, 2].map((bay) => (
                  <div
                    key={bay}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #93c5fd',
                      borderRadius: '3px',
                      padding: '2px',
                    }}
                  >
                    {[0, 1].map((subCol) => (
                      <div key={subCol} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {[0, 1, 2, 3, 4].map((tier) => (
                          <div
                            key={tier}
                            style={{
                              height: '8px',
                              backgroundColor: '#e0f2fe',
                              border: '1px solid #bfdbfe',
                              borderRadius: '1px',
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Robot AMR-02 Badge */}
              <div
                style={{
                  alignSelf: 'center',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #3b82f6',
                  borderRadius: '6px',
                  padding: '3px 12px',
                  boxShadow: '0 2px 6px rgba(59, 130, 246, 0.12)',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                  AMR-02
                </div>
                <div style={{ fontSize: '9.5px', color: '#2563eb', fontWeight: 600 }}>Moving</div>
              </div>
            </div>

            {/* Zone 3: FGW */}
            <div
              style={{
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '10px 10px 12px 10px',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PackageCheck size={14} style={{ color: '#16a34a' }} />
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>FGW</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Finished goods</div>
                </div>
              </div>

              {/* 3 Shelving Bays with 2 columns x 5 horizontal tiers each */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', margin: '4px 0 8px 0' }}>
                {[0, 1, 2].map((bay) => (
                  <div
                    key={bay}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #86efac',
                      borderRadius: '3px',
                      padding: '2px',
                    }}
                  >
                    {[0, 1].map((subCol) => (
                      <div key={subCol} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {[0, 1, 2, 3, 4].map((tier) => (
                          <div
                            key={tier}
                            style={{
                              height: '8px',
                              backgroundColor: '#dcfce7',
                              border: '1px solid #bbf7d0',
                              borderRadius: '1px',
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Robot AMR-04 Badge */}
              <div
                style={{
                  alignSelf: 'center',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #ef4444',
                  borderRadius: '6px',
                  padding: '3px 12px',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.12)',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  AMR-04
                </div>
                <div style={{ fontSize: '9.5px', color: '#ef4444', fontWeight: 600 }}>Offline</div>
              </div>
            </div>
          </div>

          {/* Bottom Dynamic AGV Route Lines & Node Badges */}
          <div
            style={{
              position: 'relative',
              marginTop: '16px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* SVG Connecting Tracks */}
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
              viewBox="0 0 500 56"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Origin node under AMR-01 */}
              <circle cx="45" cy="14" r="3.5" fill="#0284c7" />
              <path d="M 45 14 L 45 34" stroke="#0284c7" strokeWidth="2" />

              {/* Dashed Planned Route */}
              <path
                d="M 45 34 L 165 34"
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx="105" cy="34" r="3.5" fill="#0284c7" />

              {/* Solid Active Route from purple node to CH-01 to FGW */}
              <path
                d="M 195 34 L 305 34"
                stroke="#0284c7"
                strokeWidth="2.2"
              />
              <path
                d="M 335 34 L 420 34 L 420 10"
                stroke="#0284c7"
                strokeWidth="2.2"
              />
              <circle cx="390" cy="34" r="3.5" fill="#0284c7" />
              {/* Arrow Head pointing up directly into FGW / AMR-04 */}
              <polygon points="420,4 416,12 424,12" fill="#0284c7" />
            </svg>

            {/* Node 1: Purple Pallet Box Transport (PUDU-001) */}
            <div
              style={{
                position: 'absolute',
                left: '36%',
                transform: 'translateX(-50%)',
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: '#8b5cf6',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(139, 92, 246, 0.4)',
                }}
              >
                <Package size={13} />
              </div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #a855f7',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  boxShadow: '0 2px 5px rgba(168, 85, 247, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a', fontWeight: 700 }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                  PUDU-001
                </div>
                <div style={{ fontSize: '9px', color: '#7c3aed', fontWeight: 600 }}>Moving</div>
              </div>
            </div>

            {/* Node 2: Amber Charging Station (CH-01) */}
            <div
              style={{
                position: 'absolute',
                left: '64%',
                transform: 'translateX(-50%)',
                zIndex: 3,
                backgroundColor: '#ffffff',
                border: '1.5px solid #f59e0b',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 600,
                boxShadow: '0 2px 5px rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={11} />
              </div>
              <div>
                <div style={{ color: '#0f172a', fontWeight: 700 }}>CH-01</div>
                <div style={{ fontSize: '9px', color: '#d97706', fontWeight: 600 }}>Charging</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '14px',
            fontSize: '11px',
            color: '#64748b',
            padding: '2px 4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
            <span>Moving</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
            <span>Idle</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span>Charging</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span>Offline / Fault</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '14px', height: '2px', backgroundColor: '#0284c7' }} />
            <span>Route</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '14px', borderTop: '2px dashed #0ea5e9' }} />
            <span>Planned route</span>
          </div>
        </div>
      </div>
    </div>
  );
}
