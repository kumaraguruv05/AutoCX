export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatIndianDenomination(amount: number): string {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh.toFixed(2)} Lakh`;
  } else if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k.toFixed(1)}k`;
  }
  return formatINR(amount);
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}
