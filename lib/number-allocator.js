// Copyright Takatoshi Kondo 2021
//
// Distributed under the MIT License

'use strict'

const SortedSet = require('js-sdsl').OrderedSet
const debugTrace = require('debug')('number-allocator:trace')
const debugError = require('debug')('number-allocator:error')
/**
 * Interval constructor
 * @constructor
 * @param {Number} low  - The lowest value of the interval
 * @param {Number} high - The highest value of the interval
 */
function Interval (low, high) {
  this.low = low
  this.high = high
}

Interval.prototype.equals = function (other) {
  return this.low === other.low && this.high === other.high
}

Interval.prototype.compare = function (other) {
  if (this.low < other.low && this.high < other.low) return -1
  if (other.low < this.low && other.high < this.low) return 1
  return 0
}

/**
 * NumberAllocator constructor.
 * The all numbers are set to vacant status.
 * Time Complexity O(1)
 * @constructor
 * @param {Number} min  - The maximum number of allocatable. The number must be integer.
 * @param {Number} maxh - The minimum number of allocatable. The number must be integer.
 */
function NumberAllocator (min, max) {
  if (!(this instanceof NumberAllocator)) {
    return new NumberAllocator(min, max)
  }

  this.min = min
  this.max = max

  this.ss = new SortedSet(
    [],
    (lhs, rhs) => {
      return lhs.compare(rhs)
    }
  )
  debugTrace('Create')
  this.clear()
}

/**
 * Get the first vacant number. The status of the number is not updated.
 * Time Complexity O(1)
 * @return {Number} - The first vacant number. If all numbers are occupied, return null.
 *                    When alloc() is called then the same value will be allocated.
 */
NumberAllocator.prototype.firstVacant = function () {
  if (this.ss.size() === 0) return null
  return this.ss.front().low
}

/**
 * Allocate the first vacant number. The number become occupied status.
 * Time Complexity O(1)
 * @return {Number} - The first vacant number. If all numbers are occupied, return null.
 */
NumberAllocator.prototype.alloc = function () {
  if (this.ss.size() === 0) {
    debugTrace('alloc():empty')
    return null
  }
  const fval = this.ss.front()
  const num = fval.low
  if (num + 1 <= fval.high) {
    // Overwrite the interval in the ss but it is safe,
    // because no order violation is happened.
    // x|----|
    ++fval.low
  } else {
    this.ss.eraseElementByPos(0)
  }
  debugTrace('alloc():' + num)
  return num
}

/**
 * Use the number. The number become occupied status.
 * If the number has already been occupied, then return false.
 * Time Complexity O(logN) : N is the number of intervals (not numbers)
 * @param {Number} num - The number to request use.
 * @return {Boolean} - If `num` was not occupied, then return true, otherwise return false.
 */
NumberAllocator.prototype.use = function (num) {
  const key = new Interval(num, num)
  const it = this.ss.lowerBound(key)
  if (!it.equals(this.ss.end())) {
    if (it.pointer.equals(key)) {
      // |x|
      this.ss.eraseElementByIterator(it)
      debugTrace('use():' + num)
      return true
    }

    // x |-----|
    if (it.pointer.low > num) return false

    // |x----|
    if (it.pointer.low === num) {
      // Overwrite the interval in the ss but it is safe,
      // because no order violation is happened.
      // x|----|
      ++it.pointer.low
      debugTrace('use():' + num)
      return true
    }

    // |----x|
    if (it.pointer.high === num) {
      // Overwrite the interval in the ss but it is safe,
      // because no order violation is happened.
      // |----|x
      --it.pointer.high
      debugTrace('use():' + num)
      return true
    }

    const low = it.pointer.low

    // |--x--|
    // Overwrite the interval in the ss but it is safe,
    // because no order violation is happened.
    // x|--|
    it.pointer.low = num + 1

    // |--|x|--|
    this.ss.insert(new Interval(low, num - 1))
    debugTrace('use():' + num)
    return true
  }

  debugTrace('use():failed')
  return false
}

/**
 * Deallocate the number. The number become vacant status.
 * Time Complexity O(logN) : N is the number of intervals (not numbers)
 * @param {Number} num - The number to deallocate. The number must be occupied status.
 *                       In other words, the number must be allocated by alloc() or occupied be use().
 */
NumberAllocator.prototype.free = function (num) {
  if (num < this.min || num > this.max) {
    debugError('free():' + num + ' is out of range')
    return
  }
  const key = new Interval(num, num)
  const it = this.ss.upperBound(key)
  if (it.equals(this.ss.end())) {
    // ....v
    if (it.equals(this.ss.begin())) {
      // Insert new interval
      this.ss.insert(key)
      return
    }
    it.pre()
    if (it.pointer.high + 1 === num) {
      // Concat to left
      // Overwrite the interval in the ss but it is safe,
      // because no order violation is happened.
      it.pointer.high = num
    } else {
      // Insert new interval
      this.ss.insert(key)
    }
  } else {
    if (it.equals(this.ss.begin())) {
      // v....
      if (num + 1 === it.pointer.low) {
        // Concat to right
        // Overwrite the interval in the ss but it is safe,
        // because no order violation is happened.
        --it.pointer.low
      } else {
        // Insert new interval
        this.ss.insert(key)
      }
    } else {
      // ..v..
      const rLow = it.pointer.low
      it.pre()
      const lHigh = it.pointer.high
      const lLow = it.pointer.low
      if (lHigh + 1 === num) {
        if (num + 1 === rLow) {
          // Concat to left and right
          this.ss.eraseElementByIterator(it)
          // Overwrite the interval in the ss but it is safe,
          // because no order violation is happened.
          it.pointer.low = lLow
        } else {
          // Concat to left
          // Overwrite the interval in the ss but it is safe,
          // because no order violation is happened.
          it.pointer.high = num
        }
      } else {
        if (num + 1 === rLow) {
          // Concat to right
          // Overwrite the interval in the ss but it is safe,
          // because no order violation is happened.
          it.next().pointer.low = num
        } else {
          // Insert new interval
          this.ss.insert(key)
        }
      }
    }
  }
  debugTrace('free():' + num)
}

/**
 * Clear all occupied numbers.
 * The all numbers are set to vacant status.
 * Time Complexity O(1)
 */
NumberAllocator.prototype.clear = function () {
  debugTrace('clear()')
  this.ss.clear()
  this.ss.insert(new Interval(this.min, this.max))
}

/**
 * Get the number of intervals. Interval is internal structure of this library.
 * This function is for debugging.
 * Time Complexity O(1)
 * @return {Number} - The number of intervals.
 */
NumberAllocator.prototype.intervalCount = function () {
  return this.ss.size()
}

/**
 * Dump the internal structor of the library.
 * This function is for debugging.
 * Time Complexity O(N) : N is the number of intervals (not numbers)
 */
NumberAllocator.prototype.dump = function () {
  console.log('length:' + this.ss.size())
  for (const element of this.ss) {
    console.log(element)
  }
}

module.exports = NumberAllocator
