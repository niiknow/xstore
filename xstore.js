(function umd(require){
  if ('object' == typeof exports) {
    module.exports = require('1');
  } else if ('function' == typeof define && define.amd) {
    define(function(){ return require('1'); });
  } else {
    this['xstore'] = require('1');
  }
})((function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @param {Boolean} jumped
   * @api public
   */

  function require(name, jumped){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];

    fn.call(m.exports, function(req){
      var dep = modules[id][1][req];
      return require(dep ? dep : req);
    }, m, m.exports, outer, modules, cache, entries);

    // expose as `name`.
    if (name) cache[name] = cache[id];

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
})({
1: [function(require, module, exports) {
(function() {
  (function(win) {
    var Queue, cacheBust, deferredObject, delay, dnt, doPostMessage, doc, handleMessageEvent, hash, iframe, load, lstore, mydeferred, myproxy, onMessage, proxyPage, proxyWin, q, randomHash, store, usePostMessage, xstore;
    doc = win.document;
    load = require('load-iframe');
    Queue = require('queue');
    store = require('store.js');
    proxyPage = 'http://niiknow.github.io/xstore/xstore.html';
    deferredObject = {};
    iframe = void 0;
    proxyWin = void 0;
    usePostMessage = win.postMessage != null;
    cacheBust = 0;
    hash = void 0;
    delay = 333;
    lstore = {};
    q = new Queue({
      concurrency: 1,
      timeout: delay + 5
    });
    dnt = win.navigator.doNotTrack || navigator.msDoNotTrack || win.doNotTrack;
    onMessage = function(fn) {
      if (win.addEventListener) {
        return win.addEventListener("message", fn, false);
      } else {
        return win.attachEvent("onmessage", fn);
      }
    };

    /**
     * defer/promise class
    #
     */
    mydeferred = (function() {
      var i, k, len, ref, v;

      function mydeferred() {}

      mydeferred.prototype.q = function(event, item) {
        var d, deferredHash, self;
        self = this;
        self.mycallbacks = [];
        self.myerrorbacks = [];
        deferredHash = randomHash();
        d = [0, deferredHash, event, item.k, item.v];
        deferredObject[deferredHash] = self;
        if (usePostMessage) {
          doPostMessage(JSON.stringify(d));
        } else {
          if (iframe !== null) {
            cacheBust += 1;
            d[0] = +(new Date) + cacheBust;
            hash = '#' + JSON.stringify(d);
            if (iframe.src) {
              iframe.src = "" + proxyPage + hash;
            } else if ((iframe.contentWindow != null) && (iframe.contentWindow.location != null)) {
              iframe.contentWindow.location = "" + proxyPage + hash;
            } else {
              iframe.setAttribute('src', "" + proxyPage + hash);
            }
          }
        }
        self.then = function(fn, fnErr) {
          if (fnErr) {
            self.myerrorbacks.push(fnErr);
          }
          self.mycallbacks.push(fn);
          return self;
        };
        return self;
      };

      mydeferred.prototype.myresolve = function(data) {
        var i, k, len, ref, self, v;
        self = this;
        ref = self.mycallbacks || [];
        for (k = i = 0, len = ref.length; i < len; k = ++i) {
          v = ref[k];
          v(data);
        }
        return self;
      };

      mydeferred.prototype.myreject = function(e) {
        var self;
        return self = this;
      };

      ref = self.myerrorbacks || [];
      for (k = i = 0, len = ref.length; i < len; k = ++i) {
        v = ref[k];
        v(data);
      }

      self;

      return mydeferred;

    })();
    myproxy = (function() {
      function myproxy() {}

      myproxy.prototype.delay = 333;

      myproxy.prototype.hash = win.location.hash;

      myproxy.prototype.init = function() {
        var self;
        self = this;
        if (usePostMessage) {
          return onMessage(self.handleProxyMessage);
        } else {
          return setInterval((function() {
            var newhash;
            newhash = win.location.hash;
            if (newhash !== hash) {
              hash = newhash;
              self.handleProxyMessage({
                data: JSON.parse(newhash.substr(1))
              });
            }
          }), self.delay);
        }
      };

      myproxy.prototype.handleProxyMessage = function(e) {
        var d, id, key, method, myCacheBust, self;
        d = e.data;
        if (typeof d === "string") {
          if (/^xstore-/.test(d)) {
            d = d.split(",");
          } else {
            try {
              d = JSON.parse(d);
            } catch (_error) {
              return;
            }
          }
        }
        if (!(d instanceof Array)) {
          return;
        }
        id = d[1];
        if (!/^xstore-/.test(id)) {
          return;
        }
        self = this;
        key = d[3] || 'xstore';
        method = d[2];
        cacheBust = 0;
        if (method === 'get') {
          d[4] = store.get(key);
        } else if (method === 'set') {
          store.set(key, d[4]);
        } else if (method === 'remove') {
          store.remove(key);
        } else if (method === 'clear') {
          store.clear();
        } else {
          d[2] = 'error-' + method;
        }
        d[1] = id.replace('xstore-', 'xstoreproxy-');
        if (usePostMessage) {
          e.source.postMessage(JSON.stringify(d), '*');
        } else {
          cacheBust += 1;
          myCacheBust = +(new Date) + cacheBust;
          d[0] = myCacheBust;
          hash = '#' + JSON.stringify(d);
          win.location = win.location.href.replace(globals.location.hash, '') + hash;
        }
      };

      return myproxy;

    })();
    randomHash = function() {
      var rh;
      rh = Math.random().toString(36).substr(2);
      return "xstore-" + rh;
    };
    doPostMessage = function(msg) {
      if ((proxyWin != null)) {
        proxyWin.postMessage(msg, '*');
        return;
      }
      return q.push(function() {
        return doPostMessage(msg);
      });
    };
    handleMessageEvent = function(e) {
      var d, di, id;
      d = e.data;
      if (typeof d === "string") {
        if (/^xstoreproxy-/.test(d)) {
          d = d.split(",");
        } else {
          try {
            d = JSON.parse(d);
          } catch (_error) {
            return;
          }
        }
      }
      if (!(d instanceof Array)) {
        return;
      }
      id = d[1];
      if (!/^xstoreproxy-/.test(id)) {
        return;
      }
      id = id.replace('xstoreproxy-', 'xstore-');
      di = deferredObject[id];
      if (di) {
        if (/^error-/.test(d[2])) {
          di.myreject(d[2]);
        } else {
          di.myresolve(d[4]);
        }
        return delete deferredObject[id];
      }
    };

    /**
     * xstore class
    #
     */
    xstore = (function() {
      function xstore() {}

      xstore.get = function(k) {
        if (dnt) {
          return {
            then: function(fn) {
              return fn(lstore[k]);
            }
          };
        }
        return (new mydeferred()).q('get', {
          'k': k
        });
      };

      xstore.set = function(k, v) {
        if (dnt) {
          return {
            then: function(fn) {
              lstore[k] = v;
              return fn(lstore[k]);
            }
          };
        }
        return (new mydeferred()).q('set', {
          'k': k,
          'v': v
        });
      };

      xstore.remove = function(k) {
        if (dnt) {
          return {
            then: function(fn) {
              delete lstore[k];
              return fn;
            }
          };
        }
        return (new mydeferred()).q('remove', {
          'k': k
        });
      };

      xstore.clear = function() {
        if (dnt) {
          return {
            then: function(fn) {
              lstore = {};
              return fn;
            }
          };
        }
        return (new mydeferred()).q('clear');
      };

      xstore.init = function(options) {
        options = options || {};
        if (options.isProxy) {
          (new myproxy()).init();
          return;
        }
        proxyPage = options.url || proxyPage;
        if (options.dntIgnore) {
          dnt = false;
        }
        if (win.location.protocol === 'https') {
          proxyPage = proxyPage.replace('http:', 'https:');
        }
        return iframe = load(proxyPage, function() {
          iframe.setAttribute("id", "xstore");
          proxyWin = iframe.contentWindow;
          if (!usePostMessage) {
            hash = proxyWin.location.hash;
            return setInterval((function() {
              if (proxyWin.location.hash !== hash) {
                hash = proxyWin.location.hash;
                handleMessageEvent({
                  origin: proxyDomain,
                  data: hash.substr(1)
                });
              }
            }), delay);
          } else {
            return onMessage(handleMessageEvent);
          }
        });
      };

      return xstore;

    })();
    win.xstore = xstore;
    return module["export"] = xstore;
  })(window);

}).call(this);

}, {"load-iframe":2,"queue":3,"store.js":4}],
2: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var onload = require('script-onload');
var tick = require('next-tick');
var type = require('type');

/**
 * Expose `loadScript`.
 *
 * @param {Object} options
 * @param {Function} fn
 * @api public
 */

module.exports = function loadIframe(options, fn){
  if (!options) throw new Error('Cant load nothing...');

  // Allow for the simplest case, just passing a `src` string.
  if ('string' == type(options)) options = { src : options };

  var https = document.location.protocol === 'https:' ||
              document.location.protocol === 'chrome-extension:';

  // If you use protocol relative URLs, third-party scripts like Google
  // Analytics break when testing with `file:` so this fixes that.
  if (options.src && options.src.indexOf('//') === 0) {
    options.src = https ? 'https:' + options.src : 'http:' + options.src;
  }

  // Allow them to pass in different URLs depending on the protocol.
  if (https && options.https) options.src = options.https;
  else if (!https && options.http) options.src = options.http;

  // Make the `<iframe>` element and insert it before the first iframe on the
  // page, which is guaranteed to exist since this Javaiframe is running.
  var iframe = document.createElement('iframe');
  iframe.src = options.src;
  iframe.width = options.width || 1;
  iframe.height = options.height || 1;
  iframe.style.display = 'none';

  // If we have a fn, attach event handlers, even in IE. Based off of
  // the Third-Party Javascript script loading example:
  // https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html
  if ('function' == type(fn)) {
    onload(iframe, fn);
  }

  tick(function(){
    // Append after event listeners are attached for IE.
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(iframe, firstScript);
  });

  // Return the iframe element in case they want to do anything special, like
  // give it an ID or attributes.
  return iframe;
};
}, {"script-onload":5,"next-tick":6,"type":7}],
5: [function(require, module, exports) {

// https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html

/**
 * Invoke `fn(err)` when the given `el` script loads.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api public
 */

module.exports = function(el, fn){
  return el.addEventListener
    ? add(el, fn)
    : attach(el, fn);
};

/**
 * Add event listener to `el`, `fn()`.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api private
 */

function add(el, fn){
  el.addEventListener('load', function(_, e){ fn(null, e); }, false);
  el.addEventListener('error', function(e){
    var err = new Error('script error "' + el.src + '"');
    err.event = e;
    fn(err);
  }, false);
}

/**
 * Attach evnet.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api private
 */

function attach(el, fn){
  el.attachEvent('onreadystatechange', function(e){
    if (!/complete|loaded/.test(el.readyState)) return;
    fn(null, e);
  });
  el.attachEvent('onerror', function(e){
    var err = new Error('failed to load the script "' + el.src + '"');
    err.event = e || window.event;
    fn(err);
  });
}

}, {}],
6: [function(require, module, exports) {
"use strict"

if (typeof setImmediate == 'function') {
  module.exports = function(f){ setImmediate(f) }
}
// legacy node.js
else if (typeof process != 'undefined' && typeof process.nextTick == 'function') {
  module.exports = process.nextTick
}
// fallback for other environments / postMessage behaves badly on IE8
else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
  module.exports = function(f){ setTimeout(f) };
} else {
  var q = [];

  window.addEventListener('message', function(){
    var i = 0;
    while (i < q.length) {
      try { q[i++](); }
      catch (e) {
        q = q.slice(i);
        window.postMessage('tic!', '*');
        throw e;
      }
    }
    q.length = 0;
  }, true);

  module.exports = function(fn){
    if (!q.length) window.postMessage('tic!', '*');
    q.push(fn);
  }
}

}, {}],
7: [function(require, module, exports) {
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};

}, {}],
3: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var Emitter;
var bind;

