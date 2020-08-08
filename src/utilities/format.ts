import { format } from 'd3-format';

export function numToCurrency(amount: number, decimals = 2): string {
  if (isNaN(amount)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(amount);
}

export function parseStringyNum(amount: string): number {
  const parsed = parseInt(amount.replace(/,/g, ''));
  if (isNaN(parsed)) {
    throw Error('Not a number');
  } else return parsed;
}

export function numToCurrencyShort(amount: number): string {
  let currency = format('$~s')(amount);
  return currency.replace('G', 'B');
}
