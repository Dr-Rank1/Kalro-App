import React, { useState } from 'react';
import { Thermometer, Droplets, Wind, AlertTriangle, CheckCircle, Save, X } from 'lucide-react';
import { EnvironmentLog, FarmProfile, UserAccount } from '../types';
import { calculatePsychrometrics } from '../utils';

interface ChamberPsychrometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClimate: (log: EnvironmentLog) => void;
  profile?: FarmProfile | null;
  currentUser?: UserAccount | null;
  batchId?: string;
}

export const ChamberPsychrometricModal: React.FC<ChamberPsychrometricModalProps> = ({
  isOpen,
  onClose,
  onSaveClimate,
  profile,
  currentUser,
  batchId = 'station-all',
}) => {
  const [dryBulb, setDryBulb] = useState<number>(26.5);
  const [wetBulb, setWetBulb] = useState<number>(24.0);
  const [roomName, setRoomName] = useState<string>('Rearing House 1 - Bay A');
  const [ventilation, setVentilation] = useState<'optimal' | 'low' | 'excessive'>('optimal');

  if (!isOpen) return null;

  const results = calculatePsychrometrics(dryBulb, wetBulb);
  const houseCount = Math.max(1, profile?.houseCount || 4);
  const chambers = Array.from({ length: houseCount }, (_, i) => `Rearing House ${i + 1}`);

  const handleSave = () => {
    const log: EnvironmentLog = {
      id: `env-${Date.now()}`,
      batchId,
      recordedAt: new Date().toISOString(),
      temperatureCelsius: dryBulb,
      humidityPercent: results.rhPercent,
      dryBulbCelsius: dryBulb,
      wetBulbCelsius: wetBulb,
      saturationDeficit: results.saturationDeficitGramsM3,
      ventilationStatus: ventilation,
      roomName,
      operatorId: currentUser?.id,
      operatorName: currentUser?.username,
      operatorRole: currentUser?.role,
      notes: `Wet-Bulb Depression: ${results.depression}°C · Saturation Deficit: ${results.saturationDeficitGramsM3} g/m³ (${results.status})`,
    };
    onSaveClimate(log);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Thermometer size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Chamber Wet &amp; Dry Bulb Psychrometer
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Calibrate relative humidity and vapor saturation deficit using dry &amp; wet bulb thermometers
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Chamber Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Rearing Chamber / House Bay
            </label>
            <select
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="simple-input"
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              {chambers.map((c) => (
                <option key={c} value={c}>
                  {c} · Ambient Sensor
                </option>
              ))}
            </select>
          </div>

          {/* Thermometer Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Dry Bulb Thermometer (°C)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  min="15"
                  max="45"
                  value={dryBulb}
                  onChange={(e) => setDryBulb(parseFloat(e.target.value) || 20)}
                  className="simple-input"
                  style={{ fontSize: '1.15rem', fontWeight: 700, width: '100%', textAlign: 'center' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>°C</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Actual air dry temperature
              </span>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Wet Bulb Thermometer (°C)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="40"
                  value={wetBulb}
                  onChange={(e) => setWetBulb(parseFloat(e.target.value) || 18)}
                  className="simple-input"
                  style={{ fontSize: '1.15rem', fontWeight: 700, width: '100%', textAlign: 'center' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>°C</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Moist wick evaporative temp
              </span>
            </div>
          </div>

          {/* Ventilation Status */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Louvers &amp; Airflow Movement
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(['optimal', 'low', 'excessive'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setVentilation(mode)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: ventilation === mode ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: ventilation === mode ? 'rgba(15, 56, 38, 0.08)' : 'var(--bg-subtle)',
                    color: ventilation === mode ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode === 'optimal' ? 'Optimal Draft' : mode === 'low' ? 'Stagnant (Low)' : 'Excessive Draft'}
                </button>
              ))}
            </div>
          </div>

          {/* Computed Psychrometric Analysis Box */}
          <div
            style={{
              backgroundColor: results.status === 'optimal' ? 'rgba(46, 125, 50, 0.08)' : 'rgba(198, 138, 20, 0.1)',
              border: results.status === 'optimal' ? '1px solid rgba(46, 125, 50, 0.25)' : '1px solid rgba(198, 138, 20, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Depression (ΔT)</div>
                <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{results.depression}°C</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Relative Humidity</div>
                <strong style={{ fontSize: '1.25rem', color: results.status === 'optimal' ? 'var(--status-success)' : 'var(--status-warning)' }}>
                  {results.rhPercent}% RH
                </strong>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Saturation Deficit</div>
                <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{results.saturationDeficitGramsM3} g/m³</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', lineHeight: 1.45, borderTop: '1px solid var(--border-divider)', paddingTop: '0.5rem', color: 'var(--text-main)' }}>
              <strong>Agronomic Guidance:</strong> {results.correctiveAction}
            </div>
          </div>

          {/* Modal Action Controls */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px' }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-accent"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px' }}
            >
              <Save size={15} />
              Save to Chamber History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