try {
  Emitter = require('component-emitter');
  bind = require('component-bind');
} catch (err) {
  Emitter = require('emitter');
  bind = require('bind');
}

/**
 * Expose `Queue`.
 */

module.exports = Queue;

/**
 * Initialize a `Queue` with the given options:
 *
 *  - `concurrency` [1]
 *  - `timeout` [0]
 *
 * @param {Object} options
 * @api public
 */

function Queue(options) {
  options = options || {};
  this.timeout = options.timeout || 0;
  this.concurrency = options.concurrency || 1;
  this.pending = 0;
  this.jobs = [];
}

/**
 * Mixin emitter.
 */

Emitter(Queue.prototype);

/**
 * Return queue length.
 *
 * @return {Number}
 * @api public
 */

Queue.prototype.length = function(){
  return this.pending + this.jobs.length;
};

/**
 * Queue `fn` for execution.
 *
 * @param {Function} fn
 * @param {Function} [cb]
 * @api public
 */

Queue.prototype.push = function(fn, cb){
  this.jobs.push([fn, cb]);
  setTimeout(bind(this, this.run), 0);
};

/**
 * Run jobs at the specified concurrency.
 *
 * @api private
 */

Queue.prototype.run = function(){
  while (this.pending < this.concurrency) {
    var job = this.jobs.shift();
    if (!job) break;
    this.exec(job);
  }
};

