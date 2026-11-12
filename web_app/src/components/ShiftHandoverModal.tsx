import React, { useState } from 'react';
import { ArrowRightLeft, ShieldCheck, CheckCircle2, Clock, AlertCircle, X, KeyRound } from 'lucide-react';
import { Batch, EnvironmentLog, FeedLog, MortalityLog, UserAccount, AuditLogEntry, ShiftHandoverRecord } from '../types';
import { USER_ROLES } from '../constants';
import { isFedToday } from '../utils';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  allUsers: UserAccount[];
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  envLogs: EnvironmentLog[];
  onCompleteHandover: (record: ShiftHandoverRecord) => void;
}

export const ShiftHandoverModal: React.FC<ShiftHandoverModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  batches,
  feedLogs,
  mortalityLogs,
  envLogs,
  onCompleteHandover,
}) => {
  const otherUsers = allUsers.filter((u) => u.id !== currentUser?.id);
  const [incomingUserId, setIncomingUserId] = useState<string>(
    otherUsers[0]?.id || allUsers[0]?.id || ''
  );
  const [shift, setShift] = useState<'morning' | 'midday' | 'evening' | 'night'>('midday');
  const [bedStatus, setBedStatus] = useState<'clean' | 'dusting_needed' | 'lime_dusted'>('lime_dusted');
  const [notes, setNotes] = useState<string>('');
  const [incomingPin, setIncomingPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const incomingUser = allUsers.find((u) => u.id === incomingUserId) || otherUsers[0];
  const activeBatches = batches.filter((b) => b.status === 'active');
  const todayStr = new Date().toISOString().split('T')[0];

  // Feeds completed today vs pending
  let completedFeeds = 0;
  let pendingFeeds = 0;
  for (const b of activeBatches) {
    if (isFedToday(b.id, feedLogs)) {
      completedFeeds++;
    } else {
      pendingFeeds++;
    }
  }

  // Today's total mortality
  const todayMortality = mortalityLogs
    .filter((m) => m.recordedAt.startsWith(todayStr))
    .reduce((sum, m) => sum + m.count, 0);

  // Latest chamber environment
  const latestEnv = envLogs.length > 0 ? envLogs[0] : null;

  const handleExecuteHandover = () => {
    if (!incomingUser) {
      setErrorMsg('Please select an incoming staff attendant.');
      return;
    }

    const validPin = incomingUser.pinCode || '2026';
    if (incomingPin !== validPin && incomingPin !== '2026') {
      setErrorMsg(`Invalid PIN for ${incomingUser.username}. Enter assigned PIN or default (2026).`);
      return;
    }

    const record: ShiftHandoverRecord = {
      id: `handover-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromOperatorId: currentUser.id,
      fromOperatorName: currentUser.username,
      toOperatorId: incomingUser.id,
      toOperatorName: incomingUser.username,
      shift,
      completedFeedsCount: completedFeeds,
      pendingFeedsCount: pendingFeeds,
      mortalityTotal: todayMortality,
      chamberTempCelsius: latestEnv?.temperatureCelsius || 25.0,
      chamberHumidityPercent: latestEnv?.humidityPercent || 75,
      bedCleanlinessStatus: bedStatus,
      notes: notes.trim(),
      signedByIncomingPin: true,
    };

    onCompleteHandover(record);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowRightLeft size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Official Station Shift Handover Protocol
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Transfer custody of active rearing lots, verify microclimate, and authenticate with incoming PIN
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Operator Handover Flow Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outgoing Staff</div>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{currentUser.username}</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{currentUser.staffId || currentUser.role}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)', padding: '0 8px' }}>
              <ArrowRightLeft size={18} />
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Incoming Staff</div>
              <select
                value={incomingUserId}
                onChange={(e) => {
                  setIncomingUserId(e.target.value);
                  setErrorMsg(null);
                }}
                className="simple-input"
                style={{ fontSize: '0.82rem', padding: '4px 8px' }}
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.staffId || u.role.split('_')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shift Type & Live Tally */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1rem' }}>
            <div style={{ padding: '6px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Active Lots</div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{activeBatches.length}</strong>
            </div>
            <div style={{ padding: '6px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Pending Feeds</div>
              <strong style={{ fontSize: '1rem', color: pendingFeeds > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                {pendingFeeds}
              </strong>
            </div>
            <div style={{ padding: '6px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Day Mortality</div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{todayMortality} worms</strong>
            </div>
            <div style={{ padding: '6px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Chamber Temp</div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                {latestEnv?.temperatureCelsius || 25}°C
              </strong>
            </div>
          </div>

          {/* Shift Selection & Bed Hygiene */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Shift Handover Phase
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as any)}
                className="simple-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="morning">Morning Shift (07:00 – 12:00)</option>
                <option value="midday">Midday Shift (12:00 – 17:00)</option>
                <option value="evening">Evening Shift (17:00 – 21:30)</option>
                <option value="night">Night Rest Duty (21:30 – 06:00)</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Bed Cleanliness &amp; Hygiene
              </label>
              <select
                value={bedStatus}
                onChange={(e) => setBedStatus(e.target.value as any)}
                className="simple-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="lime_dusted">Beds Net-Cleaned &amp; Lime Dusted</option>
                <option value="clean">Beds Clean / Awaiting Lime Dusting</option>
                <option value="dusting_needed">Bed Cleaning Required This Shift</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Operational Observations &amp; Next Attendant Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. CSR2 batch enters 4th moult by 15:00, withhold leaf. Window 3 louver opened for ventilation..."
              className="simple-input"
              style={{ width: '100%', fontSize: '0.82rem' }}
            />
          </div>

          {/* Incoming Attendant PIN Verification */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(15, 56, 38, 0.05)',
              border: '1px solid rgba(15, 56, 38, 0.2)',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                  <KeyRound size={15} />
                  <strong style={{ fontSize: '0.82rem' }}>Incoming Attendant PIN Sign-Off</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {incomingUser?.username} enters PIN to accept facility custody
                </div>
              </div>

              <input
                type="password"
                maxLength={6}
                value={incomingPin}
                onChange={(e) => {
                  setIncomingPin(e.target.value.replace(/\D/g, ''));
                  setErrorMsg(null);
                }}
                placeholder="PIN (2026)"
                className="simple-input"
                style={{ width: '120px', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center', fontFamily: 'monospace' }}
              />
            </div>

            {errorMsg && (
              <div style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: '6px', fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px' }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteHandover}
              className="btn-accent"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px' }}
            >
              <ShieldCheck size={16} />
              Authenticate &amp; Complete Handover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
