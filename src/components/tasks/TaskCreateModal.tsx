'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { TaskItem, TaskPriority, TaskType } from '@/types/task';
import { PlusCircle, AlertCircle } from 'lucide-react';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: TaskItem) => void;
}

export function TaskCreateModal({
  isOpen,
  onClose,
  onCreateTask,
}: TaskCreateModalProps) {
  const [taskType, setTaskType] = useState<TaskType>('Transport');
  const [origin, setOrigin] = useState('RMW-A01');
  const [destination, setDestination] = useState('ASSY-02');
  const [priority, setPriority] = useState<TaskPriority>('Normal');
  const [material, setMaterial] = useState('Starter Motor Stator Assembly');
  const [materialSku, setMaterialSku] = useState('SKU-STATOR-200');
  const [quantity, setQuantity] = useState('10');
  const [containerId, setContainerId] = useState('PLT-5510');
  const [resource, setResource] = useState('AMR-02');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      setError('Origin and destination locations are required.');
      return;
    }
    if (origin.trim().toUpperCase() === destination.trim().toUpperCase()) {
      setError('Origin and destination cannot be identical.');
      return;
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const idSuffix = String(Math.floor(100 + Math.random() * 900));
    const newTaskId = `T-250616-${idSuffix}`;

    const newTask: TaskItem = {
      id: newTaskId,
      type: taskType,
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      priority,
      status: 'Queued',
      prdStatus: 'QUEUED',
      resource: resource === 'Auto-dispatch' ? 'Unassigned' : resource,
      createdAt: timeStr,
      createdDate: '16 Jun 2025',
      elapsed: '00 min',
      isDelayed: false,
      material,
      materialSku,
      quantity: Number(quantity) || 1,
      containerId,
      progressPercent: 0,
    };

    onCreateTask(newTask);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Warehouse Task"
      subtitle="Issue a new material handling or transport task into SYNTRA WCS."
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#b91c1c',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Task Type */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Task Type *
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
              className="select-input"
              style={{ width: '100%', height: '34px' }}
            >
              <option value="Transport">Transport</option>
              <option value="Delivery">Delivery</option>
              <option value="Pickup">Pickup</option>
              <option value="Move">Move</option>
              <option value="Putaway">Putaway</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Priority *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="select-input"
              style={{ width: '100%', height: '34px' }}
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Origin Location */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Origin Location *
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => {
                setOrigin(e.target.value);
                setError(null);
              }}
              placeholder="e.g. RMW-A01"
              style={{
                width: '100%',
                height: '34px',
                padding: '0 10px',
                fontSize: '12.5px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none',
              }}
              required
            />
          </div>

          {/* Destination Location */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Destination Location *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setError(null);
              }}
              placeholder="e.g. ASSY-02"
              style={{
                width: '100%',
                height: '34px',
                padding: '0 10px',
                fontSize: '12.5px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none',
              }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
          {/* Material Name */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Material Description
            </label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g. Alternator Rotor Core"
              style={{
                width: '100%',
                height: '34px',
                padding: '0 10px',
                fontSize: '12.5px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none',
              }}
            />
          </div>

          {/* Material SKU */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Material SKU
            </label>
            <input
              type="text"
              value={materialSku}
              onChange={(e) => setMaterialSku(e.target.value)}
              placeholder="e.g. SKU-ROTOR-01"
              style={{
                width: '100%',
                height: '34px',
                padding: '0 10px',
                fontSize: '12.5px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Container / Bin ID */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Container / Bin ID
            </label>
            <input
              type="text"
              value={containerId}
              onChange={(e) => setContainerId(e.target.value)}
              placeholder="e.g. PLT-8812"
              style={{
                width: '100%',
                height: '34px',
                padding: '0 10px',
                fontSize: '12.5px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none',
              }}
            />
          </div>

          {/* Assigned Resource Preference */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Resource Preference
            </label>
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="select-input"
              style={{ width: '100%', height: '34px' }}
            >
              <option value="Auto-dispatch">Auto-dispatch (WCS logic)</option>
              <option value="AMR-01">AMR-01 (Idle - 82%)</option>
              <option value="AMR-02">AMR-02 (Running - 61%)</option>
              <option value="AMR-03">AMR-03 (Charging - 25%)</option>
              <option value="PUDU-001">PUDU-001 (Running - 66%)</option>
              <option value="Conveyor-01">Conveyor-01</option>
              <option value="Lift-01">Lift-01</option>
            </select>
          </div>
        </div>

        {/* Notice on functional boundaries */}
        <div
          style={{
            fontSize: '11px',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '8px 10px',
            lineHeight: 1.4,
          }}
        >
          <strong>Notice:</strong> This is a frontend demo execution. WCS coordinates execution; RCS handles physical robot navigation and PLC handles sensor interlocks.
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ height: '34px', padding: '0 14px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            style={{ height: '34px', padding: '0 16px' }}
          >
            <PlusCircle size={14} />
            Create task
          </button>
        </div>
      </form>
    </Modal>
  );
}
