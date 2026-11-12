import React, { useState } from 'react';
import { Stethoscope, ShieldAlert, AlertTriangle, CheckCircle, Shield, X, AlertOctagon } from 'lucide-react';
import { Batch, AuditLogEntry, UserAccount } from '../types';
import { DISEASE_LIBRARY } from '../constants';

interface DiseaseDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Batch[];
  currentUser?: UserAccount | null;
  onQuarantineBatch: (batchId: string, reason: string) => void;
  onAddAuditLog: (entry: AuditLogEntry) => void;
}

export const DiseaseDiagnosticModal: React.FC<DiseaseDiagnosticModalProps> = ({
  isOpen,
  onClose,
  batches,
  currentUser,
  onQuarantineBatch,
  onAddAuditLog,
}) => {
  const activeBatches = batches.filter((b) => b.status === 'active');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    activeBatches[0]?.id || ''
  );
  const [selectedDiseaseIdx, setSelectedDiseaseIdx] = useState<number>(0);
  const [quarantineConfirm, setQuarantineConfirm] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedBatch = activeBatches.find((b) => b.id === selectedBatchId) || activeBatches[0];
  const disease = DISEASE_LIBRARY[selectedDiseaseIdx] || DISEASE_LIBRARY[0];

  const handleApplyQuarantine = () => {
    if (!selectedBatch) return;

    onQuarantineBatch(selectedBatch.id, disease.name);

    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      operatorId: currentUser?.id,
      operatorName: currentUser?.username || 'Staff',
      operatorRole: currentUser?.role || 'lead_technician',
      actionType: 'batch_updated',
      title: `EMERGENCY QUARANTINE: ${disease.name}`,
      batchId: selectedBatch.id,
      batchTag: selectedBatch.displayTag || selectedBatch.batchTag,
      roomName: selectedBatch.roomName,
      details: `Batch placed in strict isolation protocol due to clinical signs matching ${disease.name} (${disease.pathogen}). All tool sharing halted. Disinfection protocol activated.`,
      metrics: `Quarantine Active · Severity: ${disease.severity.toUpperCase()}`,
    };
    onAddAuditLog(entry);
    setQuarantineConfirm(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={18} style={{ color: 'var(--status-danger)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Rapid Pathology &amp; Visual Diagnostic Wizard
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Identify larval pathology, execute immediate chemical first-aid, or trigger facility quarantine
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Active Batch Affected */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Target Silkworm Lot Under Evaluation
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="simple-input"
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              {activeBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayTag || b.batchTag || b.id} ({b.species === 'bombyx' ? 'Bombyx mori' : 'Eri'} · {b.roomName})
                </option>
              ))}
            </select>
          </div>

          {/* Disease Selection Tabs */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Observed Clinical Symptoms &amp; Disease Class
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
              {DISEASE_LIBRARY.map((d, index) => {
                const isSelected = index === selectedDiseaseIdx;
                return (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => {
                      setSelectedDiseaseIdx(index);
                      setQuarantineConfirm(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      border: isSelected ? '2px solid var(--status-danger)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'rgba(220, 38, 38, 0.08)' : 'var(--bg-subtle)',
                      color: isSelected ? 'var(--status-danger)' : 'var(--text-main)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{d.name.split(' ')[0]}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }} className="truncate">
                      {d.severity}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Diagnosis Card */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-card)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {disease.name}
                </h4>
                <span style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  {disease.pathogen}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: disease.severity === 'critical' ? '#FEE2E2' : '#FEF3C7',
                  color: disease.severity === 'critical' ? '#DC2626' : '#B45309',
                }}
              >
                {disease.severity} Risk
              </span>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                Clinical Diagnostic Signs
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                {disease.signs}
              </p>
            </div>

            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(15, 56, 38, 0.05)',
                border: '1px solid rgba(15, 56, 38, 0.15)',
                borderRadius: '6px',
                fontSize: '0.76rem',
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: 'var(--primary)' }}>First-Aid Protocol &amp; Bed Hygiene:</strong>{' '}
              {disease.action}
            </div>
          </div>

          {/* Quarantine Isolation Trigger */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#FFF1F2',
              border: '1px solid #FECDD3',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#BE123C' }}>
                  <AlertOctagon size={16} />
                  <strong style={{ fontSize: '0.82rem' }}>Station Quarantine Isolation Protocol</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9F1239', marginTop: '2px' }}>
                  Isolates batch from shared station equipment and flags lot in the audit log
                </div>
              </div>

              {!quarantineConfirm ? (
                <button
                  type="button"
                  onClick={() => setQuarantineConfirm(true)}
                  className="btn-danger"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  Flag Lot for Quarantine
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setQuarantineConfirm(false)}
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyQuarantine}
                    className="btn-danger"
                    style={{ fontSize: '0.72rem', padding: '4px 10px', fontWeight: 700 }}
                  >
                    Confirm Isolation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px' }}>
              Close Diagnostic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
