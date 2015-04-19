(function umd(require){
  if ('object' == typeof exports) {
    module.exports = require('1');
  } else if ('function' == typeof define && define.amd) {
    define(function(){ return require('1'); });
  } else {
    this['gmodal'] = require('1');
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
    var Deferred, cacheBust, createPromise, deferredObject, delay, doc, handleMessageEvent, hash, iframe, load, myproxy, onMessage, proxyPage, proxyWin, randomHash, storageKey, usePostMessage, xstore;
    doc = win.document;
    load = require('load-iframe');
    proxyPage = 'http://niiknow.github.io/xstore/xstore.html';
    storageKey = 'xstore';
    deferredObject = {};
    iframe = void 0;
    proxyWin = void 0;
    usePostMessage = win.postMessage != null;
    cacheBust = 0;
    hash = void 0;
    delay = 333;
    onMessage = function(fn) {
      if (doc.addEventListener) {
        return doc.addEventListener("message", fn);
      } else {
        return doc.attachEvent("onmessage", fn);
      }
    };

    /**
     * defer/promise class
    #
     */
    Deferred = (function() {
      function Deferred() {}

      Deferred.prototype.callbacks = [];

      Deferred.prototype.errorbacks = [];

      Deferred.prototype.promise = function(func) {
        var self;
        self = this;
        if (func) {
          func(self.resolve, self.reject);
        }
        return self;
      };

      Deferred.prototype.then = function(callback, errorback) {
        var self;
        self = this;
        if (errorback) {
          self.errorbacks[self.callbacks.length] = errorback;
        }
        self.callbacks.push(callback);
        return self;
      };

      Deferred.prototype.resolve = function(data) {
        var e, i, l, self;
        self = this;
        i = 0;
        l = self.callbacks.length;
        i;
        while (i < l) {
          try {
            data = self.callbacks[i](data);
          } catch (_error) {
            e = _error;
            if (self.errorbacks[i]) {
              self.errorbacks[i](e);
            } else {
              throw new Error(e);
            }
          }
          i += 1;
        }
        return self;
      };

      Deferred.prototype.reject = function(e) {
        var self;
        self = this;
        if (self.errorbacks.length) {
          self.errorbacks[self.errorbacks.length](e);
        } else {
          throw new Error(e);
        }
      };

      return Deferred;

    })();
    myproxy = (function() {
      function myproxy() {}

      myproxy.prototype.delay = 333;

      myproxy.prototype.hash = win.location.hash;

      myproxy.prototype.init = function() {
        var self;
        self = this;
        if (usePostMessage) {
          return onMessage(self.handleMessage);
        } else {
          return setInterval((function() {
            var newhash;
            newhash = win.location.hash;
            if (newhash !== hash) {
              hash = newhash;
              self.handleMessage({
                data: JSON.parse(newhash.substr(1))
              });
            }
          }), self.delay);
        }
      };

      myproxy.prototype.handleMessage = function(evt) {
        var d, id, key, method, myCacheBust, self;
        d = e.data;
        if (typeof d === "string") {
          if (/^xstore-/.test(d)) {
            d = d.split(",");
          } else if (jsonEncode) {
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
        if (usePostMessage) {
          evt.source.postMessage(JSON.stringify(d), evt.origin);
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
    createPromise = function(event, item) {
      return function(resolve, reject) {
        var d, deferredHash;
        deferredHash = randomHash();
        d = [0, deferredHash, event, item.k, item.v];
        deferredObject[deferredHash] = {
          resolve: resolve,
          reject: reject
        };
        if (usePostMessage) {
          proxyWin.postMessage(JSON.stringify(d), '*');
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
      };
    };
    handleMessageEvent = function(e) {
      var d, di, id;
      d = e.data;
      if (typeof d === "string") {
        if (/^xstore-/.test(d)) {
          d = d.split(",");
        } else if (jsonEncode) {
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
      di = deferredObject[id];
      if (di) {
        if (/^error-/.test(d[2])) {
          di.reject(d[2]);
        } else {
          di.reject(d[4]);
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
        return (new Deferred).promise(createPromise('get', k));
      };

      xstore.set = function(k, v) {
        return (new Deferred).promise(createPromise('set', {
          'k': k
        }, {
          'v': v
        }));
      };

      xstore.remove = function(k) {
        return (new Deferred).promise(createPromise('remove', k));
      };

      xstore.clear = function() {
        return (new Deferred).promise(createPromise('clear'));
      };

      xstore.init = function(options) {
        if (options.isProxy) {
          (new myproxy()).init();
          return;
        }
        proxyPage = options.url || proxyPage;
        if (win.location.protocol === 'https') {
          proxyPage = proxyPage.replace('http:', 'https:');
        }
        return iframe = load("" + proxyPage, (function(_this) {
          return function() {
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
          };
        })(this));
      };

      return xstore;

    })();
    win.xstore = xstore;
    return module["export"] = xstore;
  })(window);

}).call(this);

}, {"load-iframe":2}],
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
}, {"script-onload":3,"next-tick":4,"type":5}],
3: [function(require, module, exports) {

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
4: [function(require, module, exports) {
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
5: [function(require, module, exports) {
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

}, {}]}, {}, {"1":""})
);