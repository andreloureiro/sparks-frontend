/// <reference path="../../../typings/index.d.ts" />

import {
  mapObjIndexed, flatten, keys, always, reject, isNil, uniq, addIndex, merge as mergeR,
  reduce, all, either, map, values, equals, map as mapR, contains, identity
} from 'ramda'
import * as $ from 'most'
// import {isEmpty} from './most/isEmpty'

let IsEmptySink = function IsEmptySink(sink) {
  this.sink = sink
  this.isEmpty = true
}

IsEmptySink.prototype.event = function event(t, x) {
  this.isEmpty = false
  this.sink.event(t, false)
  this.sink.end(t, x)
}

IsEmptySink.prototype.error = function error(t, e) {
  this.sink.error(t, e)
}

IsEmptySink.prototype.end = function end(t, x) {
  if (this.isEmpty) {
    this.sink.event(t, true)
    this.sink.end(t, x)
  }
}

let IsEmpty = function IsEmpty(source) {
  this.source = source
}

IsEmpty.prototype.run = function run(sink, scheduler) {
  return (this as any).source.run(new IsEmptySink(sink), scheduler)
}

const isEmpty = stream =>
  new stream.constructor(new IsEmpty(stream.source))

const mapIndexed = addIndex(map)

// Type checking typings
/**
 * @typedef {String} ErrorMessage
 */
/**
 * @typedef {Array<ErrorMessage>} SignatureCheck
 */

/**
 * Throws an exception if the arguments parameter fails at least one
 * validation rule
 * Note that all arguments are mandatory, i.e. the function does not deal with
 * optional arguments
 * @param {String} fnName
 * @param {Array<*>} _arguments
 * @param {[Array<Object.<string, Predicate|PredicateWithError>>]} vRules
 * Validation rules.
 *
 * Given f(x, y) =  x + y, with x both int, in the body of `f`, include
 * function f(x, y) {
   *   assertSignature ('f', arguments, [{x:isInteger},{y:isInteger}],
   *                  'one of the parameters is not an integer!')
   *   ...
   * }
 * @returns {Boolean} can only returns true, otherwise throws
 * @throws
 */

interface PredicateWithOptError {
  <T>(arg: T): boolean|string;
}

interface VRule {
  [vRule: string]: PredicateWithOptError;
}

function assertSignature(fnName, _arguments, vRules: VRule[]) {
  const argNames = flatten(map(keys, vRules))
  const ruleFns = flatten(map(function (vRule) {
    return values(vRule)[0] as PredicateWithOptError
  }, vRules))

  const args = mapIndexed(function (vRule, index) {
    return _arguments[index]
  }, vRules)

  const validatedArgs = mapIndexed((value, index) => {
    const ruleFn = ruleFns[index]
    return ruleFn(value)
  }, args)

  const hasFailed = reduce((acc, value) => {
    return isFalse(value) || acc
  }, false, validatedArgs)

  if (hasFailed) {
    const validationMessages = mapIndexed((errorMessageOrBool, index) => {
        return isTrue(errorMessageOrBool) ?
          '' :
          [
            // `${fnName}: argument ${argNames[index]} fails rule
            // ${vRules[index].name}`, // cant find a way to do it typescript
            `${fnName}: argument ${argNames[index]} fails validation rule}`,
            isBoolean(errorMessageOrBool) ? '' : errorMessageOrBool
          ].join(': ')
      }, validatedArgs
    ).join('\n')

    const errorMessage = ['assertSignature:', validationMessages].join(' ')
    throw errorMessage
  }

  return !hasFailed
}

/**
 * Test against a predicate, and throws an exception if the predicate
 * is not satisfied
 * @param {function(*): (Boolean|String)} contractFn Predicate that must be
 * satisfy. Returns true if predicate is satisfied, otherwise return a
 * string to report about the predicate failure
 * @param {Array<*>} contractArgs
 * @param {String} errorMessage
 * @returns {Boolean}
 * @throws
 */
function assertContract(contractFn, contractArgs, errorMessage) {
  const boolOrError = contractFn.apply(null, contractArgs)
  const isPredicateSatisfied = isBoolean(boolOrError)

  if (!isPredicateSatisfied) {
    throw `assertContract: fails contract ${contractFn.name}\n${errorMessage}\n ${boolOrError}`
  }
  return true
}

