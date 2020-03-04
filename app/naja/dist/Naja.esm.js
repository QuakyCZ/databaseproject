/*
 * Naja.js
 * 1.6.0
 *
 * by Jiří Pudil <https://jiripudil.cz>
 */
function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var runtime = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

!(function(global) {

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = module.exports;

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };
})(
  // In sloppy mode, unbound `this` refers to the global object, fallback to
  // Function constructor if we're in global strict mode. That is sadly a form
  // of indirect eval which violates Content Security Policy.
  (function() {
    return this || (typeof self === "object" && self);
  })() || Function("return this")()
);
});

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
var g = (function() {
  return this || (typeof self === "object" && self);
})() || Function("return this")();

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime &&
  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

var runtimeModule = runtime;

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch(e) {
    g.regeneratorRuntime = undefined;
  }
}

var regenerator = runtimeModule;

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

var _global = createCommonjsModule(function (module) {
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
});

var _isObject = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

var _anObject = function (it) {
  if (!_isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

var _aFunction = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

// optional / simple context binding

var _ctx = function (fn, that, length) {
  _aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

var f = {}.propertyIsEnumerable;

var _objectPie = {
	f: f
};

var _propertyDesc = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var toString = {}.toString;

var _cof = function (it) {
  return toString.call(it).slice(8, -1);
};

// fallback for non-array-like ES3 and non-enumerable old V8 strings

// eslint-disable-next-line no-prototype-builtins
var _iobject = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return _cof(it) == 'String' ? it.split('') : Object(it);
};

// 7.2.1 RequireObjectCoercible(argument)
var _defined = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

// to indexed object, toObject with fallback for non-array-like ES3 strings


var _toIobject = function (it) {
  return _iobject(_defined(it));
};

// 7.1.1 ToPrimitive(input [, PreferredType])

// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var _toPrimitive = function (it, S) {
  if (!_isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !_isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

var hasOwnProperty = {}.hasOwnProperty;
var _has = function (it, key) {
  return hasOwnProperty.call(it, key);
};

var _fails = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

// Thank's IE8 for his funny defineProperty
var _descriptors = !_fails(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

var document$1 = _global.document;
// typeof document.createElement is 'object' in old IE
var is = _isObject(document$1) && _isObject(document$1.createElement);
var _domCreate = function (it) {
  return is ? document$1.createElement(it) : {};
};

var _ie8DomDefine = !_descriptors && !_fails(function () {
  return Object.defineProperty(_domCreate('div'), 'a', { get: function () { return 7; } }).a != 7;
});

var gOPD = Object.getOwnPropertyDescriptor;

var f$1 = _descriptors ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = _toIobject(O);
  P = _toPrimitive(P, true);
  if (_ie8DomDefine) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (_has(O, P)) return _propertyDesc(!_objectPie.f.call(O, P), O[P]);
};

var _objectGopd = {
	f: f$1
};

// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */


var check = function (O, proto) {
  _anObject(O);
  if (!_isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
var _setProto = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = _ctx(Function.call, _objectGopd.f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) { buggy = true; }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};

var setPrototypeOf = _setProto.set;
var _inheritIfRequired = function (that, target, C) {
  var S = target.constructor;
  var P;
  if (S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && _isObject(P) && setPrototypeOf) {
    setPrototypeOf(that, P);
  } return that;
};

var dP = Object.defineProperty;

var f$2 = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  _anObject(O);
  P = _toPrimitive(P, true);
  _anObject(Attributes);
  if (_ie8DomDefine) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

var _objectDp = {
	f: f$2
};

// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
var _toInteger = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

// 7.1.15 ToLength

var min = Math.min;
var _toLength = function (it) {
  return it > 0 ? min(_toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

var max = Math.max;
var min$1 = Math.min;
var _toAbsoluteIndex = function (index, length) {
  index = _toInteger(index);
  return index < 0 ? max(index + length, 0) : min$1(index, length);
};

// false -> Array#indexOf
// true  -> Array#includes



var _arrayIncludes = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = _toIobject($this);
    var length = _toLength(O.length);
    var index = _toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var SHARED = '__core-js_shared__';
var store = _global[SHARED] || (_global[SHARED] = {});
var _shared = function (key) {
  return store[key] || (store[key] = {});
};

var id = 0;
var px = Math.random();
var _uid = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

var shared = _shared('keys');

var _sharedKey = function (key) {
  return shared[key] || (shared[key] = _uid(key));
};

var arrayIndexOf = _arrayIncludes(false);
var IE_PROTO = _sharedKey('IE_PROTO');

var _objectKeysInternal = function (object, names) {
  var O = _toIobject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) _has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (_has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

// IE 8- don't enum bug keys
var _enumBugKeys = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)

var hiddenKeys = _enumBugKeys.concat('length', 'prototype');

var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return _objectKeysInternal(O, hiddenKeys);
};

var _objectGopn = {
	f: f$3
};

var _wks = createCommonjsModule(function (module) {
var store = _shared('wks');

var Symbol = _global.Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : _uid)('Symbol.' + name));
};

$exports.store = store;
});

// 7.2.8 IsRegExp(argument)


var MATCH = _wks('match');
var _isRegexp = function (it) {
  var isRegExp;
  return _isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : _cof(it) == 'RegExp');
};

// 21.2.5.3 get RegExp.prototype.flags

var _flags = function () {
  var that = _anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};

var _hide = _descriptors ? function (object, key, value) {
  return _objectDp.f(object, key, _propertyDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

var _core = createCommonjsModule(function (module) {
var core = module.exports = { version: '2.5.1' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
});
var _core_1 = _core.version;

var _redefine = createCommonjsModule(function (module) {
var SRC = _uid('src');
var TO_STRING = 'toString';
var $toString = Function[TO_STRING];
var TPL = ('' + $toString).split(TO_STRING);

_core.inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) _has(val, 'name') || _hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) _has(val, SRC) || _hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === _global) {
    O[key] = val;
  } else if (!safe) {
    delete O[key];
    _hide(O, key, val);
  } else if (O[key]) {
    O[key] = val;
  } else {
    _hide(O, key, val);
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});
});

