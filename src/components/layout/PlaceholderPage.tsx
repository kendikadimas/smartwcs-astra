import React from 'react';
import Link from 'next/link';
import { AppShell } from './AppShell';
import { ArrowLeft, Clock, Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  category: string;
  description: string;
  phase: string;
}

export function PlaceholderPage({
  title,
  category,
  description,
  phase,
}: PlaceholderPageProps) {
  return (
    <AppShell>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{category} Module</p>
        </div>
      </div>

      <div
        className="panel"
        style={{
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          minHeight: '360px',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Construction size={28} />
        </div>

        <div style={{ maxWidth: '440px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#d97706',
              backgroundColor: '#fffbeb',
              padding: '3px 10px',
              borderRadius: '999px',
              marginBottom: '8px',
            }}
          >
            <Clock size={12} />
            <span>ROADMAP · {phase}</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            {title} in Implementation Queue
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>
            {description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <Link href="/" className="btn-secondary">
            <ArrowLeft size={14} />
            Operations Overview
          </Link>
          <Link href="/tasks" className="btn-primary">
            Task Management
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
