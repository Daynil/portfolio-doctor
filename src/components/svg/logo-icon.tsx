import React from 'react';

type Props = {
  className: string;
};

const LogoIcon = ({ className }: Props) => {
  return (
    <svg
      width="44"
      height="44"
      fill="currentColor"
      className={className}
      id="svg3826"
      version="1.1"
    >
      <g id="layer1" transform="translate(0,-1008.3622)">
        <path
          style={{
            fill: 'none',
            stroke: 'currentcolor',
            strokeWidth: '4',
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
          }}
          d="m 33.365394,1022.2736 5.710028,-2.8355 2.89628,4.7285 m -29.883543,8.4411 c 0,0 -0.968098,10.7062 0.642857,14 1.669792,3.4141 6.293998,1.9457 7.713017,-0.1993 1.324274,-2.0018 2.899683,-8.5299 2.946036,-8.5052 l 5.024006,3.1633 2.926033,-10.4212 4.379487,2.869 2.33192,-11.1122 m -31.6062135,-9.7944 -4.3571429,0 0,12 c 0,5.4028 5.0475336,7.6874 9.0000004,8 5.141545,0.4066 10,-3.5133 10,-8 l 0,-12 -4.357142,0"
        />
      </g>
    </svg>
  );
};

export default LogoIcon;