var SPECIES = _wks('species');

var _setSpecies = function (KEY) {
  var C = _global[KEY];
  if (_descriptors && C && !C[SPECIES]) _objectDp.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};

var dP$1 = _objectDp.f;
var gOPN = _objectGopn.f;


var $RegExp = _global.RegExp;
var Base = $RegExp;
var proto = $RegExp.prototype;
var re1 = /a/g;
var re2 = /a/g;
// "new" creates a new object, old webkit buggy here
var CORRECT_NEW = new $RegExp(re1) !== re1;

if (_descriptors && (!CORRECT_NEW || _fails(function () {
  re2[_wks('match')] = false;
  // RegExp constructor can alter flags and IsRegExp works correct with @@match
  return $RegExp(re1) != re1 || $RegExp(re2) == re2 || $RegExp(re1, 'i') != '/a/i';
}))) {
  $RegExp = function RegExp(p, f) {
    var tiRE = this instanceof $RegExp;
    var piRE = _isRegexp(p);
    var fiU = f === undefined;
    return !tiRE && piRE && p.constructor === $RegExp && fiU ? p
      : _inheritIfRequired(CORRECT_NEW
        ? new Base(piRE && !fiU ? p.source : p, f)
        : Base((piRE = p instanceof $RegExp) ? p.source : p, piRE && fiU ? _flags.call(p) : f)
      , tiRE ? this : proto, $RegExp);
  };
  var proxy = function (key) {
    key in $RegExp || dP$1($RegExp, key, {
      configurable: true,
      get: function () { return Base[key]; },
      set: function (it) { Base[key] = it; }
    });
  };
  for (var keys = gOPN(Base), i = 0; keys.length > i;) proxy(keys[i++]);
  proto.constructor = $RegExp;
  $RegExp.prototype = proto;
  _redefine(_global, 'RegExp', $RegExp);
}

_setSpecies('RegExp');

var _fixReWks = function (KEY, length, exec) {
  var SYMBOL = _wks(KEY);
  var fns = exec(_defined, SYMBOL, ''[KEY]);
  var strfn = fns[0];
  var rxfn = fns[1];
  if (_fails(function () {
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) != 7;
  })) {
    _redefine(String.prototype, KEY, strfn);
    _hide(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function (string, arg) { return rxfn.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function (string) { return rxfn.call(string, this); }
    );
  }
};

// @@search logic
_fixReWks('search', 1, function (defined, SEARCH, $search) {
  // 21.1.3.15 String.prototype.search(regexp)
  return [function search(regexp) {
    var O = defined(this);
    var fn = regexp == undefined ? undefined : regexp[SEARCH];
    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[SEARCH](String(O));
  }, $search];
});

var matchesMethodName = 'matches' in Element.prototype ? 'matches' : 'msMatchesSelector';

