((win) ->
  doc = win.document
  debug = require('debug')
  log = debug('xstore')
  load = require('load-iframe')
  store = require('store.js')
  cookie = require('cookie')

  # determine if postmessage is enabled
  usePostMessage = win.postMessage?

  # use this to bust cache for has method
  cacheBust = 0

  # default delay
  delay = 333

  # max cookie store time 777 days
  maxStore = 6000 * 60 * 24 * 777

  # custom queue to wait for document ready
  myq = []
  q = setInterval -> 
    if myq.length > 0
      myq.shift()()
  , delay + 5

  dnt = win.navigator.doNotTrack or win.navigator.msDoNotTrack or win.doNotTrack

  #cross browser event handler names
  onMessage = (fn) ->
    if win.addEventListener
      win.addEventListener "message", fn, false
    else
      win.attachEvent "onmessage", fn

  ###*
  # defer/promise class
  #
  ###
  class mydeferred
    q: (xs, event, item) ->
      self = @
      self.mycallbacks = []
      self.myerrorbacks = []
      # Message to set the storage
      dh = randomHash()

      # [cacheBust, messageid, method, key, value]
      d = [0, dh, event, item.k, item.v]

      # Set the deferred object reference
      xs.dob[dh] = self

      # Send the message and target URI
      if usePostMessage
        # Post the message as JSON
        xs.doPostMessage xs, JSON.stringify(d)
      else
        # postMessage not available so set hash
        if xs.iframe != null
          # Cache bust messages with the same info
          cacheBust += 1
          d[0] = +new Date + cacheBust
          xs.hash = '#' + JSON.stringify(d)
          if xs.iframe.src
            xs.iframe.src = "#{proxyPage}#{xs.hash}"
          else if xs.iframe.contentWindow? and xs.iframe.contentWindow.location?
            xs.iframe.contentWindow.location = "#{proxyPage}#{xs.hash}"
          else
            xs.iframe.setAttribute 'src', "#{proxyPage}#{xs.hash}"

      # do not make this a prototype method, error in firefox
      self.then =  (fn, fnErr) ->
        if fnErr
          self.myerrorbacks.push fnErr
        self.mycallbacks.push fn
        self

      self

    myresolve: (data) ->
      self = @
      for v, k in self.mycallbacks or []
        v data
      self

    myreject: (e) ->
       self = @
      for v, k in self.myerrorbacks or []
        v data
      self
  
  class myproxy
    # Post message not supported
    delay: 333
    hash: win.location.hash
    init: ->
      self = @
      # If postMessage not supported set up polling for hash change
      if usePostMessage
        onMessage(self.handleProxyMessage)
      else
        # Poll for hash changes
        setInterval (->
          newhash = win.location.hash
          if newhash != xs.hash
            # Set new hash
            xs.hash = newhash
            self.handleProxyMessage data: JSON.parse(newhash.substr(1))
          return
        ), self.delay

    handleProxyMessage: (e) ->
      d = e.data

      if typeof d is "string"
        #IE will "toString()" the array, this reverses that action
        if /^xstore-/.test d
          d = d.split ","
        #this browser must json encode postmessages
        else 
          try d = JSON.parse d
          catch
            return

      # xstore always pass an array
      unless d instanceof Array
        return
      # [cacheBust, messageid, method, key, value]

      #return unless lead by an xstore id
      id = d[1]
      unless /^xstore-/.test id
        return

      self = @    
      key = d[3] or 'xstore'
      method = d[2]
      cacheBust = 0
      mystore = store
      if (!store.enabled)
        mystore = 
          get: (k) ->
            return cookie(key)
          set: (k, v) ->
            cookie(k, v, { maxage: maxStore })
          remove: (k) ->
            cookie(k, null)
          clear: ->
            cookies = doc.cookie.split(';')
            for v, k in cookies
              idx = v.indexOf('=')
              name = if idx > -1 then v.substr(0, idx) else v
              doc.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT'

      # If the key exists in storage
      if method == 'get'
        # Get storage object - stringify and send back
        d[4] = mystore.get(key)
      else if method == 'set'
        mystore.set(key, d[4])
      else if method == 'remove'
        mystore.remove(key)
      else if method == 'clear'
        mystore.clear()
      else
        d[2] = 'error-' + method 

      d[1] = id.replace('xstore-', 'xstoreproxy-')

      if usePostMessage
        # Post the return message back as JSON
        e.source.postMessage JSON.stringify(d), '*'
      else
        # Cache bust messages with the same info
        cacheBust += 1
        myCacheBust = +new Date + cacheBust
        d[0] = myCacheBust

        # postMessage not available so set top location hash - Replace the hash with nothing then add new
        hash = '#' + JSON.stringify(d)
        win.location = win.location.href.replace(win.location.hash, '') + hash
      return

  # Helper to return a random string to serve as a simple hash
  randomHash = ->
    rh = Math.random().toString(36).substr 2
    return "xstore-#{rh}"

  ###*
  # xstore class
  #
  ###
  class xstore
    hasInit: false
    debug: debug
    proxyPage: '//niiknow.github.io/xstore/xstore.html'
    iframe: null
    proxyWin: null
    hash: null
    tempStore: {}
    dob: {}
    # Function to get localStorage from proxy
    get: (k) ->
      @init()
      if (dnt)
        return {
          then: (fn) ->
            fn self.tempStore[k]
        }
      (new mydeferred()).q(@, 'get', {'k': k})

    # Function to set localStorage on proxy
    set: (k, v) ->
      @init()
      if (dnt)
        return {
          then: (fn) ->
            self.tempStore[k] = v
            fn self.tempStore[k]
        }

      (new mydeferred()).q(@, 'set', {'k': k, 'v': v})

    # Function to remove on proxy
    remove: (k) ->
      @init()
      if (dnt)
        return {
          then: (fn) ->
            delete self.tempStore[k]
            fn
        }

      (new mydeferred()).q(@, 'remove', {'k': k})

    # Function to clear on proxy
    clear: () ->
      @init()
      if (dnt)
        return {
          then: (fn) ->
            self.tempStore = {}
            fn
        }

      (new mydeferred()).q(@, 'clear')

    doPostMessage: (xs, msg) ->
      if (xs.proxyWin?)
        clearInterval(q)
        xs.proxyWin.postMessage msg, '*'
      myq.push ->
        xs.doPostMessage xs, msg

    handleMessageEvent: (e) ->
      self = @
      d = e.data

      if typeof d is "string"
        #IE will "toString()" the array, this reverses that action
        if /^xstoreproxy-/.test d
          d = d.split ","
        #this browser must json encode postmessages
        else
          try d = JSON.parse d
          catch
            return

      # xstore always pass an array
      unless d instanceof Array
        return
      # [cacheBust, messageid, method, key, value]

      #return unless lead by an xstore id
      id = d[1]
      unless /^xstoreproxy-/.test id
        return

      id = id.replace('xstoreproxy-', 'xstore-')
      di = self.dob[id]

      # if there is a deferred object resolve and remove
      if di
        if /^error-/.test d[2]
          # Reject if error                        
          di.myreject d[2]
        else
          # Resolve the deferred object
          di.myresolve d[4]

        # Remove the deferred item
        self.dob[id] = null

    init: (options) ->
      self = @
      if (self.hasInit) 
        return self

      self.hasInit = true
      options = options or {}
      if (options.isProxy)
        log('init proxy')
        (new myproxy()).init()
        return self

      self.proxyPage = options.url or self.proxyPage
      if options.dntIgnore or typeof dnt is 'undefined' or dnt is 'unspecified' or dnt is 'no' or dnt is '0'
        log("disable dnt")
        dnt = false

      log("init storeage dnt = #{dnt}")
      # set iFrame attributes
      iframe = load self.proxyPage, () ->
        log('iframe loaded')
        self.proxyWin = iframe.contentWindow
        # If postMessage not supported set up polling for hash change
        if !usePostMessage
           # Poll for hash changes
          self.hash = proxyWin.location.hash
          setInterval (->
            if proxyWin.location.hash != hash
              # Set new hash
              self.hash = proxyWin.location.hash
              self.handleMessageEvent
                origin: proxyDomain
                data: self.hash.substr(1)
            return
          ), delay

        else 
          onMessage ->
            self.handleMessageEvent arguments[0]

  module.exports = xstore

) window
