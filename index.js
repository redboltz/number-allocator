// Copyright Takatoshi Kondo 2021
//
// Distributed under the MIT License

var NumberAllocator = require('./lib/number-allocator.js')

module.exports.NumberAllocator = NumberAllocator
var na = new NumberAllocator(0, 0)
console.log(na)