var UIHandler =
/*#__PURE__*/
function () {
  function UIHandler(naja) {
    _classCallCheck(this, UIHandler);

    _defineProperty(this, "selector", '.ajax');

    _defineProperty(this, "allowedOrigins", []);

    _defineProperty(this, "handler", void 0);

    this.naja = naja;
    this.handler = this.handleUI.bind(this);
    naja.addEventListener('init', this.initialize.bind(this)); // window.location.origin is not supported in IE 10

    var origin = "".concat(window.location.protocol, "//").concat(window.location.hostname).concat(window.location.port ? ":".concat(window.location.port) : '');
    this.allowedOrigins.push(origin);
  }

  _createClass(UIHandler, [{
    key: "initialize",
    value: function initialize() {
      var _this = this;

      this.bindUI(window.document.body);
      this.naja.snippetHandler.addEventListener('afterUpdate', function (event) {
        var snippet = event.detail.snippet;

        _this.bindUI(snippet);
      });
    }
  }, {
    key: "bindUI",
    value: function bindUI(element) {
      var _this2 = this;

      var selectors = ["a".concat(this.selector), "input[type=\"submit\"]".concat(this.selector), "input[type=\"image\"]".concat(this.selector), "button[type=\"submit\"]".concat(this.selector), "form".concat(this.selector, " input[type=\"submit\"]"), "form".concat(this.selector, " input[type=\"image\"]"), "form".concat(this.selector, " button[type=\"submit\"]")].join(', ');

      var bindElement = function bindElement(element) {
        element.removeEventListener('click', _this2.handler);
        element.addEventListener('click', _this2.handler);
      };

      var elements = element.querySelectorAll(selectors);

      for (var i = 0; i < elements.length; i++) {
        bindElement(elements.item(i));
      }

      if (element[matchesMethodName](selectors)) {
        bindElement(element);
      }

      var bindForm = function bindForm(form) {
        form.removeEventListener('submit', _this2.handler);
        form.addEventListener('submit', _this2.handler);
      };

      if (element[matchesMethodName]("form".concat(this.selector))) {
        bindForm(element);
      }

      var forms = element.querySelectorAll("form".concat(this.selector));

      for (var _i = 0; _i < forms.length; _i++) {
        bindForm(forms.item(_i));
      }
    }
  }, {
    key: "handleUI",
    value: function handleUI(evt) {
      if (evt.altKey || evt.ctrlKey || evt.shiftKey || evt.metaKey || evt.button) {
        return;
      }

      var el = evt.currentTarget,
          options = {};

      if (evt.type === 'submit') {
        this.submitForm(el, options, evt);
      } else if (evt.type === 'click') {
        this.clickElement(el, options, evt);
      }
    }
  }, {
    key: "clickElement",
    value: function clickElement(el) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var evt = arguments.length > 2 ? arguments[2] : undefined;
      var method, url, data;

      if (!this.naja.fireEvent('interaction', {
        element: el,
        originalEvent: evt,
        options: options
      })) {
        if (evt) {
          evt.preventDefault();
        }

        return;
      }

      if (el.tagName.toLowerCase() === 'a') {
        method = 'GET';
        url = el.href;
        data = null;
      } else if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'button') {
        var form = el.form;
        method = form.method ? form.method.toUpperCase() : 'GET';
        url = form.action || window.location.pathname + window.location.search;
        data = new FormData(form);

        if (el.type === 'submit' || el.tagName.toLowerCase() === 'button') {
          data.append(el.name, el.value || '');
        } else if (el.type === 'image') {
          var coords = el.getBoundingClientRect();
          data.append("".concat(el.name, ".x"), Math.max(0, Math.floor(evt.pageX - coords.left)));
          data.append("".concat(el.name, ".y"), Math.max(0, Math.floor(evt.pageY - coords.top)));
        }
      }

      if (this.isUrlAllowed(url)) {
        if (evt) {
          evt.preventDefault();
        }

        this.naja.makeRequest(method, url, data, options);
      }
    }
  }, {
    key: "submitForm",
    value: function submitForm(form) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var evt = arguments.length > 2 ? arguments[2] : undefined;

      if (!this.naja.fireEvent('interaction', {
        element: form,
        originalEvent: evt,
        options: options
      })) {
        if (evt) {
          evt.preventDefault();
        }

        return;
      }

      var method = form.method ? form.method.toUpperCase() : 'GET';
      var url = form.action || window.location.pathname + window.location.search;
      var data = new FormData(form);

      if (this.isUrlAllowed(url)) {
        if (evt) {
          evt.preventDefault();
        }

        this.naja.makeRequest(method, url, data, options);
      }
    }
  }, {
    key: "isUrlAllowed",
    value: function isUrlAllowed(url) {
      // ignore non-URL URIs (javascript:, data:, ...)
      if (/^(?!https?)[^:/?#]+:/i.test(url)) {
        return false;
      }

      return !/^https?/i.test(url) || this.allowedOrigins.some(function (origin) {
        return new RegExp("^".concat(origin), 'i').test(url);
      });
    }
  }]);

  return UIHandler;
}();

var FormsHandler =
/*#__PURE__*/
function () {
  function FormsHandler(naja) {
    _classCallCheck(this, FormsHandler);

    _defineProperty(this, "netteForms", void 0);

    this.naja = naja;
    naja.addEventListener('init', this.initialize.bind(this));
    naja.addEventListener('interaction', this.processForm.bind(this));
  }

  _createClass(FormsHandler, [{
    key: "initialize",
    value: function initialize() {
      var _this = this;

      this.initForms(window.document.body);
      this.naja.snippetHandler.addEventListener('afterUpdate', function (event) {
        var snippet = event.detail.snippet;

        _this.initForms(snippet);
      });
    }
  }, {
    key: "initForms",
    value: function initForms(element) {
      var netteForms = this.netteForms || window.Nette;

      if (netteForms) {
        if (element.tagName === 'form') {
          netteForms.initForm(element);
        }

        var forms = element.querySelectorAll('form');

        for (var i = 0; i < forms.length; i++) {
          netteForms.initForm(forms.item(i));
        }
      }
    }
  }, {
    key: "processForm",
    value: function processForm(event) {
      var _event$detail = event.detail,
          element = _event$detail.element,
          originalEvent = _event$detail.originalEvent;

      if (element.form) {
        element.form['nette-submittedBy'] = element;
      }

      var netteForms = this.netteForms || window.Nette;

      if ((element.tagName === 'form' || element.form) && netteForms && !netteForms.validateForm(element)) {
        if (originalEvent) {
          originalEvent.stopImmediatePropagation();
          originalEvent.preventDefault();
        }

        event.preventDefault();
      }
    }
  }]);

  return FormsHandler;
}();