/**
 * Returns:
 * - `true` if the object passed as parameter passes all the predicates on
 * its properties
 * - an array with the concatenated error messages otherwise
 * @param obj
 * @param {Object.<string, Predicate>} signature
 * @param {Object.<string, string>} signatureErrorMessages
 * @param {Boolean=false} isStrict When `true` signals that the object
 * should not have properties other than the ones checked for
 * @returns {Boolean | Array<String>}
 */
interface Signature {
  [predicate: string]: PredicateWithOptError;
}

function checkSignature(obj, signature: Signature, signatureErrorMessages, isStrict) {
  let arrMessages: any = []
  let strict = defaultsTo(isStrict, false)

  // Check that object properties in the signature match it
  mapObjIndexed((predicate, property) => {
    if (!((predicate as PredicateWithOptError)(obj[property]))) {
      arrMessages.push(signatureErrorMessages[property])
    }
  }, signature)

  // Check that object properties are all in the signature if strict is set
  if (strict) {
    mapObjIndexed((value, property) => {
      if (!(property in signature)) {
        arrMessages.push(`Object cannot contain a property called ${property}`)
      }
    }, obj)
  }

  return arrMessages.join("").length === 0 ? true : arrMessages
}

function hasExpectedSinks(sinks, expectedSinkNames) {
  const actualSinkNames = keys(sinks);
  const matching = mapR((sinkName => contains(sinkName, actualSinkNames)), expectedSinkNames);

  const assertionValue = all(identity, matching);
  return assertionValue;
}

function analyzeTestResults(assert, done) {
  return function analyzeTestResults(actual, expected, message) {
    assert.deepEqual(actual, expected, message)
    // TODO : find a library to display the diff between the two
    done();
  }
}

function plan(n, done) {
  return function _done() {
    if (--n === 0) {
      done()
    }
  }
}

/**
 * Returns an object whose keys :
 * - the first key found in `obj` for which the matching predicate was
 * fulfilled. Predicates are tested in order of indexing of the array.
 * - `_index` the index in the array where a predicate was fulfilled if
 * any, undefined otherwise
 * Ex : unfoldObjOverload('DOM', {sourceName: isString, predicate:
    * isPredicate})
 * Result : {sourceName : 'DOM'}
 * @param obj
 * @param {Array<Object.<string, Predicate>>} overloads
 * @returns {*}
 */
interface ObjOverloadResult {
  _index: number
}

function unfoldObjOverload(obj, overloads) {
  let result: ObjOverloadResult = {_index: 0}
  let index = 0

  overloads.some(overload => {
    // can only be one property
    const property = keys(overload)[0]
    const predicate = values(overload)[0] as PredicateWithOptError
    const predicateEval = predicate(obj)

    if (predicateEval) {
      result[property] = obj
      result._index = index
    }
    index++

    return predicateEval
  })
  return result
}

function defaultsTo(obj, defaultsTo) {
  return !obj ? defaultsTo : obj
}

/**
 * Returns true iff the parameter is a boolean whose value is false.
 * This hence does both type checking and value checking
 * @param obj
 * @returns {boolean}
 */
function isFalse(obj) {
  return isBoolean(obj) ? !obj : false
}

/**
 * Returns true iff the parameter is a boolean whose value is false.
 * This hence does both type checking and value checking
 * @param obj
 * @returns {boolean}
 */
function isTrue(obj) {
  return isBoolean(obj) ? obj : false
}

function isMergeSinkFn(obj) {
  return isFunction(obj)
}

/**
 * Returns true iff the passed parameter is null or undefined OR a POJO
 * @param {Object} obj
 * @returns {boolean}
 */
function isNullableObject(obj) {
  // Note that `==` is used instead of `===`
  // This allows to test for `undefined` and `null` at the same time
  return obj == null || typeof obj === 'object'
}

/**
 *
 * @param obj
 * @returns {SignatureCheck}
 */
