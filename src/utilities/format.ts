export function numToCurrency(amount: number, decimals = 2): string {
  if (isNaN(amount)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(amount);
}

export function numToCommaNum(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount);
}

export function commaNumToNum(amount: string): number {
  const parsed = parseInt(amount.replace(/,/g, ''));
  if (isNaN(parsed)) {
    throw Error('Not a number');
  } else return parsed;
}

export function numToCurrencyShort(amount: number): string {
  let currency = numToCurrency(amount, 0).split(',')[0];
  let suffix = '';
  if (amount >= 1000 && amount < 1000000) suffix = 'k';
  else if (amount >= 1000000 && amount < 1000000000) suffix = 'm';
  else if (amount >= 1000000000 && amount < 1000000000000) suffix = 'b';
  else if (amount >= 1000000000000) suffix = 't';
  return `${currency}${suffix}`;
}

export function numToPercent(amount: number): string {
  return Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 2
  }).format(amount);
}
