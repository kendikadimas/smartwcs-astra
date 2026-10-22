'use client';

import React, { useState, useEffect } from 'react';
import { UserItem, RoleDefinition, RoleName } from '@/types/user';
import { X, UserPlus, Save, Lock, Mail, User, Shield } from 'lucide-react';

interface AddEditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  roles: RoleDefinition[];
  onSave: (user: Partial<UserItem>) => void;
}

export function AddEditUserModal({
  isOpen,
  onClose,
  user,
  roles,
  onSave,
}: AddEditUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState<RoleName>('WAREHOUSE_OPERATOR');
  const [shift, setShift] = useState('Shift 1 (07:00 - 15:00)');
  const [active, setActive] = useState(true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setUsername(user.username);
      setEmail(user.email);
      setRoleName(user.roleName);
      setShift(user.shift);
      setActive(user.active);
      setPassword('');
    } else {
      setFullName('');
      setUsername('');
      setEmail('');
      setRoleName('WAREHOUSE_OPERATOR');
      setShift('Shift 1 (07:00 - 15:00)');
      setActive(true);
      setPassword('P@ssword2026!');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email) return;

    const matchedRole = roles.find((r) => r.name === roleName);

    onSave({
      userId: user ? user.userId : `usr-${Date.now()}`,
      fullName,
      username,
      email,
      roleName,
      roleLabel: matchedRole?.label || roleName,
      shift,
      active,
      avatarColor: user?.avatarColor || '#0284c7',
      lastLoginAt: user?.lastLoginAt || 'Never logged in',
      createdAt: user?.createdAt || '22 Oct 2026',
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '520px', maxWidth: '95vw', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
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
              <UserPlus size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                {user ? 'Edit Operator Account' : 'Provision New User Account'}
              </h2>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Assign RBAC permissions, shift schedules, and credentials
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {/* Full Name & Username */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Full Legal Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rizky Pratama"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px', padding: '7px 10px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. opr.rizky"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px', padding: '7px 10px', fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                Corporate Email Address
              </label>
              <input
                type="email"
                placeholder="user@winteq.astra.co.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '12px', padding: '7px 10px' }}
                required
              />
            </div>

            {/* Role & Shift */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Assigned RBAC Role
                </label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value as RoleName)}
                  className="select-input"
                  style={{ width: '100%', fontSize: '12px', height: '33px' }}
                >
                  {roles.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Shift Schedule
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="select-input"
                  style={{ width: '100%', fontSize: '12px', height: '33px' }}
                >
                  <option value="Shift 1 (07:00 - 15:00)">Shift 1 (07:00 - 15:00)</option>
                  <option value="Shift 2 (15:00 - 23:00)">Shift 2 (15:00 - 23:00)</option>
                  <option value="Shift 3 (23:00 - 07:00)">Shift 3 (23:00 - 07:00)</option>
                  <option value="General Office (08:00 - 17:00)">General Office (08:00 - 17:00)</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                {user ? 'Reset Password (Leave blank to keep current)' : 'Initial Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={user ? '••••••••••••' : 'Enter temporary password'}
                className="input-field"
                style={{ width: '100%', fontSize: '12px', padding: '7px 10px', fontFamily: 'var(--font-mono)' }}
                required={!user}
              />
            </div>

            {/* Active Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Account is Active and authorized to login
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={14} />
              {user ? 'Update Account' : 'Provision User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
