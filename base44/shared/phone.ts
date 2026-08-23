// Shared phone normalization — strips formatting variants so +971 50 123 4567,
// 00971501234567, and 971501234567 all collapse to one canonical key.
export function normalizePhone(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  // keep a leading +, drop everything else non-digit
  const hasPlus = s.startsWith('+');
  let digits = s.replace(/[^\d]/g, '');
  if (!hasPlus && s.startsWith('00')) {
    digits = digits.slice(2); // international prefix 00 -> +
  }
  if (!digits) return null;
  // require a country code (at least 8 digits incl. CC) and a sane max
  if (digits.length < 8 || digits.length > 15) return null;
  return '+' + digits;
}

export function genCouponCode(prefix = 'DC') {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = (n) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `${prefix}-${block(4)}${block(4)}`;
}