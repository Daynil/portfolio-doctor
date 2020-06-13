export function median(values: number[]): number {
  if (!values.length) return 0;
  values = [...values];
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  return (values[half - 1] + values[half]) / 2.0;
}

export function mean(values: number[]): number {
  return values.reduce((total, curr) => total + curr, 0) / values.length;
}

export function min(values: number[]): { value: number; index: number } {
  return values.reduce(
    (min, curr, i) =>
      min.value === null || curr < min.value ? { value: curr, index: i } : min,
    { value: null, index: null }
  );
}

export function max(values: number[]): { value: number; index: number } {
  return values.reduce(
    (max, curr, i) =>
      max.value === null || curr > max.value ? { value: curr, index: i } : max,
    { value: null, index: null }
  );
}

export function clamp(num: number, lower: number, upper: number) {
  return num < lower ? lower : num > upper ? upper : num;
}

export function round(num: number, places: number) {
  const multiplier = Math.pow(10, places);
  return Math.round(num * multiplier) / multiplier;
}
