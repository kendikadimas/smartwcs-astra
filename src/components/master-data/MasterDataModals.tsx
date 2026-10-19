'use client';

import React, { useState, useEffect } from 'react';
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
// 2. DETAIL VIEW DRAWER
// ===========================================================================
interface DetailDrawerProps {
  item: any | null;
  onClose: () => void;
  activeCategory: MasterCategoryKey;
}

export function DetailDrawer({ item, onClose, activeCategory }: DetailDrawerProps) {
  if (!item) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        zIndex: 9998,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {item.id || item.code || item.sku}
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                {item.name} · {item.type || item.equipmentType || item.materialType || activeCategory}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Key Attribute Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>Operational Status</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                {item.status}
              </div>
            </div>
            {item.battery !== undefined && (
              <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Battery Level</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                  {item.battery}%
                </div>
              </div>
            )}
            {item.currentLocation && (
              <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Current Location</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                  {item.currentLocation}
                </div>
              </div>
            )}
            {item.model && (
              <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Hardware Model</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                  {item.model}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Technical Parameters */}
          <div>
            <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Technical Specifications
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Vendor / Manufacturer</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.vendor || 'Astra Robotics'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Communication Protocol</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.protocol || item.integrationSource || 'VDA5050 v2.0'}</span>
              </div>
              {item.maxPayloadKg && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Maximum Payload</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.maxPayloadKg} kg</span>
                </div>
              )}
              {item.currentTask && item.currentTask !== '—' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Active Task Assigned</span>
                  <span style={{ fontWeight: 600, color: '#2563eb' }}>{item.currentTask}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Last Telemetry Sync</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.lastUpdate || '10:24:15'} ({item.lastUpdateDate || '16 Jun 2025'})</span>
              </div>
            </div>
          </div>

          {/* Enterprise System Boundary Notice */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              fontSize: '11px',
              color: '#1e40af',
              lineHeight: 1.45,
            }}
          >
            <strong>WCS Domain Notice:</strong> Master Data registers resource capabilities and location coordinate nodes. Fleet execution is dispatched via RCS adapter. Physical safety authority remains with machine-level controllers.
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
