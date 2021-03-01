import { between, clamp, normSinv, round } from '../utilities/math';

describe('math helpers', () => {
  test('clamps values', () => {
    const num = 10;
    expect(clamp(num, 0, 20)).toEqual(num);
    expect(clamp(num, 11, 20)).toEqual(11);
    expect(clamp(num, 0, 9)).toEqual(9);
  });

  test('rounds values', () => {
    expect(round(10.92589, 0)).toEqual(11);
    expect(round(10.12589, 0)).toEqual(10);
    expect(round(10.12589, 1)).toEqual(10.1);
    expect(round(10.12589, 2)).toEqual(10.13);
    expect(round(10.12589, 3)).toEqual(10.126);
    expect(round(10.12589, 4)).toEqual(10.1259);
    expect(round(10.12589, 5)).toEqual(10.12589);
  });

  test('tests value is between two numbers', () => {
    expect(between(999, 1, 2)).toBeFalsy();

    expect(between(1, 0, 2)).toBeTruthy();
    expect(between(1, 1, 2)).toBeTruthy();
    expect(between(2, 1, 2)).toBeTruthy();

    expect(between(-1, 0, 1)).toBeFalsy();
    expect(between(0, -1, 1)).toBeTruthy();
    expect(between(-1, -1, 1)).toBeTruthy();
    expect(between(-1, -1, 1, 'inclusiveLeft')).toBeTruthy();
    expect(between(-1, -1, 1, 'inclusiveRight')).toBeFalsy();

    expect(between(1, 1, 2, 'inclusiveLeft')).toBeTruthy();
    expect(between(1, 1, 2, 'inclusiveRight')).toBeFalsy();
    expect(between(1, 1, 2, 'exclusive')).toBeFalsy();
    expect(between(1, 0, 2, 'exclusive')).toBeTruthy();
  });

  /**
   * Expected values are from Excel's NORM.S.INV function.
   * Portfolio Doctor Simulation, 3-Cycle Inf Adj Monte Carlo sheet
   */
  test('gets the inverse of standard normal cumulative distribution', () => {
    const randomValuesTestArray = [
      0.296694870605894,
      0.279680326751622,
      0.853271701727797,
      0.69306737230965,
      0.161196456935518,
      0.985188407160825,
      0.581885716265265,
      8.33282215968913e-2,
      0.511172862727826,
      0.457656632902557,
      0.612517212448199,
      0.729196831437739,
      0.210962776440891,
      0.99075579998327,
      0.246091026024186,
      // Edge cases
      0.999999999,
      0.000000001
    ];
    const expectedResultArray = [
      -0.533930323858675,
      -0.58379141702191,
      1.05056897492446,
      0.504563779217039,
      -0.989552465165099,
      2.17509249607872,
      0.206719961014697,
      -1.38302746974291,
      0.028009875730481,
      -0.106339155870965,
      0.285885819467423,
      0.610385702261433,
      -0.803085093552304,
      2.35568878233865,
      -0.686842392910744,
      // Edge cases
      5.99780701960164,
      -5.99780701500769
    ];

    for (let i = 0; i < randomValuesTestArray.length; i++) {
      expect(normSinv(randomValuesTestArray[i])).toBeCloseTo(
        expectedResultArray[i],
        8
      );
    }
  });

  // Using d3 for these now
  // test('gets median', () => {
  //   const oddArray = [3, 13, 7, 5, 21, 23, 39, 23, 40, 23, 14, 12, 56, 23, 29];
  //   const evenArray = [3, 13, -7, 5, 22, 23, 23, 40, 23, 14, 12, 56, 23, 29];
  //   expect(median(oddArray)).toEqual(23);
  //   expect(median(evenArray)).toEqual(22.5);
  // });

  // test('gets mean', () => {
  //   const array = [3, 13, 7, 5, 21, 23, 39, 23, 40, 23, 14, 12, 56, 23, 29];
  //   expect(mean(array)).toEqual(22.066666666666666);
  // });

  // test('gets min', () => {
  //   const array = [3, 13, 7, 5, 21, 23, 39, 23, 40, 23, 14, 12, 56, 23, 29];
  //   const arrayNeg = [3, 13, 7, 5, 21, 23, 39, 23, 40, -10, -45, 23, 23, 29];
  //   expect(min(array)).toEqual({ value: 3, index: 0 });
  //   expect(min(arrayNeg)).toEqual({ value: -45, index: 10 });
  // });

  // test('gets max', () => {
  //   const array = [3, 13, 7, 5, 21, 23, 39, 23, 40, 23, 14, 12, 56, 23, 29];
  //   const arrayNeg = [3, 13, 7, 5, 21, 23, 39, 23, 40, -10, -45, 23, 23, 29];
  //   expect(max(array)).toEqual({ value: 56, index: 12 });
  //   expect(max(arrayNeg)).toEqual({ value: 40, index: 8 });
  // });
});
