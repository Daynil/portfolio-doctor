export function clamp(num: number, lower: number, upper: number) {
  return num < lower ? lower : num > upper ? upper : num;
}

export function round(num: number, places: number) {
  const multiplier = Math.pow(10, places);
  return Math.round(num * multiplier) / multiplier;
}

export function between(
  val: number,
  min: number,
  max: number,
  type?: 'inclusiveLeft' | 'inclusiveRight' | 'exclusive'
): boolean {
  if (!type) return val >= min && val <= max;
  switch (type) {
    case 'inclusiveLeft':
      return val >= min && val < max;
    case 'inclusiveRight':
      return val > min && val <= max;
    case 'exclusive':
      return val > min && val < max;
  }
}

/**
 * Get the inverse of the standard normal cumulative distribution
 * (a distribution with a mean of zero and a standard deviation of one).
 * This gets the quantile corresponding to the input probability, which is
 * essentially the number of standard deviations from the mean.
 *
 * Relative error of this implemenation is less than 1.15 × 10−9 in the entire region.
 *
 * Based on Peter John Acklman's algorithm:
 * https://web.archive.org/web/20151030212308/http://home.online.no/~pjacklam/notes/invnorm/index.html#Other_algorithms
 *
 * @param p The input probability, a decimal number from 0 to 1
 * @returns The quantile corresponding to the input probability (standard devations)
 */
export function normSinv(p: number): number {
  const a1 = -3.969683028665376e1;
  const a2 = 2.209460984245205e2;
  const a3 = -2.759285104469687e2;
  const a4 = 1.38357751867269e2;
  const a5 = -3.066479806614716e1;
  const a6 = 2.506628277459239;

  const b1 = -5.447609879822406e1;
  const b2 = 1.615858368580409e2;
  const b3 = -1.556989798598866e2;
  const b4 = 6.680131188771972e1;
  const b5 = -1.328068155288572e1;

  const c1 = -7.784894002430293e-3;
  const c2 = -3.223964580411365e-1;
  const c3 = -2.400758277161838;
  const c4 = -2.549732539343734;
  const c5 = 4.374664141464968;
  const c6 = 2.938163982698783;

  const d1 = 7.784695709041462e-3;
  const d2 = 3.224671290700398e-1;
  const d3 = 2.445134137142996;
  const d4 = 3.754408661907416;

  const p_low = 0.02425;
  const p_high = 1 - p_low;

  let q: number;

  // Rational approximation for lower region
  if (0 < p && p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    );
  }

  // Rational approximation for central region
  if (p_low <= p && p <= p_high) {
    q = p - 0.5;
    const r = q * q;
    return (
      ((((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q) /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1)
    );
  }

  // Rational approximation for upper region
  if (p_high < p && p < 1) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    );
  }
}

// ** Using d3 for these now
// export function median(values: number[]): number {
//   if (!values.length) return 0;
//   values = [...values];
//   values.sort((a, b) => a - b);
//   const half = Math.floor(values.length / 2);
//   if (values.length % 2) return values[half];
//   return (values[half - 1] + values[half]) / 2.0;
// }

// export function mean(values: number[]): number {
//   return values.reduce((total, curr) => total + curr, 0) / values.length;
// }

// export function min(values: number[]): { value: number; index: number } {
//   return values.reduce(
//     (min, curr, i) =>
//       min.value === null || curr < min.value ? { value: curr, index: i } : min,
//     { value: null, index: null }
//   );
// }

// export function max(values: number[]): { value: number; index: number } {
//   return values.reduce(
//     (max, curr, i) =>
//       max.value === null || curr > max.value ? { value: curr, index: i } : max,
//     { value: null, index: null }
//   );
// }
