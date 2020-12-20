import React, { createContext, useContext } from 'react';
import { Dimensions } from '../../utilities/hooks';

type Props = {
  dimensions: Dimensions;
  children: React.ReactNode;
};

const ChartContext = createContext<Dimensions>(null);
export const useChartContext = () => useContext(ChartContext);

export function Chart({ dimensions, children }: Props) {
  return (
    <ChartContext.Provider value={dimensions}>
      <svg width={dimensions.width} height={dimensions.height}>
        <g
          transform={`translate(${dimensions.marginLeft}, ${dimensions.marginTop})`}
        >
          {children}
        </g>
      </svg>
    </ChartContext.Provider>
  );
}