var RedirectHandler =
/*#__PURE__*/
function () {
  function RedirectHandler(naja) {
    var _this = this;

    _classCallCheck(this, RedirectHandler);

    this.naja = naja;
    naja.addEventListener('success', function (event) {
      var _event$detail = event.detail,
          payload = _event$detail.payload,
          options = _event$detail.options;

      if (payload.redirect) {
        _this.makeRedirect(payload.redirect, payload.forceRedirect || options.forceRedirect);

        event.stopImmediatePropagation();
      }
    });
    this.locationAdapter = {
      assign: function assign(url) {
        return window.location.assign(url);
      }
    };
  }

  _createClass(RedirectHandler, [{
    key: "makeRedirect",
    value: function makeRedirect(url, force) {
      // window.location.origin is not supported in IE 10
      var origin = "".concat(window.location.protocol, "//").concat(window.location.hostname).concat(window.location.port ? ":".concat(window.location.port) : '');
      var externalRedirect = /^https?/i.test(url) && !new RegExp("^".concat(origin), 'i').test(url);

      if (force || externalRedirect) {
        this.locationAdapter.assign(url);
      } else {
        this.naja.makeRequest('GET', url);
      }
    }
  }]);

  return RedirectHandler;
}();

// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = _wks('unscopables');
var ArrayProto = Array.prototype;
if (ArrayProto[UNSCOPABLES] == undefined) _hide(ArrayProto, UNSCOPABLES, {});
var _addToUnscopables = function (key) {
  ArrayProto[UNSCOPABLES][key] = true;
};

var _iterStep = function (done, value) {
  return { value: value, done: !!done };
};

var _iterators = {};

var _library = false;

var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? _global : IS_STATIC ? _global[name] || (_global[name] = {}) : (_global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? _core : _core[name] || (_core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? _ctx(out, _global) : IS_PROTO && typeof out == 'function' ? _ctx(Function.call, out) : out;
    // extend global
    if (target) _redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) _hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
_global.core = _core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
var _export = $export;

// 19.1.2.14 / 15.2.3.14 Object.keys(O)



var _objectKeys = Object.keys || function keys(O) {
  return _objectKeysInternal(O, _enumBugKeys);
};

var _objectDps = _descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
  _anObject(O);
  var keys = _objectKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) _objectDp.f(O, P = keys[i++], Properties[P]);
  return O;
};

var document$2 = _global.document;
var _html = document$2 && document$2.documentElement;

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])



var IE_PROTO$1 = _sharedKey('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE$1 = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = _domCreate('iframe');
  var i = _enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  _html.appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE$1][_enumBugKeys[i]];
  return createDict();
};

var _objectCreate = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE$1] = _anObject(O);
    result = new Empty();
    Empty[PROTOTYPE$1] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO$1] = O;
  } else result = createDict();
  return Properties === undefined ? result : _objectDps(result, Properties);
};

var def = _objectDp.f;

var TAG = _wks('toStringTag');

