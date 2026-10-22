'use client';

import React, { useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { UsersHeaderToolbar } from '@/components/users/UsersHeaderToolbar';
import { UserKpiCards } from '@/components/users/UserKpiCards';
import { UserTable } from '@/components/users/UserTable';
import { RbacMatrixTable } from '@/components/users/RbacMatrixTable';
import { AddEditUserModal } from '@/components/users/AddEditUserModal';
import { initialMockUsers, mockRoleDefinitions } from '@/data/mockUsers';
import { UserItem, RoleDefinition } from '@/types/user';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastState {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>(initialMockUsers);
  const [roles] = useState<RoleDefinition[]>(mockRoleDefinitions);
  const [viewMode, setViewMode] = useState<'roster' | 'matrix'>('roster');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Toast State
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: 'success' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Handlers
  const handleToggleActive = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.userId === userId) {
          const updatedActive = !u.active;
          showToast(
            updatedActive ? 'success' : 'warning',
            `User ${u.username} has been ${updatedActive ? 'activated' : 'deactivated'}`
          );
          return { ...u, active: updatedActive };
        }
        return u;
      })
    );
  };

  const handleResetPassword = (user: UserItem) => {
    showToast('info', `Password reset token generated and dispatched to ${user.email}`);
  };

  const handleSaveUser = (userData: Partial<UserItem>) => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.userId === editingUser.userId ? ({ ...u, ...userData } as UserItem) : u))
      );
      showToast('success', `User account ${userData.username} updated successfully`);
    } else {
      setUsers((prev) => [userData as UserItem, ...prev]);
      showToast('success', `New user account ${userData.username} provisioned successfully`);
    }
  };

  const activeCount = users.filter((u) => u.active).length;

  return (
    <AppShell>
      {/* Toast Alert Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#0f172a' : toast.type === 'warning' ? '#78350f' : '#1e3a8a',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12.5px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} color="#4ade80" />
          ) : (
            <AlertCircle size={16} color="#fbbf24" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              marginLeft: '6px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Toolbar */}
      <UsersHeaderToolbar
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => {
          setEditingUser(null);
          setIsAddEditOpen(true);
        }}
      />

      {/* 4 User & RBAC Metric Cards */}
      <UserKpiCards
        totalUsers={users.length}
        activeCount={activeCount}
        rolesCount={roles.length}
      />

      {/* Main View Area: Roster Table or RBAC Matrix Table */}
      <div style={{ marginBottom: '24px' }}>
        {viewMode === 'roster' ? (
          <UserTable
            users={users}
            roles={roles}
            onEditUser={(u) => {
              setEditingUser(u);
              setIsAddEditOpen(true);
            }}
            onToggleActive={handleToggleActive}
            onResetPassword={handleResetPassword}
          />
        ) : (
          <RbacMatrixTable />
        )}
      </div>

      {/* Footer Operational Boundary Disclaimer */}
      <div className="footer-disclaimer">
        <span>
          WCS coordinates tasks &amp; dispatch, WMS: inventory · RCS: robot execution · PLC: equipment control · Safety authority remains external.
        </span>
        <span className="demo-snapshot-tag">
          DEMO SNAPSHOT · Main Warehouse · 22 Oct 2026, 09:50 WIB
        </span>
      </div>

      {/* Add / Edit User Modal */}
      <AddEditUserModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        roles={roles}
        onSave={handleSaveUser}
      />
    </AppShell>
  );
}
