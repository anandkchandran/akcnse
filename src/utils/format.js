// ── Price formatting (INR) ────────────────────────────────────────────────────
export const fmtPrice = (v, decimals = 2) => {
  if (v == null || !isFinite(v)) return '—';
  return (+v).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// INR with ₹ prefix
export const fmtINR = (v, decimals = 2) => {
  if (v == null || !isFinite(v)) return '—';
  return `₹${fmtPrice(v, decimals)}`;
};

// Volume in shares (Indian formatting: L = lakh, Cr = crore)
export const fmtVolume = (v) => {
  if (v == null) return '—';
  if (v >= 1e7)  return `${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5)  return `${(v / 1e5).toFixed(2)} L`;
  if (v >= 1e3)  return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
};

// P&L in INR crores / lakhs
export const fmtPnl = (v) => {
  if (v == null || !isFinite(v)) return '—';
  const sign = v >= 0 ? '+' : '';
  if (Math.abs(v) >= 1e7)  return `${sign}₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5)  return `${sign}₹${(v / 1e5).toFixed(2)} L`;
  return `${sign}₹${fmtPrice(v, 2)}`;
};

export const fmtPct = (v) => {
  if (v == null) return '—';
  const sign = v >= 0 ? '+' : '';
  return `${sign}${(+v).toFixed(2)}%`;
};

export const fmtTime = (date) => {
  if (!date) return '';
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
};

export const fmtDateTime = (date) => {
  if (!date) return '';
  const opts = { timeZone: 'Asia/Kolkata' };
  const day  = date.toLocaleDateString('en-IN', { ...opts, weekday: 'short', month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString('en-IN', { ...opts, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${day} · ${time} IST`;
};

// Compact price axis labels for charts
export const fmtAxis = (v) => {
  if (v == null || !isFinite(v)) return '';
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (Math.abs(v) >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  if (Math.abs(v) >= 1)   return `₹${v.toFixed(0)}`;
  return `₹${v.toFixed(2)}`;
};

// Shares quantity formatting
export const fmtShares = (v) => {
  if (v == null) return '—';
  return `${Math.round(v).toLocaleString('en-IN')} sh`;
};

// Date only (DD/MM/YY)
export const fmtDate = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
};