function isNullableComponentDef(obj) {
  // Note that `==` is used instead of `===`
  // This allows to test for `undefined` and `null` at the same time

  return isNil(obj) || checkSignature(obj, {
      makeLocalSources: either(isNil, isFunction),
      makeLocalSettings: either(isNil, isFunction),
      makeOwnSinks: either(isNil, isFunction),
      mergeSinks: mergeSinks => {
        if (obj.computeSinks) {
          return !mergeSinks
        }
        else {
          return either(isNil, either(isObject, isFunction))(mergeSinks)
        }
      },
      computeSinks: either(isNil, isFunction),
      sinksContract: either(isNil, isFunction)
    }, {
      makeLocalSources: 'makeLocalSources must be undefined or a function',
      makeLocalSettings: 'makeLocalSettings must be undefined or a' +
      ' function',
      makeOwnSinks: 'makeOwnSinks must be undefined or a function',
      mergeSinks: 'mergeSinks can only be defined when `computeSinks` is' +
      ' not, and when so, it must be undefined, an object or a function',
      computeSinks: 'computeSinks must be undefined or a function',
      sinksContract: 'sinksContract must be undefined or a function'
    }, true)
}

function isUndefined(obj) {
  return typeof obj === 'undefined'
}

function isFunction(obj) {
  return typeof(obj) === 'function'
}

function isObject(obj) {
  return typeof(obj) == 'object'
}

function isBoolean(obj) {
  return typeof(obj) == 'boolean'
}

function isString(obj) {
  return typeof(obj) == 'string'
}

function isArray(obj) {
  return Array.isArray(obj)
}

/**
 * Returns a function which returns true if its parameter is an array,
 * and each element of the array satisfies a given predicate
 * @param {function(*):Boolean} predicateFn
 * @returns {function():Boolean}
 */
function isArrayOf(predicateFn) {
  if (typeof predicateFn !== 'function') {
    console.error('isArrayOf: predicateFn is not a function!!')
    return always(false)
  }

  return function _isArrayOf(obj) {
    if (!Array.isArray(obj)) {
      return false
    }

    return all(predicateFn, obj)
  }
}

function isVNode(obj) {
  return ["children", "data", "elm", "key", "sel", "text"]
    .every(prop => prop in obj)
}

/**
 * Returns true iff the parameter `obj` represents a component.
 * @param obj
 * @returns {boolean}
 */
function isComponent(obj) {
  // Without a type system, we just test that it is a function
  return isFunction(obj)
}

function isObservable(obj) {
  // duck typing in the absence of a type system
  return isFunction(obj.subscribe)
}

function isSource(obj) {
  return isObservable(obj)
}

function isSources(obj) {
  // We check the minimal contract which is not to be nil
  // In `cycle`, sources can have both regular
  // objects and observables (sign that the design could be improved).
  // Regular objects are injected dependencies (DOM, router?) which
  // are initialized in the drivers, and should be separated from
  // `sources`. `sources` could then have an homogeneous type which
  // could be checked properly
  return !isNil(obj)
}

function isSink(obj) {
  return isObservable(obj)
}

function isOptSinks(obj) {
  // obj can be null
  return !obj || all(either(isNil, isObservable), values(obj))
}

function isArrayOptSinks(arrSinks) {
  return all(isOptSinks, arrSinks)
}

function assertSourcesContracts(sources, sourcesContract) {
  // Check sources contracts
  assertContract(isSources, [sources],
    'm : `sources` parameter is invalid')
  assertContract(sourcesContract, [sources], 'm: `sources`' +
    ' parameter fails contract ' + sourcesContract.name)
}

function assertSinksContracts(sinks, sinksContract) {
  assertContract(isOptSinks, [sinks],
    'mergeSinks must return a hash of observable sink')
  assertContract(sinksContract, [sinks],
    'fails custom contract ' + sinksContract.name)
}

function assertSettingsContracts(mergedSettings, settingsContract) {
  // Check settings contracts
  assertContract(settingsContract, [mergedSettings], 'm: `settings`' +
    ' parameter fails contract ' + settingsContract.name)
}

/**
 * Adds `tap` logging/tracing information to all sinks
 * @param {Sinks} sinks
 * @param {Settings} settings Settings with which the parent component is
 * called
 * @returns {*}
 */
function trace(sinks, settings) {
  // TODO BRC
  return sinks
}

function removeNullsFromArray(arr) {
  return reject(isNil, arr)
}

