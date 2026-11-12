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
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: '1px solid #CBD5E1',
          animation: 'fadeEnter 0.2s ease-out',
        }}
      >
        {/* Institutional Header Banner */}
        <div
          style={{
            backgroundColor: '#0F3826',
            color: '#FFFFFF',
            padding: '1.25rem 1.5rem',
            borderBottom: '3px solid #C68A14',
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
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FCD34D',
              flexShrink: 0,
            }}
          >
            <Lock size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9AE6B4', fontWeight: 700 }}>
              Security Protocol · Terminal Armed
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.25 }}>
              KALRO Sericulture Facility
            </div>
            <div style={{ fontSize: '0.75rem', color: '#E2E8F0', marginTop: '2px' }} className="truncate">
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
                color: '#475569',
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
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: selectedUser?.avatarColor || '#0F3826',
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
                  <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                    {selectedUser?.username || 'Staff Member'}
                  </strong>
                  {selectedUser?.staffId && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontFamily: 'monospace',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: '#E2E8F0',
                        color: '#334155',
                      }}
                    >
                      {selectedUser.staffId}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
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
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#334155',
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
                color: '#64748B',
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
                      border: '2px solid #0F3826',
                      backgroundColor: isFilled ? '#0F3826' : 'transparent',
                      transition: 'all 0.15s ease',
                      boxShadow: isFilled ? '0 0 0 3px rgba(15, 56, 38, 0.2)' : 'none',
                    }}
                  />
                );
              })}
            </div>

            {errorMsg ? (
              <div
                style={{
                  color: '#DC2626',
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
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
                Default institutional PIN is <strong style={{ color: '#475569' }}>2026</strong>
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
                style={{
                  height: '48px',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  color: '#0F172A',
                  cursor: 'pointer',
                  transition: 'background 0.1s, transform 0.05s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#E2E8F0')}
                onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC')}
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              style={{
                height: '48px',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                color: '#64748B',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              style={{
                height: '48px',
                fontSize: '1.25rem',
                fontWeight: 600,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                color: '#0F172A',
                cursor: 'pointer',
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#E2E8F0')}
              onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC')}
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              style={{
                height: '48px',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                color: '#64748B',
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
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#0F3826',
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
              color: '#64748B',
              borderTop: '1px solid #F1F5F9',
              paddingTop: '0.85rem',
            }}
          >
            <ShieldAlert size={13} style={{ color: '#0F3826' }} />
            <span>Station Audit Ledger is locked &amp; tamper-resistant.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
