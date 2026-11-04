import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, QrCode } from 'lucide-react';
import { Batch } from '../types';
import { formatDate } from '../utils';

interface QrCodeModalProps {
  batch: Batch;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ batch, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const qrPayload = JSON.stringify({
    id: batch.id,
    tag: batch.batchTag,
    species: batch.species,
    eggs: batch.eggCount,
    start: batch.startDate,
    room: batch.roomName,
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const win = window.open('', '', 'width=600,height=700');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>KALRO Tray Tag - ${batch.batchTag || batch.id}</title>
          <style>
            body { font-family: 'Poppins', sans-serif; text-align: center; padding: 2rem; }
            .tag-card { border: 2px solid #214641; border-radius: 12px; padding: 1.5rem; max-width: 400px; margin: 0 auto; }
            h2 { color: #214641; margin-bottom: 4px; font-size: 20px; }
            p { margin: 4px 0; color: #555; font-size: 14px; }
            .badge { background: #214641; color: #fff; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="tag-card">
            <h2>KALRO Sericulture</h2>
            <p>Rearing Tray QR Identity</p>
            <div style="margin: 1.5rem 0;">${printContent.innerHTML}</div>
            <p><strong>${batch.displayTag || batch.batchTag}</strong></p>
            <p>Species: ${batch.species === 'bombyx' ? 'Bombyx mori' : 'Eri Silkworm'}</p>
            <p>Population: ${batch.eggCount.toLocaleString()} • Start: ${formatDate(batch.startDate)}</p>
            <p>${batch.roomName || 'Rearing House'}</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode size={18} color="var(--primary-green)" />
            <span>Rearing Tray QR Tag</span>
          </h3>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <div style={{ padding: '1rem 0' }}>
          <div
            ref={printRef}
            style={{
              background: '#ffffff',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              display: 'inline-block',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--card-border)',
            }}
          >
            <QRCodeSVG value={qrPayload} size={180} level="M" />
          </div>

          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '1rem' }}>
            {batch.displayTag || batch.batchTag}
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {batch.species === 'bombyx' ? 'Bombyx mori (Mulberry)' : 'Eri Silkworm'} •{' '}
            {batch.eggCount.toLocaleString()} larvae
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Hatched: {formatDate(batch.startDate)} • {batch.roomName || 'House 1'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1, color: 'var(--text-dark)', borderColor: 'var(--card-border)' }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-accent"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Printer size={16} />
            <span>Print Tray Tag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
