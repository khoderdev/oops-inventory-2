/**
 * Extended array type that includes the _sourceLength property
 * This is used for optimization in POSClient to track the source array length
 * without having to do deep comparison of arrays
 */
export interface ExtendedArray<T> extends Array<T> {
  _sourceLength?: number;
}

/**
 * Helper function to create an ExtendedArray from a regular array
 * and set the _sourceLength property
 */
export function createExtendedArray<T>(array: T[], sourceLength: number): ExtendedArray<T> {
  const extendedArray = array as ExtendedArray<T>;
  Object.defineProperty(extendedArray, '_sourceLength', {
    value: sourceLength,
    enumerable: false
  });
  return extendedArray;
}
