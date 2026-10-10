export const fmt = (n: number) => n.toLocaleString('es-MX');
export const fmtMXN = (n: number) => '$' + n.toLocaleString('es-MX');
/** $1,840 M / $12.4 M — para KPIs donde el número completo no cabe. */
export const fmtMXNCorto = (n: number) =>
  n >= 1_000_000_000 ? `$${(n / 1_000_000_000).toFixed(2)} MMDP`
  : n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)} M`
  : fmtMXN(n);
