((win) ->
  doc = win.document

  # Setting - The base domain of the proxy
  proxyDomain = 'http://niiknow.github.io/xstore'
  proxyPage = '/xstore.html'
  storageKey = 'xstore'
  deferredObject = {}
  iframe = doc.createElement('iframe')
  proxyWin = undefined
  script = undefined
  usePostMessage = win.postMessage?
  cacheBust = 0
  hash = undefined
  delay = 333

  if (win.location.protocol == 'https')
    proxyDomain = proxyDomain.replace('http:', 'https:')

  # defer/promise class
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

  usePostMessage = win.postMessage?

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
      d = [0, deferredHash, event, storageKey, item]

      # Set the deferred object reference
      deferredObject[deferredHash] =
        resolve: resolve
        reject: reject

      # Send the message and target URI
      if usePostMessage
        # Post the message as JSON
        proxyWin.postMessage JSON.stringify(d), '*'
      else
        # postMessage not available so set  hash
        if iframe != null
          # Cache bust messages with the same info
          cacheBust += 1
          d[0] = +new Date + cacheBust
          hash = '#' + JSON.stringify(d)
          if iframe.src
            iframe.src = "#{proxyDomain}#{proxyPage}#{hash}"
          else if iframe.contentWindow? and iframe.contentWindow.location?
            iframe.contentWindow.location = "#{proxyDomain}#{proxyPage}#{hash}"
          else
            iframe.setAttribute 'src', "#{proxyDomain}#{proxyPage}#{hash}"
      return



  handleMessageEvent = (event) ->
    response = undefined
    # Parse the response
    response = JSON.parse(event.data)
    # if there is a deferred object resolve and remove
    if response.deferredHash
      if response.error
        # Reject if error                        
        deferredObject[response.deferredHash].reject response.error
      else
        # Resolve the deferred object
        deferredObject[response.deferredHash].resolve response.storageObject
      # Remove the deferred item
      delete deferredObject[response.deferredIndex]
    else if response.error
      throw new Error(response.error)

  handleDocumentReady = ->
    iframe = document.body.appendChild(iframe)
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
    return

  contentLoaded = (fn) ->
    done = false
    top = true
    root = doc.documentElement
    modern = doc.addEventListener
    add = if modern then 'addEventListener' else 'attachEvent'
    rem = if modern then 'removeEventListener' else 'detachEvent'
    pre = if modern then '' else 'on'

    init = (e) ->
      if e.type == 'readystatechange' and doc.readyState != 'complete'
        return
      (if e.type == 'load' then win else doc)[rem] pre + e.type, init, false
      if !done and (done = true)
        fn.call win, e.type or e
      return

    poll = ->
      try
        root.doScroll 'left'
      catch e
        setTimeout poll, 50
        return
      init 'poll'
      return

    if doc.readyState == 'complete'
      fn.call win, 'lazy'
    else
      if !modern and root.doScroll
        try
          top = !win.frameElement
        catch e
        if top
          poll()
      doc[add] pre + 'DOMContentLoaded', init, false
      doc[add] pre + 'readystatechange', init, false
      win[add] pre + 'load', init, false
    return


  # Set iFrame attributes
  iframe.id = 'xstore'
  iframe.src = "#{proxyDomain}#{proxyPage}"
  iframe.style.display = 'none'
  
  contentLoaded handleDocumentReady
  onMessage(handleMessageEvent)


  class xstore
    # Function to get localStorage from proxy
    @get: (k) ->
      (new Deferred).promise(createPromise('get', k))

    # Function to set localStorage on proxy
    @set: (k, v) ->
      if typeof k != 'string' and typeof k != 'number'
        throw new Error('Property argument must be a string or number to set a specific property')
      (new Deferred).promise(createPromise('set',
        'k': k
      'v': v))

  modules.export = xstore

) window
