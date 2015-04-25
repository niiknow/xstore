((win) ->
  doc = win.document
  load = require('load-iframe')
  store = require('store.js')
  cookie = require('cookie')

  # Setting - The base domain of the proxy
  proxyPage = 'http://niiknow.github.io/xstore/xstore.html'
  deferredObject = {}
  iframe = undefined
  proxyWin = undefined
  usePostMessage = win.postMessage?
  cacheBust = 0
  hash = undefined
  delay = 333
  lstore = {}
  myq = []
  maxStore = 6000 * 60 * 24 * 777
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
    q: (event, item) ->
      self = @
      self.mycallbacks = []
      self.myerrorbacks = []
      # Message to set the storage
      deferredHash = randomHash()

      # [cacheBust, messageid, method, key, value]
      d = [0, deferredHash, event, item.k, item.v]

      # Set the deferred object reference
      deferredObject[deferredHash] = self

      # Send the message and target URI
      if usePostMessage
        # Post the message as JSON
        doPostMessage JSON.stringify(d)
      else
        # postMessage not available so set hash
        if iframe != null
          # Cache bust messages with the same info
          cacheBust += 1
          d[0] = +new Date + cacheBust
          hash = '#' + JSON.stringify(d)
          if iframe.src
            iframe.src = "#{proxyPage}#{hash}"
          else if iframe.contentWindow? and iframe.contentWindow.location?
            iframe.contentWindow.location = "#{proxyPage}#{hash}"
          else
            iframe.setAttribute 'src', "#{proxyPage}#{hash}"

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
          if newhash != hash
            # Set new hash
            hash = newhash
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
        win.location = win.location.href.replace(globals.location.hash, '') + hash
      return

  # Helper to return a random string to serve as a simple hash
  randomHash = ->
    rh = Math.random().toString(36).substr 2
    return "xstore-#{rh}"

  doPostMessage = (msg) ->
    if (proxyWin?)
      clearInterval(q)
      proxyWin.postMessage msg, '*'
      return
    myq.push ->
      doPostMessage msg

  handleMessageEvent = (e) ->
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
    di = deferredObject[id]

    # if there is a deferred object resolve and remove
    if di
      if /^error-/.test d[2]
        # Reject if error                        
        di.myreject d[2]
      else
        # Resolve the deferred object
        di.myresolve d[4]
      # Remove the deferred item
      delete deferredObject[id]


  ###*
  # xstore class
  #
  ###
  class xstore
    hasInit: false
    lstore: lstore
    # Function to get localStorage from proxy
    get: (k) ->
      @init()
      if (dnt)
        return {
          then: (fn) ->
            fn lstore[k]
        }
      (new mydeferred()).q('get', {'k': k})

    # Function to set localStorage on proxy
    set: (k, v) ->
      @init()
      if (dnt)
        return {
          then: (fn) ->
            lstore[k] = v
            fn lstore[k]
        }

      (new mydeferred()).q('set', {'k': k, 'v': v})

    # Function to remove on proxy
    remove: (k) ->
      @init()
      if (dnt)
        return {
          then: (fn) ->
            delete lstore[k]
            fn
        }

      (new mydeferred()).q('remove', {'k': k})

    # Function to clear on proxy
    clear: () ->
      @init()
      if (dnt)
        return {
          then: (fn) ->
            lstore = {}
            fn
        }

      (new mydeferred()).q('clear')

    init: (options) ->
      self = @
      if (self.hasInit) 
        return self

      self.hasInit = true
      options = options or {}
      if (options.isProxy)
        (new myproxy()).init()
        return

      proxyPage = options.url or proxyPage
      if options.dntIgnore
        dnt = false
      
      if !store.enabled 
        dnt = true

      if (win.location.protocol == 'https')
        proxyPage = proxyPage.replace('http:', 'https:')

      # set iFrame attributes
      iframe = load proxyPage, () ->
        iframe.setAttribute("id", "xstore")
        proxyWin = iframe.contentWindow
        # If postMessage not supported set up polling for hash change
        if !usePostMessage
           # Poll for hash changes
          hash = proxyWin.location.hash
          setInterval (->
            if proxyWin.location.hash != hash
              # Set new hash
              hash = proxyWin.location.hash
              handleMessageEvent
                origin: proxyDomain
                data: hash.substr(1)
            return
          ), delay

        else 
          onMessage(handleMessageEvent)

  win.xstore = new xstore()
  module.exports = win.xstore

) window
