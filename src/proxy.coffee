store = require('store.js')

#cross browser event handler names
onMessage = (fn) ->
  if document.addEventListener
    window.addEventListener "message", fn
  else
    window.attachEvent "onmessage", fn

usePostMessage = win.postMessage?

class myproxy
  # Post message not supported
  delay: 333
  hash: win.location.hash
  handleMessage: (evt) ->
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

    self = @    
    key = d[3] or 'xstore'
    method = d[2]
    cacheBust = 0

    # If the key exists in storage
    if method == 'get'
      # Get storage object - stringify and send back
      d[4] = store.get(key)
    else if method == 'set'
      store.set(key, d[4])
    else if method == 'remove'
      store.remove(key)
    else if method == 'clear'
      store.clear()
    else
      d[2] = 'error: ' + method 

    if usePostMessage
      # Post the return message back as JSON
      evt.source.postMessage JSON.stringify(d), evt.origin
    else
      # Cache bust messages with the same info
      cacheBust += 1
      myCacheBust = +new Date + cacheBust
      d[0] = myCacheBust

      # postMessage not available so set top location hash - Replace the hash with nothing then add new
      hash = '#' + JSON.stringify(d)
      win.location = win.location.href.replace(globals.location.hash, '') + hash
    return

  proxy = new myproxy()

  # If postMessage not supported set up polling for hash change
  if usePostMessage
    onMessage(proxy.handleMessage)
  else
    # Poll for hash changes
    setInterval (->
      newhash = win.location.hash
      if newhash != hash
        # Set new hash
        hash = newhash
        proxy.handleMessage data: JSON.parse(newhash.substr(1))
      return
    ), self.delay

modules.export = proxy
