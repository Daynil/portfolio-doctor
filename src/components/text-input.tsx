import React, { forwardRef, LegacyRef } from 'react';

type Props = React.PropsWithRef<JSX.IntrinsicElements['input']> & {
  symbolPrefix?: string;
  symbolSuffix?: string;
};

function TextInput(
  { symbolPrefix, symbolSuffix, className, ...delegated }: Props,
  ref: LegacyRef<HTMLInputElement>
) {
  const rawInput = (
    <input
      className={
        'rounded-md shadow-sm bg-gray-100 border-gray-300 transition-colors duration-75 hover:border-green-300 focus:bg-transparent focus:border-green-400 focus:ring focus:ring-green-300 focus:ring-opacity-50' +
        (className ? ' ' + className : '')
      }
      ref={ref}
      {...delegated}
    />
  );

  if (!symbolPrefix && !symbolSuffix) return rawInput;
  return (
    <div className="relative">
      {symbolPrefix && (
        <span className="absolute pointer-events-none inset-y-0 left-0 pl-4 flex items-center text-gray-600 font-medium">
          {symbolPrefix}
        </span>
      )}
      {rawInput}
      {symbolSuffix && (
        <span className="absolute pointer-events-none inset-y-0 right-0 pr-4 flex items-center text-gray-600 font-medium">
          {symbolSuffix}
        </span>
      )}
    </div>
  );
}

export default forwardRef(TextInput);