function removeEmptyVNodes(arrVNode) {
  return reduce((accNonEmptyVNodes, vNode) => {
    return (isNullVNode(vNode)) ?
      accNonEmptyVNodes :
      (accNonEmptyVNodes.push(vNode), accNonEmptyVNodes)
  }, [] as any, arrVNode)
}

function isNullVNode(vNode) {
  return equals(vNode.children, []) &&
    equals(vNode.data, {}) &&
    isUndefined(vNode.elm) &&
    isUndefined(vNode.key) &&
    isUndefined(vNode.sel) &&
    isUndefined(vNode.text)
}

/**
 * For each element object of the array, returns the indicated property of
 * that object, if it exists, null otherwise.
 * For instance, `projectSinksOn('a', obj)` with obj :
 * - [{a: ..., b: ...}, {b:...}]
 * - result : [..., null]
 * @param {String} prop
 * @param {Array<*>} obj
 * @returns {Array<*>}
 */
function projectSinksOn(prop, obj) {
  return map(x => x ? x[prop] : null, obj)
}

/**
 * Returns an array with the set of sink names extracted from an array of
 * sinks. The ordering of those names should not be relied on.
 * For instance:
 * - [{DOM, auth},{DOM, route}]
 * results in ['DOM','auth','route']
 * @param {Array<Sinks>} aSinks
 * @returns {Array<String>}
 */
function getSinkNamesFromSinksArray(aSinks) {
  return uniq(flatten(map(getValidKeys, aSinks)))
}

function getValidKeys(obj) {
  let validKeys: any = []
  mapObjIndexed((value, key) => {
    if (value != null) {
      validKeys.push(key)
    }
  }, obj)

  return validKeys
}

/**
 * Turns a sink which is empty into a sink which emits `Null`
 * This is necessary for use in combination with `combineLatest`
 * As a matter of fact, `combineLatest(obs1, obs2)` will block till both
 * observables emit at least one value. So if `obs2` is empty, it will
 * never emit anything
 * @param sink
 * @returns {Observable|*}
 */
function emitNullIfEmpty(sink) {
  return isNil(sink) ?
    null :
    $.merge(
      sink,
      // TODO TYS : recreate Rx.Obs.isEmpty in most
      // https://github.com/Reactive-Extensions/RxJS/blob/master/src/core/linq/observable/isempty.js
      // https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/isempty.md
      // see also tests
      // https://github.com/Reactive-Extensions/RxJS/blob/master/tests/observable/isempty.js
      isEmpty(sink).filter(x=>x).map(x => null)
//      sink.isEmpty().filter(x=>x).map(x => null)
    )
}

function makeDivVNode(x) {
  return {
    "children": undefined,
    "data": {},
    "elm": undefined,
    "key": undefined,
    "sel": "div",
    "text": x
  }
}

function decorateWithPreventDefault(stubbedEvent, preventDefaultFn?) {
  return mergeR({
      preventDefault: preventDefaultFn || always(undefined)
    },
    stubbedEvent);
}

function stubClickEvent(targetValue){
  return {
    type : 'click',
    target : {
      value : targetValue
    }
  }
}

function stubSubmitEvent(){
  return {
    type : 'submit',
  }
}

function stubInputEvent(targetValue){
  return {
    type : 'input',
    target : {
      value : targetValue
    }
  }
}

export {
  makeDivVNode,
  assertSignature,
  assertContract,
  assertSourcesContracts,
  assertSinksContracts,
  assertSettingsContracts,
  checkSignature,
  hasExpectedSinks,
  analyzeTestResults,
  plan,
  unfoldObjOverload,
  projectSinksOn,
  getSinkNamesFromSinksArray,
  removeNullsFromArray,
  removeEmptyVNodes,
  defaultsTo,
  isArrayOptSinks,
  isNullableObject,
  isNullableComponentDef,
  isUndefined,
  isFunction,
  isComponent,
  isVNode,
  isObject,
  isBoolean,
  isString,
  isArray,
  isArrayOf,
  isObservable,
  isSource,
  isSink,
  isOptSinks,
  isMergeSinkFn,
  trace,
  emitNullIfEmpty,
  decorateWithPreventDefault,
  stubClickEvent,
  stubSubmitEvent,
  stubInputEvent
}