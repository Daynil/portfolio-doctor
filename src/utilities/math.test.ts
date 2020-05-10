import { clamp, max, mean, median, min } from '../utilities/math';

describe('math helpers', () => {
  test('gets median', () => {
    const oddArray = [3, 13, 7, 5, 21, 23, 39, 23, 40, 23, 14, 12, 56, 23, 29];
    const evenArray = [3, 13, -7, 5, 22, 23, 23, 40, 23, 14, 12, 56, 23, 29];
    expect(median(oddArray)).toEqual(23);
    expect(median(evenArray)).toEqual(22.5);
  });

  test('gets mean', () => {
    const array = [3, 13, 7, 5, 21, 23, 39, 23, 40, 23, 14, 12, 56, 23, 29];
    expect(mean(array)).toEqual(22.066666666666666);
  });

  test('gets min', () => {
    const array = [3, 13, 7, 5, 21, 23, 39, 23, 40, 23, 14, 12, 56, 23, 29];
    const arrayNeg = [3, 13, 7, 5, 21, 23, 39, 23, 40, -10, -45, 23, 23, 29];
    expect(min(array)).toEqual({ value: 3, index: 0 });
    expect(min(arrayNeg)).toEqual({ value: -45, index: 10 });
  });

  test('gets max', () => {
    const array = [3, 13, 7, 5, 21, 23, 39, 23, 40, 23, 14, 12, 56, 23, 29];
    const arrayNeg = [3, 13, 7, 5, 21, 23, 39, 23, 40, -10, -45, 23, 23, 29];
    expect(max(array)).toEqual({ value: 56, index: 12 });
    expect(max(arrayNeg)).toEqual({ value: 40, index: 8 });
  });

  test('clamps values', () => {
    const num = 10;
    expect(clamp(num, 0, 20)).toEqual(num);
    expect(clamp(num, 11, 20)).toEqual(11);
    expect(clamp(num, 0, 9)).toEqual(9);
  });
});
