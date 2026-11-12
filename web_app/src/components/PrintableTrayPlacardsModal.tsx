import React from 'react';
import { Printer, X, QrCode, Building2 } from 'lucide-react';
import { Batch, FarmProfile } from '../types';

interface PrintableTrayPlacardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Batch[];
  profile: FarmProfile | null;
}

export const PrintableTrayPlacardsModal: React.FC<PrintableTrayPlacardsModalProps> = ({
  isOpen,
  onClose,
  batches,
  profile,
}) => {
  if (!isOpen) return null;

  const activeBatches = batches.filter((b) => b.status === 'active');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Printable Station Rearing Rack &amp; Tray Placards
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Physical placards for mounting on rearing racks and chandrika frames with QR synchronization
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handlePrint} className="btn-accent" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
              <Printer size={14} style={{ marginRight: '4px' }} />
              Print Placards
            </button>
            <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {activeBatches.map((b) => {
              const targetCultivar = b.species === 'bombyx' ? 'S-13 / TR-10 Mulberry' : 'GRC-1 Giant Red Castor';
              const qrValue = `https://kalro.org/seri/batch/${profile?.syncCode || b.displayTag || b.batchTag || b.id}`;
              const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrValue)}`;

              return (
                <div
                  key={b.id}
                  style={{
                    border: '2px solid #0F3826',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    backgroundColor: '#FFFFFF',
                    position: 'relative',
                    pageBreakInside: 'avoid',
                  }}
                >
                  {/* Top Placard Seal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F3826', paddingBottom: '0.75rem', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0F3826' }}>
                        KALRO Sericulture Research Station
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {profile?.orgName || 'National Sericulture Research Centre, Thika'}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#0F3826', fontWeight: 700 }}>
                        {profile?.syncCode || 'KALRO-SERI-THK'}
                      </div>
                    </div>

                    <img
                      src={qrApiUrl}
                      alt="Batch QR Code"
                      style={{ width: '64px', height: '64px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  {/* Lot Identity */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                      Lot Reference / Tray Identifier
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {b.displayTag || b.batchTag || b.id}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#0F3826', fontWeight: 600 }}>
                      {b.species === 'bombyx' ? 'Bombyx mori (CSR2 × CSR4 Bivoltine)' : 'Samia cynthia ricini (Eri White Strain)'}
                    </div>
                  </div>

                  {/* Operational Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.74rem', backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <span style={{ color: '#64748B' }}>Chamber Bay:</span>{' '}
                      <strong style={{ color: '#0F172A' }}>{b.roomName || 'House 1 - Bay A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Brushing Date:</span>{' '}
                      <strong style={{ color: '#0F172A' }}>{b.startDate}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Seed Quantity:</span>{' '}
                      <strong style={{ color: '#0F172A' }}>{b.eggCount.toLocaleString()} eggs</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Forage Standard:</span>{' '}
                      <strong style={{ color: '#0F3826' }}>{targetCultivar}</strong>
                    </div>
                  </div>

                  {/* Placard Footer Warning */}
                  <div style={{ marginTop: '0.75rem', fontSize: '0.68rem', color: '#64748B', borderTop: '1px dashed #CBD5E1', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Scan with station tablet for instant feeding log</span>
                    <span style={{ fontWeight: 700, color: '#0F3826' }}>KALRO Official Lot Placard</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