var _setToStringTag = function (it, tag, stat) {
  if (it && !_has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
_hide(IteratorPrototype, _wks('iterator'), function () { return this; });

var _iterCreate = function (Constructor, NAME, next) {
  Constructor.prototype = _objectCreate(IteratorPrototype, { next: _propertyDesc(1, next) });
  _setToStringTag(Constructor, NAME + ' Iterator');
};

// 7.1.13 ToObject(argument)

var _toObject = function (it) {
  return Object(_defined(it));
};

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)


var IE_PROTO$2 = _sharedKey('IE_PROTO');
var ObjectProto = Object.prototype;

var _objectGpo = Object.getPrototypeOf || function (O) {
  O = _toObject(O);
  if (_has(O, IE_PROTO$2)) return O[IE_PROTO$2];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

var ITERATOR = _wks('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

var _iterDefine = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  _iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = _objectGpo($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      _setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!_library && !_has(IteratorPrototype, ITERATOR)) _hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!_library || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    _hide(proto, ITERATOR, $default);
  }
  // Plug for library
  _iterators[NAME] = $default;
  _iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) _redefine(proto, key, methods[key]);
    } else _export(_export.P + _export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
var es6_array_iterator = _iterDefine(Array, 'Array', function (iterated, kind) {
  this._t = _toIobject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return _iterStep(1);
  }
  if (kind == 'keys') return _iterStep(0, index);
  if (kind == 'values') return _iterStep(0, O[index]);
  return _iterStep(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
_iterators.Arguments = _iterators.Array;

_addToUnscopables('keys');
_addToUnscopables('values');
_addToUnscopables('entries');

// most Object methods by ES6 should accept primitives



var _objectSap = function (KEY, exec) {
  var fn = (_core.Object || {})[KEY] || Object[KEY];
  var exp = {};
  exp[KEY] = exec(fn);
  _export(_export.S + _export.F * _fails(function () { fn(1); }), 'Object', exp);
};

// 19.1.2.14 Object.keys(O)



_objectSap('keys', function () {
  return function keys(it) {
    return _objectKeys(_toObject(it));
  };
});

var ITERATOR$1 = _wks('iterator');
var TO_STRING_TAG = _wks('toStringTag');
var ArrayValues = _iterators.Array;

var DOMIterables = {
  CSSRuleList: true, // TODO: Not spec compliant, should be false.
  CSSStyleDeclaration: false,
  CSSValueList: false,
  ClientRectList: false,
  DOMRectList: false,
  DOMStringList: false,
  DOMTokenList: true,
  DataTransferItemList: false,
  FileList: false,
  HTMLAllCollection: false,
  HTMLCollection: false,
  HTMLFormElement: false,
  HTMLSelectElement: false,
  MediaList: true, // TODO: Not spec compliant, should be false.
  MimeTypeArray: false,
  NamedNodeMap: false,
  NodeList: true,
  PaintRequestList: false,
  Plugin: false,
  PluginArray: false,
  SVGLengthList: false,
  SVGNumberList: false,
  SVGPathSegList: false,
  SVGPointList: false,
  SVGStringList: false,
  SVGTransformList: false,
  SourceBufferList: false,
  StyleSheetList: true, // TODO: Not spec compliant, should be false.
  TextTrackCueList: false,
  TextTrackList: false,
  TouchList: false
};

for (var collections = _objectKeys(DOMIterables), i$1 = 0; i$1 < collections.length; i$1++) {
  var NAME = collections[i$1];
  var explicit = DOMIterables[NAME];
  var Collection = _global[NAME];
  var proto$1 = Collection && Collection.prototype;
  var key;
  if (proto$1) {
    if (!proto$1[ITERATOR$1]) _hide(proto$1, ITERATOR$1, ArrayValues);
    if (!proto$1[TO_STRING_TAG]) _hide(proto$1, TO_STRING_TAG, NAME);
    _iterators[NAME] = ArrayValues;
    if (explicit) for (key in es6_array_iterator) if (!proto$1[key]) _redefine(proto$1, key, es6_array_iterator[key], true);
  }
}

var SnippetHandler =
/*#__PURE__*/
function (_EventTarget) {
  _inherits(SnippetHandler, _EventTarget);

  function SnippetHandler(naja) {
    var _this;

    _classCallCheck(this, SnippetHandler);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SnippetHandler).call(this));
    naja.addEventListener('success', function (event) {
      var payload = event.detail.payload;

      if (payload.snippets) {
        _this.updateSnippets(payload.snippets);
      }
    });
    return _this;
  }

  _createClass(SnippetHandler, [{
    key: "updateSnippets",
    value: function updateSnippets(snippets) {
      var _this2 = this;

      var forceReplace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      Object.keys(snippets).forEach(function (id) {
        var el = document.getElementById(id);

        if (el) {
          _this2.updateSnippet(el, snippets[id], forceReplace);
        }
      });
    }
  }, {
    key: "updateSnippet",
    value: function updateSnippet(el, content, forceReplace) {
      var canUpdate = this.dispatchEvent(new CustomEvent('beforeUpdate', {
        cancelable: true,
        detail: {
          snippet: el,
          content: content
        }
      }));

      if (!canUpdate) {
        return;
      }

      if (el.tagName.toLowerCase() === 'title') {
        document.title = content;
      } else {
        if ((el.hasAttribute('data-naja-snippet-prepend') || el.hasAttribute('data-ajax-prepend')) && !forceReplace) {
          el.insertAdjacentHTML('afterbegin', content);
        } else if ((el.hasAttribute('data-naja-snippet-append') || el.hasAttribute('data-ajax-append')) && !forceReplace) {
          el.insertAdjacentHTML('beforeend', content);
        } else {
          el.innerHTML = content;
        }
      }

      this.dispatchEvent(new CustomEvent('afterUpdate', {
        cancelable: true,
        detail: {
          snippet: el,
          content: content
        }
      }));
    }
  }]);

  return SnippetHandler;
}(_wrapNativeSuper(EventTarget));

var HistoryHandler =
/*#__PURE__*/
function () {
  function HistoryHandler(naja) {
    _classCallCheck(this, HistoryHandler);

    _defineProperty(this, "href", null);

    _defineProperty(this, "uiCache", true);

    this.naja = naja;
    naja.addEventListener('init', this.initialize.bind(this));
    naja.addEventListener('interaction', this.configureMode.bind(this));
    naja.addEventListener('before', this.saveUrl.bind(this));
    naja.addEventListener('success', this.pushNewState.bind(this));
    this.popStateHandler = this.handlePopState.bind(this);
    this.historyAdapter = {
      replaceState: function replaceState(data, title, url) {
        return window.history.replaceState(data, title, url);
      },
      pushState: function pushState(data, title, url) {
        return window.history.pushState(data, title, url);
      }
    };
  }

  _createClass(HistoryHandler, [{
    key: "initialize",
    value: function initialize() {
      window.addEventListener('popstate', this.popStateHandler);
      this.historyAdapter.replaceState(this.buildState(window.location.href, this.uiCache), window.document.title, window.location.href);
    }
  }, {
    key: "handlePopState",
    value: function handlePopState(e) {
      if (!e.state) {
        return;
      }

      if (e.state.ui) {
        this.handleSnippets(e.state.ui);
        this.handleTitle(e.state.title);
      } else if (e.state.ui === false) {
        this.naja.makeRequest('GET', e.state.href, null, {
          history: false,
          historyUiCache: false
        });
      }
    }
  }, {
    key: "saveUrl",
    value: function saveUrl(event) {
      var url = event.detail.url;
      this.href = url;
    }
  }, {
    key: "configureMode",
    value: function configureMode(event) {
      var _event$detail = event.detail,
          element = _event$detail.element,
          options = _event$detail.options; // propagate mode to options

      if (!element) {
        return;
      }

      if (element.hasAttribute('data-naja-history')) {
        options.history = this.constructor.normalizeMode(element.getAttribute('data-naja-history'));
      }

      if (element.hasAttribute('data-naja-history-cache')) {
        options.historyUiCache = element.getAttribute('data-naja-history-cache') !== 'off';
      }
    }
  }, {
    key: "pushNewState",
    value: function pushNewState(event) {
      var _event$detail2 = event.detail,
          payload = _event$detail2.payload,
          options = _event$detail2.options;
      var mode = this.constructor.normalizeMode(options.history);

      if (mode === false) {
        return;
      }

      if (payload.postGet && payload.url) {
        this.href = payload.url;
      }

      var method = payload.replaceHistory || mode === 'replace' ? 'replaceState' : 'pushState';
      var uiCache = options.historyUiCache === true || options.historyUiCache !== false && this.uiCache; // eslint-disable-line no-extra-parens

      this.historyAdapter[method](this.buildState(this.href, uiCache), window.document.title, this.href);
      this.href = null;
    }
  }, {
    key: "buildState",
    value: function buildState(href, uiCache) {
      var state = {
        href: href
      };

      if (uiCache) {
        state.title = window.document.title;
        state.ui = this.findSnippets();
      } else {
        state.ui = false;
      }

      return state;
    }
  }, {
    key: "findSnippets",
    value: function findSnippets() {
      var result = {};
      var snippets = window.document.querySelectorAll('[id^="snippet-"]');

      for (var i = 0; i < snippets.length; i++) {
        var snippet = snippets.item(i);

        if (!snippet.hasAttribute('data-naja-history-nocache') && !snippet.hasAttribute('data-history-nocache')) {
          result[snippet.id] = snippet.innerHTML;
        }
      }

      return result;
    }
  }, {
    key: "handleSnippets",
    value: function handleSnippets(snippets) {
      this.naja.snippetHandler.updateSnippets(snippets, true);
      this.naja.scriptLoader.loadScripts(snippets);
      this.naja.load();
    }
  }, {
    key: "handleTitle",
    value: function handleTitle(title) {
      window.document.title = title;
    }
  }], [{
    key: "normalizeMode",
    value: function normalizeMode(mode) {
      if (mode === 'off' || mode === false) {
        return false;
      } else if (mode === 'replace') {
        return 'replace';
      }

      return true;
    }
  }]);

  return HistoryHandler;
}();

var ScriptLoader =
/*#__PURE__*/
function () {
  function ScriptLoader(naja) {
    var _this = this;

    _classCallCheck(this, ScriptLoader);

    naja.addEventListener('success', function (event) {
      var payload = event.detail.payload;

      if (payload.snippets) {
        _this.loadScripts(payload.snippets);
      }
    });
  }

  _createClass(ScriptLoader, [{
    key: "loadScripts",
    value: function loadScripts(snippets) {
      Object.keys(snippets).forEach(function (id) {
        var content = snippets[id];

        if (!/<script/i.test(content)) {
          return;
        }

        var el = window.document.createElement('div');
        el.innerHTML = content;
        var scripts = el.querySelectorAll('script');

        for (var i = 0; i < scripts.length; i++) {
          var script = scripts.item(i);
          var scriptEl = window.document.createElement('script');
          scriptEl.innerHTML = script.innerHTML;

          if (script.hasAttributes()) {
            var attrs = script.attributes;

            for (var j = 0; j < attrs.length; j++) {
              var attrName = attrs[j].name;
              scriptEl[attrName] = attrs[j].value;
            }
          }

          window.document.head.appendChild(scriptEl).parentNode.removeChild(scriptEl);
        }
      });
    }
  }]);

  return ScriptLoader;
}();

var Naja =
/*#__PURE__*/
function (_EventTarget) {
  _inherits(Naja, _EventTarget);

  function Naja(uiHandler, redirectHandler, snippetHandler, formsHandler, historyHandler, scriptLoader) {
    var _this;

    _classCallCheck(this, Naja);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Naja).call(this));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "initialized", false);

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "uiHandler", null);

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "redirectHandler", null);

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "snippetHandler", null);

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "formsHandler", null);

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "historyHandler", null);

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "scriptLoader", null);

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "extensions", []);

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "defaultOptions", {});

    _this.uiHandler = uiHandler ? new uiHandler(_assertThisInitialized(_assertThisInitialized(_this))) : new UIHandler(_assertThisInitialized(_assertThisInitialized(_this)));
    _this.redirectHandler = redirectHandler ? new redirectHandler(_assertThisInitialized(_assertThisInitialized(_this))) : new RedirectHandler(_assertThisInitialized(_assertThisInitialized(_this)));
    _this.snippetHandler = snippetHandler ? new snippetHandler(_assertThisInitialized(_assertThisInitialized(_this))) : new SnippetHandler(_assertThisInitialized(_assertThisInitialized(_this)));
    _this.formsHandler = formsHandler ? new formsHandler(_assertThisInitialized(_assertThisInitialized(_this))) : new FormsHandler(_assertThisInitialized(_assertThisInitialized(_this)));
    _this.historyHandler = historyHandler ? new historyHandler(_assertThisInitialized(_assertThisInitialized(_this))) : new HistoryHandler(_assertThisInitialized(_assertThisInitialized(_this)));
    _this.scriptLoader = scriptLoader ? new scriptLoader(_assertThisInitialized(_assertThisInitialized(_this))) : new ScriptLoader(_assertThisInitialized(_assertThisInitialized(_this)));
    return _this;
  }

  _createClass(Naja, [{
    key: "registerExtension",
    value: function registerExtension(extensionClass) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      this.extensions.push([extensionClass, args]);
    }
  }, {
    key: "initialize",
    value: function initialize() {
      var _this2 = this;

      var defaultOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (this.initialized) {
        throw new Error('Cannot initialize Naja, it is already initialized.');
      }

      this.defaultOptions = defaultOptions;
      this.extensions = this.extensions.map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            extensionClass = _ref2[0],
            args = _ref2[1];

        return _construct(extensionClass, [_this2].concat(_toConsumableArray(args)));
      });
      this.fireEvent('init', {
        defaultOptions: defaultOptions
      });
      this.initialized = true;
      this.load();
    }
  }, {
    key: "load",
    value: function load() {
      this.fireEvent('load');
    }
  }, {
    key: "fireEvent",
    value: function fireEvent(type) {
      var detail = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var event = new CustomEvent(type, {
        cancelable: true,
        detail: detail
      });
      return this.dispatchEvent(event);
    }
  }, {
    key: "makeRequest",
    value: function () {
      var _makeRequest = _asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee(method, url) {
        var data,
            options,
            abortController,
            request,
            promise,
            response,
            payload,
            _args = arguments;
        return regenerator.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                data = _args.length > 2 && _args[2] !== undefined ? _args[2] : null;
                options = _args.length > 3 && _args[3] !== undefined ? _args[3] : {};
                options = _objectSpread({}, this.defaultOptions, options, {
                  fetch: _objectSpread({}, this.defaultOptions.fetch || {}, options.fetch || {})
                });
                abortController = new AbortController();
                request = new Request(url, _objectSpread({
                  credentials: 'same-origin'
                }, options.fetch, {
                  method: method,
                  headers: new Headers(options.fetch.headers || {}),
                  body: data !== null && Object.getPrototypeOf(data) === Object.prototype ? new URLSearchParams(data) : data,
                  signal: abortController.signal
                })); // impersonate XHR so that Nette can detect isAjax()

                request.headers.set('X-Requested-With', 'XMLHttpRequest');

                if (this.fireEvent('before', {
                  request: request,
                  method: method,
                  url: url,
                  data: data,
                  options: options
                })) {
                  _context.next = 8;
                  break;
                }

                return _context.abrupt("return", {});

              case 8:
                promise = window.fetch(request);
                this.fireEvent('start', {
                  request: request,
                  promise: promise,
                  abortController: abortController,
                  options: options
                });
                _context.prev = 10;
                _context.next = 13;
                return promise;

              case 13:
                response = _context.sent;

                if (response.ok) {
                  _context.next = 16;
                  break;
                }

                throw new HttpError(response);

              case 16:
                _context.next = 18;
                return response.json();

              case 18:
                payload = _context.sent;
                _context.next = 31;
                break;

              case 21:
                _context.prev = 21;
                _context.t0 = _context["catch"](10);

                if (!(_context.t0.name === 'AbortError')) {
                  _context.next = 27;
                  break;
                }

                this.fireEvent('abort', {
                  request: request,
                  error: _context.t0,
                  options: options
                });
                this.fireEvent('complete', {
                  request: request,
                  response: response,
                  payload: undefined,
                  error: _context.t0,
                  options: options
                });
                return _context.abrupt("return", {});

              case 27:
                this.fireEvent('error', {
                  request: request,
                  response: response,
                  error: _context.t0,
                  options: options
                });
                this.fireEvent('complete', {
                  request: request,
                  response: response,
                  payload: undefined,
                  error: _context.t0,
                  options: options
                });
                this.load();
                throw _context.t0;

              case 31:
                this.fireEvent('success', {
                  request: request,
                  response: response,
                  payload: payload,
                  options: options
                });
                this.fireEvent('complete', {
                  request: request,
                  response: response,
                  payload: payload,
                  error: undefined,
                  options: options
                });
                this.load();
                return _context.abrupt("return", payload);

              case 35:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[10, 21]]);
      }));

      function makeRequest(_x, _x2) {
        return _makeRequest.apply(this, arguments);
      }

      return makeRequest;
    }()
  }]);

  return Naja;
}(_wrapNativeSuper(EventTarget));

