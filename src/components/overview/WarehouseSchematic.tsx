import React from 'react';

export function WarehouseSchematic() {
  return (
    <div className="panel">
      {/* Panel Header */}
      <div className="panel-header">
        <span className="panel-title">Warehouse schematic</span>
        <span className="panel-subtitle">Ground floor · not to scale</span>
      </div>

      {/* Schematic Container */}
      <div className="panel-body" style={{ padding: '14px 16px 12px 16px' }}>
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            backgroundColor: '#ffffff',
            padding: '16px 18px 12px 18px',
            position: 'relative',
          }}
        >
          {/* Three Zones Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '14px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Zone 1: RMW */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px 12px 12px',
                backgroundColor: '#fafbfc',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>
                  RMW
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Raw material</div>
              </div>

              {/* Shelf Rack Grid (3 rows x 3 cols) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '4px',
                  margin: '4px 0 8px 0',
                }}
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={`rmw-rack-${i}`}
                    style={{
                      height: '14px',
                      backgroundColor: '#eef2f6',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                    }}
                  />
                ))}
              </div>

              {/* Robot Badge */}
              <div style={{ alignSelf: 'flex-start' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#16a34a',
                    }}
                  />
                  AMR-01
                </span>
              </div>
            </div>

            {/* Zone 2: ASSEMBLY */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px 12px 12px',
                backgroundColor: '#fafbfc',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>
                  ASSEMBLY
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Production staging</div>
              </div>

              {/* Staging Bays Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '4px',
                  margin: '4px 0 8px 0',
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`assy-rack-${i}`}
                    style={{
                      height: '14px',
                      backgroundColor: '#eef2f6',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                    }}
                  />
                ))}
              </div>

              {/* Robot Badge */}
              <div style={{ alignSelf: 'flex-start' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #bae6fd',
                    color: '#0284c7',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#0284c7',
                    }}
                  />
                  AMR-02
                </span>
              </div>
            </div>

            {/* Zone 3: FGW */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px 12px 12px',
                backgroundColor: '#fafbfc',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>
                  FGW
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Finished goods</div>
              </div>

              {/* Storage Rack Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '4px',
                  margin: '4px 0 8px 0',
                }}
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={`fgw-rack-${i}`}
                    style={{
                      height: '14px',
                      backgroundColor: '#eef2f6',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                    }}
                  />
                ))}
              </div>

              {/* Robot Badge */}
              <div style={{ alignSelf: 'flex-start' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#334155',
                    }}
                  />
                  AMR-04
                </span>
              </div>
            </div>
          </div>

          {/* Route Pathway Line & Charging Station Indicator */}
          <div
            style={{
              position: 'relative',
              marginTop: '16px',
              paddingTop: '6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Horizontal Pathway Track */}
            <div
              style={{
                width: '84%',
                height: '4px',
                backgroundColor: '#e0f2fe',
                borderRadius: '2px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '15%',
                  right: '15%',
                  height: '100%',
                  background: 'repeating-linear-gradient(90deg, #38bdf8 0, #38bdf8 8px, transparent 8px, transparent 14px)',
                }}
              />
            </div>

            {/* Station Callout */}
            <div
              style={{
                fontSize: '10.5px',
                color: '#64748b',
                marginTop: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              CH-01 · charging
            </div>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '10px',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
            <span>Running / route</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
            <span>Idle</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#334155' }} />
            <span>Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
