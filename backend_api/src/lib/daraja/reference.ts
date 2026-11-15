import crypto from 'crypto';

/**
 * Generates an official KALRO M-PESA B2C reference code.
 * Format: KALRO-B2C-YYYYMMDD-XXXX
 * where:
 *   - YYYYMMDD is the current date (e.g. 20261115)
 *   - XXXX is a 4-character uppercase alphanumeric cryptographic suffix
 *
 * Example: KALRO-B2C-20261115-A8F2
 */
export function generateB2CReference(targetDate: Date = new Date()): string {
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const dateSegment = `${yyyy}${mm}${dd}`;

  // Generate 4 cryptographic uppercase alphanumeric characters
  const randomSuffix = crypto
    .randomBytes(3)
    .toString('hex')
    .slice(0, 4)
    .toUpperCase();

  return `KALRO-B2C-${dateSegment}-${randomSuffix}`;
}

/**
 * Validates whether a reference string matches KALRO-B2C-YYYYMMDD-XXXX
 */
export function isValidB2CReference(ref: string): boolean {
  const regex = /^KALRO-B2C-\d{8}-[A-Z0-9]{4}$/;
  return regex.test(ref);
}

/**
 * Normalizes Kenyan mobile numbers to the 254XXXXXXXXX standard required by Safaricom Daraja.
 * Accepts:
 *   - 0712345678 -> 254712345678
 *   - 0112345678 -> 254112345678
 *   - +254712345678 -> 254712345678
 *   - 254712345678 -> 254712345678
 *   - 712345678 -> 254712345678
 */
export function normalizeKenyanPhoneNumber(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/\D/g, '');

  if (digitsOnly.startsWith('254') && digitsOnly.length === 12) {
    return digitsOnly;
  }
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return `254${digitsOnly.slice(1)}`;
  }
  if ((digitsOnly.startsWith('7') || digitsOnly.startsWith('1')) && digitsOnly.length === 9) {
    return `254${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Validates whether a phone number is a valid 12-digit Kenyan Safaricom/Airtel MSISDN (2547... or 2541...)
 */
export function isValidKenyanPhoneNumber(phone: string): boolean {
  const normalized = normalizeKenyanPhoneNumber(phone);
  return /^254(7|1)\d{8}$/.test(normalized);
}
