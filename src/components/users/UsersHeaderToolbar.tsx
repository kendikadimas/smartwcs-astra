'use client';

import React from 'react';
import { Users, Plus, Search, ShieldCheck, UserCheck } from 'lucide-react';

interface UsersHeaderToolbarProps {
  viewMode: 'roster' | 'matrix';
  onSelectViewMode: (mode: 'roster' | 'matrix') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddModal: () => void;
}

export function UsersHeaderToolbar({
  viewMode,
  onSelectViewMode,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
}: UsersHeaderToolbarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
      <div className="page-header-row" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Users &amp; Access Control (RBAC)</h1>
          <p className="page-subtitle">
            Operator account provisioning, shift assignments, and role-based access control matrix per docs/RBAC.md.
          </p>
        </div>

        <div className="page-actions">
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '6px' }}>
            <button
              onClick={() => onSelectViewMode('roster')}
              style={{
                padding: '5px 12px',
                fontSize: '11.5px',
                fontWeight: viewMode === 'roster' ? 700 : 500,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'roster' ? '#ffffff' : 'transparent',
                color: viewMode === 'roster' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'roster' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
              }}
            >
              User Roster
            </button>
            <button
              onClick={() => onSelectViewMode('matrix')}
              style={{
                padding: '5px 12px',
                fontSize: '11.5px',
                fontWeight: viewMode === 'matrix' ? 700 : 500,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'matrix' ? '#ffffff' : 'transparent',
                color: viewMode === 'matrix' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'matrix' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
              }}
            >
              RBAC Permissions Matrix
            </button>
          </div>

          {/* Add User Action */}
          <button onClick={onOpenAddModal} className="btn-primary">
            <Plus size={14} />
            Add User Account
          </button>
        </div>
      </div>
    </div>
  );
}
