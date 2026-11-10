import React, { useEffect } from 'react';
import { UserAccount, FarmProfile } from '../types';
import { USER_ROLES } from '../constants';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';

interface DeleteProfileModalProps {
  isOpen: boolean;
  user: UserAccount | null;
  profile?: FarmProfile | null;
  allUsers: UserAccount[];
  onClose: () => void;
  onConfirmDelete: (userId: string) => void;
}

export const DeleteProfileModal: React.FC<DeleteProfileModalProps> = ({
  isOpen,
  user,
  profile,
  allUsers,
  onClose,
  onConfirmDelete,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const roleMeta = USER_ROLES.find((r) => r.value === user.role) || USER_ROLES[0];
  const otherUsers = allUsers.filter((u) => u.id !== user.id);
  const nextUser = otherUsers.length > 0 ? otherUsers[0] : null;

  const farmName = profile?.orgName || user.stationName || 'KALRO Sericulture Station';
  const countyName = profile?.county || user.county || 'Kenya';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content delete-profile-modal"
        style={{ maxWidth: '480px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-danger-subtle)',
                color: 'var(--status-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Delete Farm Profile?
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Permanent removal from this device
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Profile Card Preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: user.avatarColor || 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                flexShrink: 0,
              }}
            >
              {user.avatarInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{user.username}</strong>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: `${roleMeta.badgeColor}15`,
                    color: roleMeta.badgeColor,
                    border: `1px solid ${roleMeta.badgeColor}40`,
                  }}
                >
                  {roleMeta.label}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {farmName} • {countyName} County
              </div>
            </div>
          </div>

          {/* Warning text */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--status-danger-subtle)',
              border: '1px solid #F5C6CB',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--status-danger)',
              fontSize: '0.8rem',
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} />
              This will permanently delete:
            </div>
            <ul style={{ margin: '4px 0 0 1.25rem', padding: 0 }}>
              <li>All isolated rearing batches and lot numbers</li>
              <li>Daily mulberry feeding logs</li>
              <li>Room temperature & humidity climate records</li>
              <li>Cocoon harvest records and payments</li>
            </ul>
          </div>

          {/* Consequence Notification */}
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-divider)',
            }}
          >
            {nextUser ? (
              <span>
                After deletion, active profile will switch to <strong>{nextUser.username}</strong>.
              </span>
            ) : (
              <span>
                This is the only profile. The app will return to the blank initial state ready to create a fresh profile.
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(user.id);
              onClose();
            }}
            className="btn-danger"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
          >
            <Trash2 size={14} style={{ marginRight: '6px' }} />
            Delete Profile
          </button>
        </div>
      </div>
    </div>
  );
};
