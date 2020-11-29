import React from 'react';

type Props = React.PropsWithRef<JSX.IntrinsicElements['button']>;

export default function Button({ className, children, ...delegated }: Props) {
  return (
    <button
      className={
        'py-2 px-4 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75' +
        (className ? ' ' + className : '')
      }
      {...delegated}
    >
      {children}
    </button>
  );
}