var HttpError =
/*#__PURE__*/
function (_Error) {
  _inherits(HttpError, _Error);

  function HttpError(response) {
    var _this3;

    _classCallCheck(this, HttpError);

    var message = "HTTP ".concat(response.status, ": ").concat(response.statusText);
    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(HttpError).call(this, message));
    _this3.name = _this3.constructor.name;
    _this3.stack = new Error(message).stack;
    _this3.response = response;
    return _this3;
  }

  return HttpError;
}(_wrapNativeSuper(Error));

var AbortExtension =
/*#__PURE__*/
function () {
  function AbortExtension(naja) {
    _classCallCheck(this, AbortExtension);

    _defineProperty(this, "abortable", true);

    _defineProperty(this, "abortController", null);

    naja.addEventListener('init', this.initialize.bind(this));
    naja.addEventListener('interaction', this.checkAbortable.bind(this));
    naja.addEventListener('before', this.checkAbortable.bind(this));
    naja.addEventListener('start', this.saveAbortController.bind(this));
    naja.addEventListener('complete', this.clearAbortController.bind(this));
  }

  _createClass(AbortExtension, [{
    key: "initialize",
    value: function initialize() {
      var _this = this;

      document.addEventListener('keydown', function (evt) {
        if (_this.abortController !== null && ('key' in evt ? evt.key === 'Escape' : evt.keyCode === 27) && !(evt.ctrlKey || evt.shiftKey || evt.altKey || evt.metaKey) && _this.abortable) {
          _this.abortController.abort();

          _this.abortController = null;
        }
      });
    }
  }, {
    key: "checkAbortable",
    value: function checkAbortable(event) {
      var _event$detail = event.detail,
          element = _event$detail.element,
          options = _event$detail.options;
      this.abortable = element ? element.getAttribute('data-naja-abort') !== 'off' : options.abort !== false; // propagate to options if called in interaction event

      options.abort = this.abortable;
    }
  }, {
    key: "saveAbortController",
    value: function saveAbortController(event) {
      var abortController = event.detail.abortController;
      this.abortController = abortController;
    }
  }, {
    key: "clearAbortController",
    value: function clearAbortController() {
      this.abortController = null;
      this.abortable = true;
    }
  }]);

  return AbortExtension;
}();

