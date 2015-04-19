((win) ->
  doc = win.document
  load = require('load-iframe')
  proxy = require('./proxy.coffee')

  # Setting - The base domain of the proxy
  proxyPage = 'http://niiknow.github.io/xstore/xstore.html'
  storageKey = 'xstore'
  deferredObject = {}
  iframe = undefined
  proxyWin = undefined
  usePostMessage = win.postMessage?
  cacheBust = 0
  hash = undefined
  delay = 333

  ###*
  # defer/promise class
  #
  ###
  class Deferred
    callbacks: []
    errorbacks: []
    promise: (func) ->
      self = @
      if func
        func self.resolve, self.reject
      self

    then: (callback, errorback) ->
      self = @
      if errorback
        self.errorbacks[self.callbacks.length] = errorback
      self.callbacks.push callback
      self

    resolve: (data) ->
      self = @
      i = 0
      l = self.callbacks.length
      i
      while i < l
        try
          data = self.callbacks[i](data)
        catch e
          if self.errorbacks[i]
            self.errorbacks[i] e
          else
            throw new Error(e)
        i += 1
      self

    reject: (e) ->
      self = @
      if self.errorbacks.length
        self.errorbacks[self.errorbacks.length] e
      else
        throw new Error(e)
      return
  

  #cross browser event handler names
  onMessage = (fn) ->
    if doc.addEventListener
      doc.addEventListener "message", fn
    else
      doc.attachEvent "onmessage", fn

  # Helper to return a random string to serve as a simple hash
  randomHash = ->
    rh = Math.random().toString(36).substr 2
    return "xstore-#{rh}"

  # Helper to create the functions for promises

  createPromise = (event, item) ->
    (resolve, reject) ->
      # Message to set the storage
      deferredHash = randomHash()

      # [cacheBust, messageid, method, key, value]
      d = [0, deferredHash, event, item.k, item.v]

      # Set the deferred object reference
      deferredObject[deferredHash] =
        resolve: resolve
        reject: reject

      # Send the message and target URI
      if usePostMessage
        # Post the message as JSON
        proxyWin.postMessage JSON.stringify(d), '*'
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
      return


  handleMessageEvent = (e) ->
    d = e.data

    if typeof d is "string"
      #IE will "toString()" the array, this reverses that action
      if /^xstore-/.test d
        d = d.split ","
      #this browser must json encode postmessages
      else if jsonEncode
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

    di = deferredObject[id]

    # if there is a deferred object resolve and remove
    if di
      if /^error-/.test d[2]
        # Reject if error                        
        di.reject d[2]
      else
        # Resolve the deferred object
        di.reject d[4]
      # Remove the deferred item
      delete deferredObject[id]


  ###*
  # xstore class
  #
  ###
  class xstore
    # Function to get localStorage from proxy
    @get: (k) ->
      (new Deferred).promise(createPromise('get', k))

    # Function to set localStorage on proxy
    @set: (k, v) ->
      (new Deferred).promise(createPromise('set',
        'k': k
      'v': v))

    # Function to remove on proxy
    @remove: (k) ->
      (new Deferred).promise(createPromise('remove', k))

    # Function to clear on proxy
    @clear: () ->
      (new Deferred).promise(createPromise('clear'))

    @init: (options) ->
      if (options.isProxy)
        proxy.init
        return

      proxyPage = options.url || proxyPage

      if (win.location.protocol == 'https')
        proxyPage = proxyPage.replace('http:', 'https:')

      # set iFrame attributes
      iframe = load "#{proxyPage}", =>
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


  modules.export = xstore

) window