/**
 * Execute `job`.
 *
 * @param {Array} job
 * @api private
 */

Queue.prototype.exec = function(job){
  var self = this;
  var ms = this.timeout;

  var fn = job[0];
  var cb = job[1];
  if (ms) fn = timeout(fn, ms);

  this.pending++;
  fn(function(err, res){
    cb && cb(err, res);
    self.pending--;
    self.run();
  });
};

/**
 * Decorate `fn` with a timeout of `ms`.
 *
 * @param {Function} fn
 * @param {Function} ms
 * @return {Function}
 * @api private
 */

function timeout(fn, ms) {
  return function(cb){
    var done;

    var id = setTimeout(function(){
      done = true;
      var err = new Error('Timeout of ' + ms + 'ms exceeded');
      err.timeout = timeout;
      cb(err);
    }, ms);

    fn(function(err, res){
      if (done) return;
      clearTimeout(id);
      cb(err, res);
    });
  }
}

}, {"component-emitter":8,"component-bind":9,"emitter":8,"bind":9}],
8: [function(require, module, exports) {

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

}, {}],
9: [function(require, module, exports) {
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

}, {}],
4: [function(require, module, exports) {
;(function(win){
	var store = {},
		doc = win.document,
		localStorageName = 'localStorage',
		scriptTag = 'script',
		storage

	store.disabled = false
	store.version = '1.3.17'
	store.set = function(key, value) {}
	store.get = function(key, defaultVal) {}
	store.has = function(key) { return store.get(key) !== undefined }
	store.remove = function(key) {}
	store.clear = function() {}
	store.transact = function(key, defaultVal, transactionFn) {
		if (transactionFn == null) {
			transactionFn = defaultVal
			defaultVal = null
		}
		if (defaultVal == null) {
			defaultVal = {}
		}
		var val = store.get(key, defaultVal)
		transactionFn(val)
		store.set(key, val)
	}
	store.getAll = function() {}
	store.forEach = function() {}

	store.serialize = function(value) {
		return JSON.stringify(value)
	}
	store.deserialize = function(value) {
		if (typeof value != 'string') { return undefined }
		try { return JSON.parse(value) }
		catch(e) { return value || undefined }
	}

	// Functions to encapsulate questionable FireFox 3.6.13 behavior
	// when about.config::dom.storage.enabled === false
	// See https://github.com/marcuswestin/store.js/issues#issue/13
	function isLocalStorageNameSupported() {
		try { return (localStorageName in win && win[localStorageName]) }
		catch(err) { return false }
	}

	if (isLocalStorageNameSupported()) {
		storage = win[localStorageName]
		store.set = function(key, val) {
			if (val === undefined) { return store.remove(key) }
			storage.setItem(key, store.serialize(val))
			return val
		}
		store.get = function(key, defaultVal) {
			var val = store.deserialize(storage.getItem(key))
			return (val === undefined ? defaultVal : val)
		}
		store.remove = function(key) { storage.removeItem(key) }
		store.clear = function() { storage.clear() }
		store.getAll = function() {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = function(callback) {
			for (var i=0; i<storage.length; i++) {
				var key = storage.key(i)
				callback(key, store.get(key))
			}
		}
	} else if (doc.documentElement.addBehavior) {
		var storageOwner,
			storageContainer
		// Since #userData storage applies only to specific paths, we need to
		// somehow link our data to a specific path.  We choose /favicon.ico
		// as a pretty safe option, since all browsers already make a request to
		// this URL anyway and being a 404 will not hurt us here.  We wrap an
		// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
		// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
		// since the iframe access rules appear to allow direct access and
		// manipulation of the document element, even for a 404 page.  This
		// document can be used instead of the current document (which would
		// have been limited to the current path) to perform #userData storage.
		try {
			storageContainer = new ActiveXObject('htmlfile')
			storageContainer.open()
			storageContainer.write('<'+scriptTag+'>document.w=window</'+scriptTag+'><iframe src="/favicon.ico"></iframe>')
			storageContainer.close()
			storageOwner = storageContainer.w.frames[0].document
			storage = storageOwner.createElement('div')
		} catch(e) {
			// somehow ActiveXObject instantiation failed (perhaps some special
			// security settings or otherwse), fall back to per-path storage
			storage = doc.createElement('div')
			storageOwner = doc.body
		}
		var withIEStorage = function(storeFunction) {
			return function() {
				var args = Array.prototype.slice.call(arguments, 0)
				args.unshift(storage)
				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
				storageOwner.appendChild(storage)
				storage.addBehavior('#default#userData')
				storage.load(localStorageName)
				var result = storeFunction.apply(store, args)
				storageOwner.removeChild(storage)
				return result
			}
		}

		// In IE7, keys cannot start with a digit or contain certain chars.
		// See https://github.com/marcuswestin/store.js/issues/40
		// See https://github.com/marcuswestin/store.js/issues/83
		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
		function ieKeyFix(key) {
			return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
		}
		store.set = withIEStorage(function(storage, key, val) {
			key = ieKeyFix(key)
			if (val === undefined) { return store.remove(key) }
			storage.setAttribute(key, store.serialize(val))
			storage.save(localStorageName)
			return val
		})
		store.get = withIEStorage(function(storage, key, defaultVal) {
			key = ieKeyFix(key)
			var val = store.deserialize(storage.getAttribute(key))
			return (val === undefined ? defaultVal : val)
		})
		store.remove = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			storage.removeAttribute(key)
			storage.save(localStorageName)
		})
		store.clear = withIEStorage(function(storage) {
			var attributes = storage.XMLDocument.documentElement.attributes
			storage.load(localStorageName)
			for (var i=0, attr; attr=attributes[i]; i++) {
				storage.removeAttribute(attr.name)
			}
			storage.save(localStorageName)
		})
		store.getAll = function(storage) {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = withIEStorage(function(storage, callback) {
			var attributes = storage.XMLDocument.documentElement.attributes
			for (var i=0, attr; attr=attributes[i]; ++i) {
				callback(attr.name, store.deserialize(storage.getAttribute(attr.name)))
			}
		})
	}

	try {
		var testKey = '__storejs__'
		store.set(testKey, testKey)
		if (store.get(testKey) != testKey) { store.disabled = true }
		store.remove(testKey)
	} catch(e) {
		store.disabled = true
	}
	store.enabled = !store.disabled

	if (typeof module != 'undefined' && module.exports && this.module !== module) { module.exports = store }
	else if (typeof define === 'function' && define.amd) { define(store) }
	else { win.store = store }

})(Function('return this')());

}, {}]}, {}, {"1":""})
);