var UniqueExtension =
/*#__PURE__*/
function () {
  function UniqueExtension(naja) {
    _classCallCheck(this, UniqueExtension);

    _defineProperty(this, "previousAbortController", null);

    naja.addEventListener('interaction', this.checkUniqueness.bind(this));
    naja.addEventListener('start', this.abortPreviousRequest.bind(this));
    naja.addEventListener('complete', this.clearRequest.bind(this));
  }

  _createClass(UniqueExtension, [{
    key: "checkUniqueness",
    value: function checkUniqueness(event) {
      var _event$detail = event.detail,
          element = _event$detail.element,
          options = _event$detail.options;
      options.unique = element.getAttribute('data-naja-unique') !== 'off';
    }
  }, {
    key: "abortPreviousRequest",
    value: function abortPreviousRequest(event) {
      var _event$detail2 = event.detail,
          abortController = _event$detail2.abortController,
          options = _event$detail2.options;

      if (this.previousAbortController !== null && options.unique !== false) {
        this.previousAbortController.abort();
      }

      this.previousAbortController = abortController;
    }
  }, {
    key: "clearRequest",
    value: function clearRequest() {
      this.previousAbortController = null;
    }
  }]);

  return UniqueExtension;
}();

// import './polyfills';
var naja = new Naja();
naja.registerExtension(AbortExtension);
naja.registerExtension(UniqueExtension);

export default naja;
//# sourceMappingURL=Naja.esm.js.map
