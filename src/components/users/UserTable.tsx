'use client';

import React, { useState, useMemo } from 'react';
import { UserItem, RoleDefinition } from '@/types/user';
import {
  Search,
  Edit,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface UserTableProps {
  users: UserItem[];
  roles: RoleDefinition[];
  onEditUser: (user: UserItem) => void;
  onToggleActive: (userId: string) => void;
  onResetPassword: (user: UserItem) => void;
}

export function UserTable({
  users,
  roles,
  onEditUser,
  onToggleActive,
  onResetPassword,
}: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const roleThemeMap = useMemo(() => {
    const map = new Map<string, { bg: string; text: string; border: string }>();
    roles.forEach((r) => map.set(r.name, r.badgeTheme));
    return map;
  }, [roles]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.fullName.toLowerCase().includes(q);
        const matchesUser = u.username.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        if (!matchesName && !matchesUser && !matchesEmail) return false;
      }

      if (roleFilter !== 'ALL' && u.roleName !== roleFilter) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header & Filter Controls */}
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            User Accounts Directory
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            ({filteredUsers.length} operators &amp; engineers)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search user, email, shift..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
              style={{
                width: '100%',
                paddingLeft: '28px',
                fontSize: '11.5px',
                height: '30px',
              }}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-input"
            style={{ height: '30px', fontSize: '11.5px', padding: '0 8px' }}
          >
            <option value="ALL">All Roles</option>
            {roles.map((r) => (
              <option key={r.name} value={r.name}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="panel-body" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
          <thead>
            <tr>
              <th>Operator / Account</th>
              <th>Email</th>
              <th>Assigned RBAC Role</th>
              <th>Shift Schedule</th>
              <th style={{ textAlign: 'center' }}>Account Status</th>
              <th>Last Active</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No accounts found matching filter.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const theme = roleThemeMap.get(u.roleName) || { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };

                return (
                  <tr key={u.userId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: u.avatarColor,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {u.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.fullName}</div>
                          <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '11.5px' }}>
                      {u.email}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: theme.bg,
                          color: theme.text,
                          border: `1px solid ${theme.border}`,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}
                      >
                        {u.roleLabel}
                      </span>
                    </td>
                    <td style={{ color: '#334155', fontSize: '11px' }}>
                      {u.shift}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onToggleActive(u.userId)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: u.active ? '#15803d' : '#94a3b8',
                        }}
                        title={u.active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {u.active ? <CheckCircle2 size={14} color="#16a34a" /> : <XCircle size={14} color="#94a3b8" />}
                        <span>{u.active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>
                    <td style={{ fontSize: '11px', color: '#64748b' }}>
                      {u.lastLoginAt}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <button
                          onClick={() => onEditUser(u)}
                          className="btn-icon"
                          title="Edit user details"
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                          }}
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => onResetPassword(u)}
                          className="btn-icon"
                          title="Reset password"
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                          }}
                        >
                          <KeyRound size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '11.5px',
          color: '#64748b',
        }}
      >
        <span>
          Showing {filteredUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} accounts
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11px', height: '26px' }}
          >
            <ChevronLeft size={13} />
            Prev
          </button>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11px', height: '26px' }}
          >
            Next
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
