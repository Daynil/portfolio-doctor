import React, { forwardRef, LegacyRef } from 'react';

type Props = React.PropsWithRef<JSX.IntrinsicElements['input']>;

function RadioInput(
  { className, ...delegated }: Props,
  ref: LegacyRef<HTMLInputElement>
) {
  return (
    <input
      className={
        'text-green-500 focus:ring-green-400' +
        (className ? ' ' + className : '')
      }
      type="radio"
      ref={ref}
      {...delegated}
    />
  );
}

export default forwardRef(RadioInput);
