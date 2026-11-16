import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, UserCheck, AlertCircle } from 'lucide-react';
import { FarmProfile, UserAccount } from '../types';
import { USER_ROLES } from '../constants';

interface TerminalLockModalProps {
  isOpen: boolean;
  currentUser: UserAccount | null;
  allUsers: UserAccount[];
  profile: FarmProfile | null;
  onUnlock: (operator: UserAccount) => void;
}

export const TerminalLockModal: React.FC<TerminalLockModalProps> = ({
  isOpen,
  currentUser,
  allUsers,
  profile,
  onUnlock,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser?.id || (allUsers[0]?.id ?? '')
  );
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const selectedUser = allUsers.find((u) => u.id === selectedUserId) || currentUser || allUsers[0];
  const roleMeta = selectedUser
    ? USER_ROLES.find((r) => r.value === selectedUser.role) || USER_ROLES[0]
    : USER_ROLES[0];

  useEffect(() => {
    if (currentUser?.id) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    setEnteredPin('');
    setErrorMsg(null);
  }, [isOpen, selectedUserId]);

  // Keyboard handler for typing PIN
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (enteredPin.length < 6) {
          handleDigitPress(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleValidatePin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, enteredPin, selectedUser]);

  if (!isOpen) return null;

  const handleDigitPress = (digit: string) => {
    if (enteredPin.length >= 6) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setErrorMsg(null);

    // Auto-check on 4 digits
    if (nextPin.length === 4) {
      verifyPinCandidate(nextPin);
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg(null);
  };

  const verifyPinCandidate = (candidate: string) => {
    setIsVerifying(true);
    const validPin = selectedUser?.pinCode || profile?.pinCode || '2026';

    setTimeout(() => {
      setIsVerifying(false);
      // Valid if matches user pin, station pin, or default fallback 2026
      if (candidate === validPin || candidate === '2026' || (!selectedUser?.pinCode && candidate.length >= 4)) {
        if (selectedUser) {
          onUnlock(selectedUser);
        }
      } else {
        setErrorMsg('Invalid operator PIN. Enter default (2026) or assigned staff PIN.');
        setEnteredPin('');
      }
    }, 180);
  };

  const handleValidatePin = () => {
    if (enteredPin.length < 4) {
      setErrorMsg('Please enter at least 4 digits.');
      return;
    }
    verifyPinCandidate(enteredPin);
  };

  return (
    <div
      className="terminal-lock-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        className="terminal-lock-dialog"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
          border: '1px solid var(--border-silk)',
          animation: 'fadeEnter 0.2s ease-out',
        }}
      >
        {/* Institutional Header Banner */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            color: 'var(--text-main)',
            padding: '1.25rem 1.5rem',
            borderBottom: '3px solid var(--accent-gold)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)',
              flexShrink: 0,
            }}
          >
            <Lock size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>
              Security Protocol · Terminal Armed
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.25 }}>
              KALRO Sericulture Facility
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }} className="truncate">
              {profile?.orgName || 'National Sericulture Research Centre, Thika'}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Active Operator Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              Operator on Duty
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-silk)',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: selectedUser?.avatarColor || 'var(--primary)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {selectedUser?.avatarInitials || 'OP'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {selectedUser?.username || 'Staff Member'}
                  </strong>
                  {selectedUser?.staffId && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontFamily: 'monospace',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--bg-card-elevated)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {selectedUser.staffId}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {roleMeta.label} · {selectedUser?.shift ? `${selectedUser.shift.toUpperCase()} SHIFT` : 'Duty Operator'}
                </div>
              </div>
            </div>

            {/* Operator Switcher dropdown if multiple staff */}
            {allUsers.length > 1 && (
              <div style={{ marginTop: '6px' }}>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setEnteredPin('');
                    setErrorMsg(null);
                  }}
                  style={{
                    width: '100%',
                    fontSize: '0.76rem',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-silk)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                  }}
                >
                  {allUsers.map((u) => {
                    const rMeta = USER_ROLES.find((r) => r.value === u.role) || USER_ROLES[0];
                    return (
                      <option key={u.id} value={u.id}>
                        Switch to {u.username} ({u.staffId || rMeta.label})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* PIN Display Dots */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                marginBottom: '10px',
              }}
            >
              Enter Security PIN to Unlock
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < enteredPin.length;
                return (
                  <div
                    key={index}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2px solid var(--primary)',
                      backgroundColor: isFilled ? 'var(--primary)' : 'transparent',
                      transition: 'all 0.15s ease',
                      boxShadow: isFilled ? '0 0 0 3px rgba(22, 163, 74, 0.3)' : 'none',
                    }}
                  />
                );
              })}
            </div>

            {errorMsg ? (
              <div
                style={{
                  color: 'var(--status-danger)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '6px',
                }}
              >
                <AlertCircle size={13} />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Default institutional PIN is <strong style={{ color: 'var(--text-main)' }}>2026</strong>
              </div>
            )}
          </div>

          {/* Numeric Keypad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              maxWidth: '280px',
              margin: '0 auto 1rem',
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className="min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                style={{
                  height: '48px',
                  minHeight: '48px',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-card-elevated)',
                  border: '1px solid var(--border-silk)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'background 0.1s, transform 0.05s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-subtle)')}
                onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card-elevated)')}
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              style={{
                height: '48px',
                minHeight: '48px',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-silk)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              style={{
                height: '48px',
                minHeight: '48px',
                fontSize: '1.25rem',
                fontWeight: 600,
                backgroundColor: 'var(--bg-card-elevated)',
                border: '1px solid var(--border-silk)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-subtle)')}
              onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card-elevated)')}
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              style={{
                height: '48px',
                minHeight: '48px',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-silk)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              ⌫
            </button>
          </div>

          {/* Action Bar */}
          <button
            type="button"
            onClick={handleValidatePin}
            disabled={isVerifying || enteredPin.length === 0}
            className="min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '12px 16px',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: enteredPin.length > 0 ? 'pointer' : 'not-allowed',
              opacity: enteredPin.length > 0 ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s ease',
            }}
          >
            <Unlock size={16} />
            <span>{isVerifying ? 'Verifying PIN...' : 'Unlock Terminal'}</span>
          </button>

          {/* Security Notice Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '1.25rem',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-silk)',
              paddingTop: '0.85rem',
            }}
          >
            <ShieldAlert size={13} style={{ color: 'var(--primary)' }} />
            <span>Station Audit Ledger is locked &amp; tamper-resistant.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
