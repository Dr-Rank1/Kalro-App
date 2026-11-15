import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KALRO Sericulture B2C Backend API',
  description: 'Safaricom Daraja M-PESA B2C Payout Cloud Counterpart for KALRO Sericulture',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
