'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MasterCategoryKey, MasterDataFilterState } from '@/types/masterData';
import {
  X,
  AlertTriangle,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Cpu,
  MapPin,
  Bot,
  Activity,
  Layers,
  Sliders,
  Edit2,
  Package,
  Radio,
  ShieldCheck,
  ArrowRight,
  Zap,
  Box,
  Battery,
  BatteryCharging,
  BatteryWarning,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

// ===========================================================================
// 1. ADD / EDIT ITEM MODAL
// ===========================================================================
interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: MasterCategoryKey;
  editItem: any | null;
  onSave: (item: any) => void;
}

export function AddEditModal({
  isOpen,
  onClose,
  activeCategory,
  editItem,
  onSave,
}: AddEditModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editItem) {
      setFormData(editItem);
    } else {
      // Default empty form state per category
      if (activeCategory === 'robots') {
        setFormData({
          id: `AMR-${Math.floor(10 + Math.random() * 90)}`,
          name: '',
          type: 'AMR',
          model: 'Astra 600',
          status: 'Idle',
          battery: 100,
          currentLocation: 'RMW-A01',
          currentTask: '—',
          vendor: 'Astra Robotics',
          protocol: 'VDA5050 v2.0',
          maxPayloadKg: 600,
        });
      } else if (activeCategory === 'equipment') {
        setFormData({
          id: `EQ-CV-${Math.floor(10 + Math.random() * 90)}`,
          name: '',
          equipmentType: 'Conveyor',
          location: 'RCV-01',
          vendor: 'Interroll Automation',
          status: 'Online',
          integrationSource: 'OPC UA',
          capabilities: ['Motorized Roller'],
        });
      } else if (activeCategory === 'locations') {
        setFormData({
          id: `LOC-${Math.floor(100 + Math.random() * 900)}`,
          code: '',
          name: '',
          zone: 'RMW',
          locationType: 'Storage Bay',
          status: 'Active',
          maxCapacityKg: 1500,
          coordinates: '[X: 10.0, Y: 10.0]',
        });
      } else if (activeCategory === 'materials') {
        setFormData({
          id: `MAT-${Math.floor(100 + Math.random() * 900)}`,
          sku: '',
          name: '',
          materialType: 'Raw Material',
          unit: 'BOX',
          availableQty: 100,
          inUseQty: 0,
          weightKg: 50,
          status: 'Available',
        });
      } else {
        setFormData({
          id: `REC-${Math.floor(10 + Math.random() * 90)}`,
          name: '',
          code: '',
          status: 'Active',
        });
      }
    }
    setErrors({});
  }, [isOpen, editItem, activeCategory]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name && !formData.code && !formData.sku) {
      errs.name = 'Name / Identifier is required';
    }
    if (activeCategory === 'robots') {
      if (!formData.id) errs.id = 'Robot ID is required';
      if (!formData.model) errs.model = 'Model is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    onSave({
      ...formData,
      lastUpdate: `${timeStr}`,
      lastUpdateDate: '16 Jun 2025',
    });
    onClose();
  };

  const categoryTitle =
    activeCategory === 'robots'
      ? 'Robot'
      : activeCategory === 'equipment'
      ? 'Equipment'
      : activeCategory === 'locations'
      ? 'Location'
      : activeCategory === 'materials'
      ? 'Material'
      : activeCategory === 'zones'
      ? 'Zone'
      : activeCategory === 'charging-stations'
      ? 'Charging Station'
      : 'Item';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {editItem ? `Edit ${categoryTitle}` : `Add New ${categoryTitle}`}
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Configure master reference data attributes and parameters.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeCategory === 'robots' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Robot ID *
                  </label>
                  <input
                    type="text"
                    value={formData.id || ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  {errors.id && <span style={{ color: '#dc2626', fontSize: '10.5px' }}>{errors.id}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. AMR-07"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  {errors.name && <span style={{ color: '#dc2626', fontSize: '10.5px' }}>{errors.name}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Robot Type
                  </label>
                  <select
                    value={formData.type || 'AMR'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="AMR">AMR (Flatbed)</option>
                    <option value="AMR Forklift">AMR Forklift (High Reach)</option>
                    <option value="Tugger">Tugger / Delivery</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Hardware Model
                  </label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g. Astra 600, PUDU T300"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={formData.status || 'Idle'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Idle">Idle</option>
                    <option value="Running">Running</option>
                    <option value="Charging">Charging</option>
                    <option value="Offline">Offline</option>
                    <option value="Fault">Fault</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Battery (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.battery ?? 100}
                    onChange={(e) => setFormData({ ...formData, battery: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Assigned Location
                  </label>
                  <input
                    type="text"
                    value={formData.currentLocation || ''}
                    onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                    placeholder="e.g. RMW-A01, CH-01"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Max Payload (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.maxPayloadKg || 600}
                    onChange={(e) => setFormData({ ...formData, maxPayloadKg: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </>
          )}

          {activeCategory !== 'robots' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Name / Description *
                </label>
                <input
                  type="text"
                  value={formData.name || formData.sku || formData.code || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      sku: e.target.value,
                      code: e.target.value,
                    })
                  }
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                {errors.name && <span style={{ color: '#dc2626', fontSize: '10.5px' }}>{errors.name}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Active">Active / Online</option>
                    <option value="Inactive">Inactive / Offline</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Zone / Facility
                  </label>
                  <input
                    type="text"
                    value={formData.zone || formData.location || 'Main Warehouse'}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value, location: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
              }}
            >
              {editItem ? 'Save Changes' : `Create ${categoryTitle}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================================================
// 2. DETAIL VIEW MODAL (FULLSCREEN DUAL-PANE CONSOLE WITH BIG SCHEMATIC)
// ===========================================================================
interface DetailDrawerProps {
  item: any | null;
  onClose: () => void;
  activeCategory: MasterCategoryKey;
  onEditItem?: (item: any) => void;
}

export function DetailDrawer({ item, onClose, activeCategory, onEditItem }: DetailDrawerProps) {
  if (!item) return null;

  const isRobot = activeCategory === 'robots' || item.battery !== undefined;
  const isForklift = isRobot && (item.type || '').toLowerCase().includes('forklift');

  // Status badge renderer without any bullet dots
  const renderStatusBadge = (status: string) => {
    if (!status) return null;
    let bg = '#eff6ff';
    let text = '#2563eb';
    let border = '#bfdbfe';

    const s = status.toLowerCase();
    if (s === 'running') {
      bg = '#eff6ff';
      text = '#2563eb';
      border = '#bfdbfe';
    } else if (s === 'idle' || s === 'active' || s === 'online' || s === 'available') {
      bg = '#f0fdf4';
      text = '#15803d';
      border = '#bbf7d0';
    } else if (s === 'charging' || s === 'occupied' || s === 'low stock') {
      bg = '#fffbeb';
      text = '#b45309';
      border = '#fde68a';
    } else if (s === 'offline' || s === 'inactive' || s === 'stopped') {
      bg = '#f1f5f9';
      text = '#475569';
      border = '#cbd5e1';
    } else if (s === 'fault' || s === 'error' || s === 'blocked' || s === 'maintenance') {
      bg = '#fef2f2';
      text = '#b91c1c';
      border = '#fecaca';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 12px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: bg,
          color: text,
          border: `1px solid ${border}`,
          letterSpacing: '0.02em',
        }}
      >
        {status}
      </span>
    );
  };

  // Header small avatar
  const renderAvatar = () => {
    if (isRobot) {
      if (isForklift) {
        return (
          <div
            style={{
              width: '36px',
              height: '34px',
              borderRadius: '7px',
              backgroundColor: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #fed7aa',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M 6 20 L 14 24 L 21 20 L 13 16 Z" fill="#ea580c" />
              <path d="M 6 20 L 14 24 L 14 27 L 6 23 Z" fill="#c2410c" />
              <path d="M 14 24 L 21 20 L 21 23 L 14 27 Z" fill="#9a3412" />
              <path d="M 20 8 L 22 9 L 22 21 L 20 20 Z" fill="#1e293b" />
              <path d="M 23 9 L 25 10 L 25 22 L 23 21 Z" fill="#334155" />
              <path d="M 21 20 L 27 17 L 28 18 L 22 21 Z" fill="#64748b" />
              <path d="M 10 10 L 16 7 L 19 9 L 13 12 Z" fill="#334155" />
            </svg>
          </div>
        );
      }
      return (
        <div
          style={{
            width: '36px',
            height: '34px',
            borderRadius: '7px',
            backgroundColor: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #bfdbfe',
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <path d="M 16 6 L 26 12 L 16 18 L 6 12 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
            <path d="M 6 12 L 16 18 L 16 23 L 6 17 Z" fill="#1e293b" />
            <path d="M 16 18 L 26 12 L 26 17 L 16 23 Z" fill="#334155" />
            <path d="M 16 19 L 26 13 L 26 14.5 L 16 20.5 Z" fill="#38bdf8" />
            <ellipse cx="16" cy="12" rx="4" ry="2.2" fill="#0284c7" />
          </svg>
        </div>
      );
    }

    let IconComp = Bot;
    let bg = '#eff6ff';
    let col = '#2563eb';
    let border = '#bfdbfe';
    if (activeCategory === 'equipment') { IconComp = Cpu; bg = '#f0fdf4'; col = '#15803d'; border = '#bbf7d0'; }
    else if (activeCategory === 'locations') { IconComp = MapPin; bg = '#eff6ff'; col = '#2563eb'; border = '#bfdbfe'; }
    else if (activeCategory === 'materials') { IconComp = Box; bg = '#fffbeb'; col = '#b45309'; border = '#fde68a'; }
    else if (activeCategory === 'zones') { IconComp = Layers; bg = '#faf5ff'; col = '#7e22ce'; border = '#e9d5ff'; }
    else if (activeCategory === 'charging-stations') { IconComp = Zap; bg = '#fff7ed'; col = '#c2410c'; border = '#fed7aa'; }

    return (
      <div
        style={{
          width: '36px',
          height: '34px',
          borderRadius: '7px',
          backgroundColor: bg,
          color: col,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: `1px solid ${border}`,
        }}
      >
        <IconComp size={18} />
      </div>
    );
  };

  // Battery metrics helper
  const batteryVal = typeof item.battery === 'number' ? item.battery : 0;
  let batteryColor = '#059669';
  let batteryLabel = 'Optimal';
  if (batteryVal <= 20) {
    batteryColor = '#ef4444';
    batteryLabel = 'Low Battery';
  } else if (batteryVal <= 50) {
    batteryColor = '#f59e0b';
    batteryLabel = 'Moderate';
  }

  // Subtitle builder without repeating item ID
  const buildSubtitle = () => {
    if (isRobot) {
      return [item.model, item.type, item.vendor].filter(Boolean).join(' · ');
    }
    if (activeCategory === 'equipment') {
      return [item.equipmentType, item.vendor, item.location].filter(Boolean).join(' · ');
    }
    if (activeCategory === 'locations') {
      return [item.name, item.locationType, item.zone].filter(Boolean).join(' · ');
    }
    if (activeCategory === 'materials') {
      return [item.name, item.materialType, item.unit].filter(Boolean).join(' · ');
    }
    return [item.name, item.type || item.zoneType || activeCategory].filter(Boolean).join(' · ');
  };

  // =========================================================================
  // BIG DETAILED ROBOT SCHEMATIC ILLUSTRATION (GAMBAR BESAR)
  // =========================================================================
  const renderBigRobotIllustration = () => {
    if (isForklift) {
      return (
        <svg width="100%" height="170" viewBox="0 0 520 280" fill="none" style={{ filter: 'drop-shadow(0 6px 14px rgba(15,23,42,0.06))', maxHeight: '170px' }}>
          <defs>
            <linearGradient id="forkChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
            <linearGradient id="mastGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Floor grid / shadow platform */}
          <ellipse cx="260" cy="245" rx="190" ry="30" fill="rgba(15, 23, 42, 0.08)" />
          <ellipse cx="260" cy="245" rx="145" ry="18" fill="rgba(15, 23, 42, 0.06)" />
          <path d="M 120 245 A 140 26 0 0 1 400 245" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.5" />

          {/* Forklift Duplex Mast */}
          <rect x="155" y="45" width="15" height="175" rx="3" fill="url(#mastGrad)" stroke="#475569" strokeWidth="1" />
          <rect x="182" y="45" width="15" height="175" rx="3" fill="url(#mastGrad)" stroke="#475569" strokeWidth="1" />
          <rect x="155" y="65" width="42" height="10" rx="2" fill="#475569" />
          <rect x="155" y="130" width="42" height="10" rx="2" fill="#475569" />
          <rect x="155" y="190" width="42" height="10" rx="2" fill="#475569" />
          {/* Hydraulic Cylinder */}
          <rect x="171" y="80" width="10" height="135" rx="5" fill="#94a3b8" />
          <rect x="174" y="60" width="4" height="25" fill="#e2e8f0" />

          {/* Heavy Lift Forks (Front) */}
          <rect x="140" y="180" width="72" height="22" rx="3" fill="#334155" stroke="#1e293b" strokeWidth="1" />
          <path d="M 148 192 L 85 220 L 75 222 L 148 202 Z" fill="#64748b" stroke="#334155" strokeWidth="1" />
          <path d="M 195 192 L 132 220 L 122 222 L 195 202 Z" fill="#475569" stroke="#334155" strokeWidth="1" />

          {/* Main AGV Forklift Chassis */}
          <path d="M 195 190 L 370 190 C 385 190 395 200 395 215 L 395 235 L 195 235 Z" fill="#c2410c" />
          <path d="M 195 145 L 340 145 C 365 145 385 165 385 190 L 385 215 L 195 215 Z" fill="url(#forkChassisGrad)" />
          <path d="M 340 145 L 385 145 C 398 145 405 155 405 170 L 405 230 C 405 235 395 235 385 235 L 340 235 Z" fill="#9a3412" />

          {/* Driverless Overhead Protective Guard Cage */}
          <path d="M 215 145 L 230 75 L 330 75 L 350 145" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M 245 75 L 260 145 M 285 75 L 295 145 M 315 75 L 325 145" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <path d="M 230 75 L 330 75" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />

          {/* Warning Light Strobe on Roof */}
          <rect x="274" y="62" width="14" height="13" rx="3" fill="#f59e0b" />
          <circle cx="281" cy="68" r="4" fill="#fbbf24" />
          <circle cx="281" cy="68" r="9" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />

          {/* High-Cap Battery Compartment */}
          <rect x="225" y="160" width="80" height="38" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <rect x="233" y="168" width="64" height="5" rx="2" fill="#f97316" />
          <text x="235" y="188" fill="#94a3b8" fontSize="9" fontFamily="sans-serif" fontWeight="700">48V LiFePO4</text>

          {/* Wheels */}
          <circle cx="175" cy="235" r="16" fill="#0f172a" />
          <circle cx="175" cy="235" r="8" fill="#475569" />
          <circle cx="175" cy="235" r="3" fill="#cbd5e1" />
          <circle cx="360" cy="235" r="20" fill="#0f172a" />
          <circle cx="360" cy="235" r="10" fill="#475569" />
          <circle cx="360" cy="235" r="4" fill="#cbd5e1" />

          {/* Safety LiDAR Sensors */}
          <rect x="140" y="218" width="14" height="11" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="147" cy="223" r="3" fill="#38bdf8" />
          <rect x="390" y="216" width="14" height="11" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="397" cy="221" r="3" fill="#38bdf8" />

          {/* Optical Ground QR Reader Scanner underbody */}
          <rect x="255" y="230" width="18" height="7" rx="2" fill="#0284c7" />
          <path d="M 250 238 L 278 238" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />

          {/* Callout 1: Dual SICK Safety LiDAR */}
          <line x1="147" y1="218" x2="110" y2="160" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="110" cy="160" r="3" fill="#0284c7" />
          <g transform="translate(18, 145)">
            <rect width="105" height="22" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
            <text x="8" y="15" fill="#1e40af" fontSize="9.5" fontWeight="700">Safety LiDAR 360°</text>
          </g>

          {/* Callout 2: Duplex Lift Mast */}
          <line x1="180" y1="65" x2="200" y2="25" stroke="#f97316" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="200" cy="25" r="3" fill="#f97316" />
          <g transform="translate(145, 8)">
            <rect width="130" height="22" rx="4" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1" />
            <text x="8" y="15" fill="#c2410c" fontSize="9.5" fontWeight="700">1,200 kg Heavy Mast</text>
          </g>

          {/* Callout 3: Hot-Swap Battery */}
          <line x1="265" y1="160" x2="340" y2="105" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="340" cy="105" r="3" fill="#f59e0b" />
          <g transform="translate(325, 88)">
            <rect width="125" height="22" rx="4" fill="#fffbeb" stroke="#fde68a" strokeWidth="1" />
            <text x="8" y="15" fill="#b45309" fontSize="9.5" fontWeight="700">48V LiFePO4 Module</text>
          </g>

          {/* Callout 4: RCS Wireless Antenna */}
          <line x1="385" y1="145" x2="430" y2="175" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="430" cy="175" r="3" fill="#64748b" />
          <g transform="translate(415, 168)">
            <rect width="90" height="22" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <text x="8" y="15" fill="#475569" fontSize="9.5" fontWeight="700">Modbus TCP Link</text>
          </g>
        </svg>
      );
    }

    // Standard Flatbed AMR (AMR-01, AMR-02, AMR-03, PUDU, etc.)
    return (
      <svg width="100%" height="170" viewBox="0 0 520 280" fill="none" style={{ filter: 'drop-shadow(0 6px 14px rgba(15,23,42,0.06))', maxHeight: '170px' }}>
        <defs>
          <linearGradient id="amrBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="amrBaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Floor shadow */}
        <ellipse cx="260" cy="235" rx="180" ry="28" fill="rgba(15, 23, 42, 0.08)" />
        <ellipse cx="260" cy="235" rx="140" ry="18" fill="rgba(15, 23, 42, 0.06)" />
        <path d="M 150 235 A 110 20 0 0 1 370 235" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.5" />

        {/* Lower Chassis Body */}
        <path d="M 120 160 L 260 210 L 400 160 L 400 205 L 260 255 L 120 205 Z" fill="url(#amrBaseGrad)" />
        <path d="M 120 205 L 260 255 L 260 225 L 120 175 Z" fill="#0f172a" />
        <path d="M 260 255 L 400 205 L 400 175 L 260 225 Z" fill="#1e293b" />

        {/* Cyan / Blue LED Perimeter Status Strip */}
        <path d="M 120 195 L 260 245 L 400 195" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 120 195 L 260 245 L 400 195" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Top Deck Flatbed Chassis */}
        <path d="M 120 160 L 260 110 L 400 160 L 260 210 Z" fill="url(#amrBodyGrad)" stroke="#cbd5e1" strokeWidth="2" />

        {/* Rotating Turntable Lifting Deck (Center) */}
        <ellipse cx="260" cy="160" rx="66" ry="28" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
        <ellipse cx="260" cy="157" rx="60" ry="25" fill="#1e293b" />
        <ellipse cx="260" cy="155" rx="46" ry="19" fill="#334155" />
        <ellipse cx="260" cy="153" rx="32" ry="13" fill="#f8fafc" />

        {/* Central LiDAR Scanner Puck */}
        <rect x="250" y="112" width="20" height="22" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
        <ellipse cx="260" cy="112" rx="10" ry="4" fill="#0284c7" />
        <circle cx="260" cy="122" r="3" fill="#38bdf8" />

        {/* Drive Wheels & Suspension */}
        <rect x="180" y="232" width="26" height="16" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <rect x="314" y="232" width="26" height="16" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1" />

        {/* Obstacle Avoidance 3D Cameras */}
        <rect x="248" y="222" width="24" height="10" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
        <circle cx="254" cy="227" r="2" fill="#38bdf8" />
        <circle cx="266" cy="227" r="2" fill="#38bdf8" />

        {/* Optical Floor Camera QR Sensor */}
        <rect x="252" y="254" width="16" height="6" rx="2" fill="#0284c7" />
        <path d="M 248 262 L 272 262" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />

        {/* Callout 1: 360° LiDAR Dome */}
        <line x1="260" y1="112" x2="200" y2="55" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="200" cy="55" r="3" fill="#0284c7" />
        <g transform="translate(130, 35)">
          <rect width="135" height="22" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <text x="8" y="15" fill="#1e40af" fontSize="9.5" fontWeight="700">360° Solid-State LiDAR</text>
        </g>

        {/* Callout 2: Turntable Lift Deck */}
        <line x1="310" y1="155" x2="380" y2="85" stroke="#f97316" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="380" cy="85" r="3" fill="#f97316" />
        <g transform="translate(365, 65)">
          <rect width="135" height="22" rx="4" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1" />
          <text x="8" y="15" fill="#c2410c" fontSize="9.5" fontWeight="700">600 kg Lift Turntable</text>
        </g>

        {/* Callout 3: Perimeter LED Safety Strip */}
        <line x1="140" y1="205" x2="80" y2="150" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="80" cy="150" r="3" fill="#0284c7" />
        <g transform="translate(15, 130)">
          <rect width="125" height="22" rx="4" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
          <text x="8" y="15" fill="#15803d" fontSize="9.5" fontWeight="700">LED Safety Halo Strip</text>
        </g>

        {/* Callout 4: QR & SLAM Positioning */}
        <line x1="260" y1="255" x2="350" y2="255" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="350" cy="255" r="3" fill="#64748b" />
        <g transform="translate(340, 245)">
          <rect width="145" height="22" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <text x="8" y="15" fill="#475569" fontSize="9.5" fontWeight="700">Floor QR Grid + SLAM ±5mm</text>
        </g>
      </svg>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '92vw',
          maxWidth: isRobot ? '1120px' : '680px',
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.08)',
          border: '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '11px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {renderAvatar()}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  {item.id || item.code || item.sku}
                </h3>
                {item.status && renderStatusBadge(item.status)}
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0', fontWeight: 500 }}>
                {buildSubtitle()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '13px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isRobot ? (
            /* ROBOT VIEW: COMPACT DUAL-PANE CONSOLE */
            <div style={{ display: 'grid', gridTemplateColumns: '1.12fr 1fr', gap: '14px', alignItems: 'start' }}>
              {/* LEFT COLUMN: ROBOT SCHEMATIC & HARDWARE SPECS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {/* Illustration Container */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    padding: '8px 12px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={13} style={{ color: '#2563eb' }} />
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
                        Digital Twin & Hardware Topology
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', backgroundColor: '#e2e8f0', padding: '1px 6px', borderRadius: '4px' }}>
                      {isForklift ? 'AMR Forklift Duplex' : 'Omnidirectional AMR Platform'}
                    </span>
                  </div>

                  {/* Render the Big Illustration */}
                  {renderBigRobotIllustration()}
                </div>

                {/* 4 Physical Dimensions & Core Capabilities Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <div style={{ padding: '6px 8px', backgroundColor: '#f8fafc', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Dimensions</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {isForklift ? '1,650×920×2,100' : '950×680×320'} mm
                    </div>
                  </div>
                  <div style={{ padding: '6px 8px', backgroundColor: '#f8fafc', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Turn Radius</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                      0 mm (Zero-Turn)
                    </div>
                  </div>
                  <div style={{ padding: '6px 8px', backgroundColor: '#f8fafc', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Travel Speed</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      1.5 m/s (Loaded)
                    </div>
                  </div>
                  <div style={{ padding: '6px 8px', backgroundColor: '#f8fafc', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tare Weight</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {isForklift ? '480 kg' : '145 kg'}
                    </div>
                  </div>
                </div>

                {/* Live RCS Telemetry / Connectivity Banner */}
                <div
                  style={{
                    padding: '7px 11px',
                    borderRadius: '7px',
                    backgroundColor:
                      item.status === 'Running'
                        ? '#eff6ff'
                        : item.status === 'Charging'
                        ? '#fffbeb'
                        : item.status === 'Fault'
                        ? '#fef2f2'
                        : item.status === 'Idle'
                        ? '#f0fdf4'
                        : '#f8fafc',
                    border: `1px solid ${
                      item.status === 'Running'
                        ? '#bfdbfe'
                        : item.status === 'Charging'
                        ? '#fde68a'
                        : item.status === 'Fault'
                        ? '#fecaca'
                        : item.status === 'Idle'
                        ? '#bbf7d0'
                        : '#e2e8f0'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Radio
                    size={14}
                    style={{
                      color:
                        item.status === 'Running'
                          ? '#2563eb'
                          : item.status === 'Charging'
                          ? '#d97706'
                          : item.status === 'Fault'
                          ? '#dc2626'
                          : item.status === 'Idle'
                          ? '#16a34a'
                          : '#64748b',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>
                    {item.status === 'Running' && (
                      <>
                        <strong style={{ color: '#1e40af' }}>Active Mission:</strong> Dispatched via RCS adapter. Autonomous floor navigation active.
                      </>
                    )}
                    {item.status === 'Idle' && (
                      <>
                        <strong style={{ color: '#15803d' }}>Standby at Node:</strong> Ready for task dispatching. Coordinates locked.
                      </>
                    )}
                    {item.status === 'Charging' && (
                      <>
                        <strong style={{ color: '#b45309' }}>Charging Session:</strong> Docked at station. High-rate charge active (+15 kW).
                      </>
                    )}
                    {item.status === 'Offline' && (
                      <>
                        <strong style={{ color: '#475569' }}>Telemetry Offline:</strong> Vehicle unlinked or out of range. Check physical power.
                      </>
                    )}
                    {item.status === 'Fault' && (
                      <>
                        <strong style={{ color: '#b91c1c' }}>Safety Interlock Tripped:</strong> Obstacle halt or E-stop engaged. Operator inspection required.
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: 4 METRIC CARDS, ACTIVE MISSION & TECHNICAL SPECIFICATIONS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {/* 2x2 Key Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                  {/* Operational Status */}
                  <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '3px' }}>
                      Operational Status
                    </div>
                    <div>{renderStatusBadge(item.status)}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                      {item.status === 'Offline'
                        ? 'RCS Link Lost'
                        : item.status === 'Running'
                        ? 'Floor Navigation'
                        : 'Standby / Ready'}
                    </div>
                  </div>

                  {/* Battery Level */}
                  <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Battery Level
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: batteryColor }}>
                        {batteryLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        {item.battery}%
                      </span>
                    </div>
                    {/* Visual Battery Bar */}
                    <div style={{ width: '100%', height: '4px', borderRadius: '2px', backgroundColor: '#e2e8f0', marginTop: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, item.battery))}%`,
                          height: '100%',
                          backgroundColor: batteryColor,
                          borderRadius: '2px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Current Location */}
                  <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '3px' }}>
                      Location Node
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={13} style={{ color: '#2563eb', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {item.currentLocation || 'Unknown'}
                      </span>
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {(item.currentLocation || '').startsWith('FGW')
                        ? 'Finished Goods Warehouse'
                        : (item.currentLocation || '').startsWith('RMW')
                        ? 'Raw Material Staging'
                        : (item.currentLocation || '').startsWith('ASSY')
                        ? 'Assembly Station Line'
                        : 'Designated Coordinate'}
                    </div>
                  </div>

                  {/* Maximum Payload */}
                  <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '3px' }}>
                      Max Payload
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Package size={13} style={{ color: '#059669', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {item.maxPayloadKg ? `${item.maxPayloadKg.toLocaleString()} kg` : '600 kg'}
                      </span>
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {item.model || 'Standard Rating'}
                    </div>
                  </div>
                </div>

                {/* Active Mission Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Active Mission Assignment
                    </h4>
                    {item.currentTask && item.currentTask !== '—' ? (
                      <span style={{ fontSize: '9px', fontWeight: 600, color: '#2563eb', backgroundColor: '#eff6ff', padding: '1px 6px', borderRadius: '9999px', border: '1px solid #bfdbfe' }}>
                        DISPATCH ACTIVE
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '9999px', border: '1px solid #cbd5e1' }}>
                        STANDBY
                      </span>
                    )}
                  </div>

                  {item.currentTask && item.currentTask !== '—' ? (
                    <div style={{ padding: '6px 9px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#1e40af' }}>
                        <ArrowRight size={12} style={{ color: '#2563eb' }} />
                        <span>{item.currentTask}</span>
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#3b82f6', marginTop: '2px' }}>
                        Dispatched via WCS Fleet Router · Destination Node: {item.currentLocation}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '5px 9px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9', color: '#64748b', fontSize: '10px' }}>
                      No transport mission currently assigned. Robot is idle in staging area ready for allocation.
                    </div>
                  )}
                </div>

                {/* Detailed Technical Parameters (Compact 2-col Grid) */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 11px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', margin: '0 0 5px 0' }}>
                    Technical Specifications
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: '10.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Vendor</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.vendor || 'Astra Robotics'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Model</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.model || 'Astra 600'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '2px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Protocol</span>
                      <span style={{ fontWeight: 600, color: '#2563eb', backgroundColor: '#eff6ff', padding: '1px 5px', borderRadius: '3px', border: '1px solid #bfdbfe', fontSize: '9.5px' }}>
                        {item.protocol || 'VDA5050 v2.0'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Payload</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.maxPayloadKg ? `${item.maxPayloadKg.toLocaleString()} kg` : '600 kg'}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', paddingBottom: '2px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Navigation</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>Natural Feature SLAM + LiDAR + Floor QR</span>
                    </div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Last Telemetry Sync</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {item.lastUpdate || '10:24:15'} ({item.lastUpdateDate || '16 Jun 2025'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compact Enterprise System Notice */}
                <div
                  style={{
                    padding: '5px 9px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '6px',
                    border: '1px solid #bfdbfe',
                    fontSize: '9.5px',
                    color: '#1e40af',
                    lineHeight: 1.35,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldCheck size={13} style={{ color: '#2563eb', flexShrink: 0 }} />
                  <div>
                    <strong>WCS Registry:</strong> Machine capabilities locked. Dispatched via RCS adapter.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* NON-ROBOT CATEGORIES VIEW: BALANCED 2-COLUMN MODAL */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '9px 11px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Status
                    </div>
                    <div>{renderStatusBadge(item.status)}</div>
                  </div>
                  {item.integrationSource && (
                    <div style={{ padding: '9px 11px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Integration Source
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{item.integrationSource}</div>
                    </div>
                  )}
                  {item.availableQty !== undefined && (
                    <div style={{ padding: '9px 11px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Available Qty
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}>
                        {item.availableQty.toLocaleString()} <span style={{ fontSize: '10px', color: '#64748b' }}>{item.unit}</span>
                      </div>
                    </div>
                  )}
                  {item.location && (
                    <div style={{ padding: '9px 11px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Location
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{item.location}</div>
                    </div>
                  )}
                  {item.maxCapacityKg && (
                    <div style={{ padding: '9px 11px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Max Capacity
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{item.maxCapacityKg.toLocaleString()} kg</div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '6px',
                    border: '1px solid #bfdbfe',
                    fontSize: '10px',
                    color: '#1e40af',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldCheck size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                  <div>
                    <strong>WCS Registry Node:</strong> Master Data entity synchronized with industrial plant controllers.
                  </div>
                </div>
              </div>

              {/* Technical Parameters for Non-Robots */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px 12px' }}>
                <h4 style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 7px 0' }}>
                  Technical Parameters
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                  {item.vendor && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Vendor</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.vendor}</span>
                    </div>
                  )}
                  {item.coordinates && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Coordinates</span>
                      <span style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{item.coordinates}</span>
                    </div>
                  )}
                  {item.nodeId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Node ID</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.nodeId}</span>
                    </div>
                  )}
                  {item.weightKg && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Weight</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.weightKg} kg</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ color: '#64748b' }}>Last Sync</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      {item.lastUpdate || item.lastHeartbeat || '10:24:15'} ({item.lastUpdateDate || '16 Jun 2025'})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Resource ID: <strong style={{ color: '#475569' }}>{item.id || item.code || item.sku}</strong> · Master Data Fleet Registry
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>

            {onEditItem && (
              <button
                onClick={() => onEditItem(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={12} />
                <span>Edit {isRobot ? 'Robot' : 'Item'}</span>
              </button>
            )}

            {isRobot && (
              <Link
                href={`/warehouse-map?robot=${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 16px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
                }}
              >
                <MapPin size={12} />
                <span>Locate on Map</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 3. DELETE CONFIRMATION MODAL
// ===========================================================================
interface DeleteConfirmModalProps {
  item: any | null;
  onClose: () => void;
  onConfirm: (item: any) => void;
}

export function DeleteConfirmModal({ item, onClose, onConfirm }: DeleteConfirmModalProps) {
  if (!item) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '400px',
          padding: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Delete Item Confirmation
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Are you sure you want to remove <strong>{item.id || item.code || item.sku}</strong>?
            </p>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45, margin: 0 }}>
          This will unregister the resource from the active WCS scheduling topology. Active dispatch queues referencing this resource will require re-assignment.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(item);
              onClose();
            }}
            style={{
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(220,38,38,0.2)',
            }}
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 4. IMPORT CSV MODAL
// ===========================================================================
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: MasterCategoryKey;
  onImportSuccess: (count: number) => void;
}

export function ImportModal({ isOpen, onClose, activeCategory, onImportSuccess }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    let headers = 'ID,Name,Type,Model,Status,Battery,CurrentLocation,Vendor,Protocol';
    if (activeCategory === 'equipment') headers = 'ID,Name,EquipmentType,Location,Vendor,Status,IntegrationSource';
    if (activeCategory === 'locations') headers = 'Code,Name,Zone,LocationType,Status,MaxCapacityKg,Coordinates';
    if (activeCategory === 'materials') headers = 'SKU,Name,MaterialType,Unit,AvailableQty,WeightKg';

    const blob = new Blob([headers], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${activeCategory}_master.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSimulateImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setImportSummary(`Successfully validated and imported 5 new records into ${activeCategory} catalog.`);
      setTimeout(() => {
        onImportSuccess(5);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '480px',
          padding: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Import {activeCategory} Data
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Upload CSV or Excel master data batch files.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Dropzone */}
        <div
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '10px',
            padding: '28px 16px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
          }}
          onClick={() => {
            const fakeFile = new File(['mock'], `batch_${activeCategory}_import.csv`, { type: 'text/csv' });
            setSelectedFile(fakeFile);
          }}
        >
          <Upload size={24} style={{ color: '#2563eb', margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>
            {selectedFile ? selectedFile.name : 'Click to select CSV file, or drag and drop'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
            Supported formats: .CSV, .XLSX (Max file size 10MB)
          </div>
        </div>

        {importSummary && (
          <div style={{ padding: '8px 12px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '6px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={14} style={{ color: '#10b981' }} />
            <span>{importSummary}</span>
          </div>
        )}

        {/* Template Download Link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
          <span>Need a reference format?</span>
          <button
            onClick={handleDownloadTemplate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#2563eb',
              background: 'none',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={12} />
            Download Sample CSV Template
          </button>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSimulateImport}
            disabled={!selectedFile || isProcessing}
            style={{
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: !selectedFile ? '#94a3b8' : '#2563eb',
              border: 'none',
              borderRadius: '6px',
              cursor: !selectedFile ? 'not-allowed' : 'pointer',
            }}
          >
            {isProcessing ? 'Validating Batch...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 5. MORE FILTERS MODAL / POPOVER
// ===========================================================================
interface MoreFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filterState: MasterDataFilterState;
  onFilterChange: (updates: Partial<MasterDataFilterState>) => void;
}

export function MoreFiltersModal({ isOpen, onClose, filterState, onFilterChange }: MoreFiltersProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '420px',
          padding: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Advanced Filter Parameters
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Battery Threshold Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            <span>Minimum Battery Level</span>
            <span style={{ color: '#2563eb' }}>{filterState.batteryMin}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={filterState.batteryMin}
            onChange={(e) => onFilterChange({ batteryMin: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#2563eb' }}
          />
        </div>

        {/* Vendor Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Equipment / Robot Vendor
          </label>
          <select
            value={filterState.vendor}
            onChange={(e) => onFilterChange({ vendor: e.target.value })}
            style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="All">All Vendors</option>
            <option value="Astra Robotics">Astra Robotics</option>
            <option value="Pudu Robotics">Pudu Robotics</option>
            <option value="Toyota / Astra JV">Toyota / Astra JV</option>
            <option value="Interroll Automation">Interroll Automation</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={() => {
              onFilterChange({ batteryMin: 0, vendor: 'All' });
              onClose();
            }}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
