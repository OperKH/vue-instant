export const isPromise = function (obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
}

export const isArray = function (obj) {
  return Array.isArray ? Array.isArray(obj) : obj instanceof Array
}

export const isFunction = function (val) {
  return typeof val === 'function'
}
