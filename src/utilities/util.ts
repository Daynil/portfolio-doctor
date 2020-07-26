import { CycleData } from '../data/calc/portfolio-calc';

export type CycleYearDataArr = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

export enum CycleYearDataIdx {
  cycleYear,
  cycleStartYear,
  cumulativeInflation,
  balanceStart,
  balanceInfAdjStart,
  withdrawal,
  withdrawalInfAdjust,
  startSubtotal,
  equities,
  equitiesGrowth,
  dividendsGrowth,
  bonds,
  bondsGrowth,
  endSubtotal,
  fees,
  balanceEnd,
  balanceInfAdjEnd
}

export function portfolioObjToArr3d(
  portfolioLifecyclesData: CycleData[]
): CycleYearDataArr[][] {
  return portfolioLifecyclesData.map((cycleData) => {
    return cycleData.yearData.map((obj) => {
      // prettier-ignore
      const objArr: CycleYearDataArr= [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
      objArr[CycleYearDataIdx.cycleYear] = obj.cycleYear;
      objArr[CycleYearDataIdx.cycleStartYear] = obj.cycleStartYear;
      objArr[CycleYearDataIdx.cumulativeInflation] = obj.cumulativeInflation;
      objArr[CycleYearDataIdx.balanceStart] = obj.balanceStart;
      objArr[CycleYearDataIdx.balanceInfAdjStart] = obj.balanceInfAdjStart;
      objArr[CycleYearDataIdx.withdrawal] = obj.withdrawal;
      objArr[CycleYearDataIdx.withdrawalInfAdjust] = obj.withdrawalInfAdjust;
      objArr[CycleYearDataIdx.startSubtotal] = obj.startSubtotal;
      objArr[CycleYearDataIdx.equities] = obj.equities;
      objArr[CycleYearDataIdx.equitiesGrowth] = obj.equitiesGrowth;
      objArr[CycleYearDataIdx.dividendsGrowth] = obj.dividendsGrowth;
      objArr[CycleYearDataIdx.bonds] = obj.bonds;
      objArr[CycleYearDataIdx.bondsGrowth] = obj.bondsGrowth;
      objArr[CycleYearDataIdx.endSubtotal] = obj.endSubtotal;
      objArr[CycleYearDataIdx.fees] = obj.fees;
      objArr[CycleYearDataIdx.balanceEnd] = obj.balanceEnd;
      objArr[CycleYearDataIdx.balanceInfAdjEnd] = obj.balanceInfAdjEnd;
      return objArr;
    });
  });
}
