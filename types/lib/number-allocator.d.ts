declare class NumberAllocator {
  /**
   * NumberAllocator constructor.
   * The all numbers are set to `vacant` status.
   * @param {Number} min  - The maximum number of allocatable. The number must be integer.
   * @param {Number} maxh - The minimum number of allocatable. The number must be integer.
   */
  constructor (min: Integer, max: Integer)

  /**
   * Get the first vacant number. The status of the number is not updated.
   * @return {Number} - The first vacant number. When alloc() is called then the same value will be allocated.
   */
  firstVacant (): Integer

  /**
   * Allocate the first vacant number. The number become `used` status.
   * If all numbers are used, then return null.
   * @return {Number} - If the number is successfully allocated, then return the allocated number,
   *                    otherwise return null.
   */
  alloc (): Integer

  /**
   * Use the number. The number become `used` status.
   * If the number has already been used, then return false.
   * @param {Number} num - The number to request use.
   * @return {Boolean} - If the number was not used, then return true, otherwise return false.
   */
  use (num: Integer): Boolean

  /**
   * Deallocate the number. The number become `vacant` status.
   * @param {Number} num - The number to deallocate. The number must be `used` status.
   *                       In other words, the number must be allocated by alloc() or used be use().
   */
  free (num: Integer): void

  /**
   * Clear all used numbers.
   * The all numbers are set to `vacant` status.
   */
  clear (): void

  /**
   * Get the number of intervals. Interval is internal structure of this library.
   * This function is for debugging.
   * @return {Number} - The number of intervals.
   */
  intervalCount (): Integer

  /**
   * Dump the internal structor of the library.
   * This function is for debugging.
   */
  dump (): void
}

export { NumberAllocator }
