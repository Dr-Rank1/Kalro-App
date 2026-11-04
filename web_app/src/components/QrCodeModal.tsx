import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer } from 'lucide-react';
import { Batch } from '../types';
import { formatDate } from '../utils';

interface QrCodeModalProps {
  batch: Batch;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ batch, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Encode structured payload for station tray scanning
  const qrPayload = JSON.stringify({
    station: 'KALRO-NSRC',
    v: 1,
    id: batch.id,
    tag: batch.batchTag,
    species: batch.species,
    start: batch.startDate,
    eggs: batch.eggCount,
    room: batch.roomName || 'Rearing House 1',
  });

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KALRO Tray Tag - ${batch.batchTag || batch.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 24px;
              color: #142019;
            }
            .tag-card {
              border: 2px solid #143D2B;
              border-radius: 4px;
              padding: 16px;
              display: inline-block;
              width: 320px;
            }
            h2 { margin: 8px 0; font-size: 16px; color: #143D2B; }
            p { margin: 4px 0; font-size: 12px; }
            .badge {
              display: inline-block;
              background: #143D2B;
              color: white;
              padding: 2px 8px;
              border-radius: 2px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="tag-card">
            <span class="badge">KALRO National Sericulture Research Centre</span>
            <h2>${batch.displayTag || batch.batchTag}</h2>
            <p><strong>Species Strain:</strong> ${batch.species === 'bombyx' ? 'Bombyx mori (Bivoltine)' : 'Samia cynthia ricini (Eri)'}</p>
            <p><strong>Lot ID:</strong> ${batch.id}</p>
            <p><strong>Egg / Larvae Count:</strong> ${batch.eggCount.toLocaleString()}</p>
            <p><strong>Placement Date:</strong> ${formatDate(batch.startDate)}</p>
            <p><strong>Rearing House:</strong> ${batch.roomName || 'House 1'}</p>
            <div style="margin: 16px 0;">
              ${printRef.current?.innerHTML || ''}
            </div>
            <p style="font-size: 10px; color: #666;">Official barcode label for bed tracking and harvest traceability.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Station Tray QR Tag
          </h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0.75rem 0' }}>
          <div
            ref={printRef}
            style={{
              background: '#ffffff',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-block',
              border: '1px solid var(--border-card)',
            }}
          >
            <QRCodeSVG value={qrPayload} size={160} level="M" />
          </div>

          <h4 className="truncate" style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.85rem' }}>
            {batch.displayTag || batch.batchTag}
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {batch.species === 'bombyx' ? 'Bombyx mori (CSR2 x CSR4 Bivoltine)' : 'Eri Silkworm (Samia ricini)'} •{' '}
            <span className="tabular-nums">{batch.eggCount.toLocaleString()}</span> larvae
          </p>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Hatched: <span className="tabular-nums">{formatDate(batch.startDate)}</span> • {batch.roomName || 'House 1'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-accent"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
          >
            <Printer size={15} />
            <span>Print Tray Tag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
