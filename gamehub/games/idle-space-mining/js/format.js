'use strict';
// Number & time formatting helpers

const FMT_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc'];

function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n);
  if (n < 1000) {
    if (n === 0) return '0';
    if (n < 10 && n % 1 !== 0) return n.toFixed(1);
    return Math.floor(n).toString();
  }
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier >= FMT_SUFFIXES.length) return n.toExponential(2).replace('e+', 'e');
  const scaled = n / Math.pow(10, tier * 3);
  const str = scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2);
  return str + FMT_SUFFIXES[tier];
}

function fmtInt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 1000) return Math.floor(n).toString();
  return fmt(n);
}

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  if (sec < 60) return sec + 's';
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return m + 'm ' + (s > 0 ? s + 's' : '').trim();
  const h = Math.floor(m / 60), mm = m % 60;
  if (h < 24) return h + 'h ' + (mm > 0 ? mm + 'm' : '').trim();
  const d = Math.floor(h / 24), hh = h % 24;
  return d + 'd ' + (hh > 0 ? hh + 'h' : '').trim();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
