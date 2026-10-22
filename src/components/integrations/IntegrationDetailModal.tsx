'use client';

import React, { useState, useEffect } from 'react';
import { IntegrationAdapterItem, ProtocolType, SystemType } from '@/types/integration';
import {
  X,
  Settings,
  Save,
  Key,
  ShieldAlert,
  Server,
  Globe,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface IntegrationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  adapter: IntegrationAdapterItem | null;
  onSave: (updated: IntegrationAdapterItem) => void;
}

export function IntegrationDetailModal({
  isOpen,
  onClose,
  adapter,
  onSave,
}: IntegrationDetailModalProps) {
  const [formData, setFormData] = useState<Partial<IntegrationAdapterItem>>({});
  const [showSecret, setShowSecret] = useState(false);
  const [dummySecret, setDummySecret] = useState('pudu_sec_live_99218ab44301c');

  useEffect(() => {
    if (adapter) {
      setFormData({
        ...adapter,
      });
    }
  }, [adapter]);

  if (!isOpen || !adapter) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.endpointUrl) return;

    onSave({
      ...adapter,
      ...formData,
      lastTestedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', Just now',
    } as IntegrationAdapterItem);

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '560px', maxWidth: '95vw', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Configure {adapter.name}
              </h2>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Endpoint target, authentication secrets, and protocol parameters
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {/* Adapter Name & System Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Adapter Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px', padding: '7px 10px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  System Type
                </label>
                <select
                  value={formData.systemType || 'RCS'}
                  onChange={(e) => setFormData({ ...formData, systemType: e.target.value as SystemType })}
                  className="select-input"
                  style={{ width: '100%', fontSize: '12px', height: '33px' }}
                >
                  <option value="RCS">RCS (Robot)</option>
                  <option value="WMS">WMS (Inventory)</option>
                  <option value="PLC">PLC (Conveyor)</option>
                  <option value="ERP">ERP (Planning)</option>
                </select>
              </div>
            </div>

            {/* Protocol & Endpoint URL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Protocol
                </label>
                <select
                  value={formData.protocol || 'REST'}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value as ProtocolType })}
                  className="select-input"
                  style={{ width: '100%', fontSize: '12px', height: '33px' }}
                >
                  <option value="REST">REST (HTTP/HTTPS)</option>
                  <option value="OPC_UA">OPC UA Binary</option>
                  <option value="MQTT">MQTT v5</option>
                  <option value="MODBUS_TCP">Modbus TCP</option>
                  <option value="VDA5050">VDA 5050</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Endpoint Target URL
                </label>
                <input
                  type="text"
                  value={formData.endpointUrl || ''}
                  onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px', padding: '7px 10px', fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>
            </div>

            {/* API App Key & Secret */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  API App Key / Username
                </label>
                <input
                  type="text"
                  value={formData.credentialsMasked?.appKey || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credentialsMasked: { ...formData.credentialsMasked!, appKey: e.target.value },
                    })
                  }
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px', padding: '7px 10px', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  API App Secret (Write-Only)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={dummySecret}
                    onChange={(e) => setDummySecret(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', fontSize: '12px', padding: '7px 30px 7px 10px', fontFamily: 'var(--font-mono)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Scope & Description */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                Operational Scope &amp; Notes
              </label>
              <textarea
                value={formData.scopeSummary || ''}
                onChange={(e) => setFormData({ ...formData, scopeSummary: e.target.value })}
                rows={2}
                className="input-field"
                style={{ width: '100%', fontSize: '12px', padding: '7px 10px', resize: 'vertical' }}
              />
            </div>

            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#fffbeb',
                borderRadius: '6px',
                border: '1px solid #fde68a',
                fontSize: '11px',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Lock size={13} />
              <span>
                Per security rules in <code>CLAUDE.md</code>, secrets are stored encrypted and never returned in GET responses.
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
