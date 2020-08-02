import 'd3-array';

declare module 'd3-array' {
  export function minIndex<T extends Numeric>(
    array: ArrayLike<T>
  ): T | undefined;
  export function minIndex<T, U extends Numeric>(
    array: Iterable<T>,
    accessor: (
      datum: T,
      index: number,
      array: Iterable<T>
    ) => U | undefined | null
  ): U | undefined;

  export function maxIndex<T extends Numeric>(
    array: ArrayLike<T>
  ): T | undefined;
  export function maxIndex<T, U extends Numeric>(
    array: Iterable<T>,
    accessor: (
      datum: T,
      index: number,
      array: Iterable<T>
    ) => U | undefined | null
  ): U | undefined;
}
