# xstore
All your bases are belong to us.  ;)

xstore is a hack for high-performance, cross-domain data storage.  

1. As a default behavior, xstore comply with brower's doNotTrack setting.  You can override this through xstore init parameter.  If doNotTrack is true, xstore fallback to store data in-memory.  This mean that it will still store data for SPA type of application.
2. xstore uses localStorage and fallback to cookie if localStorage is not enabled
3. even though xstore uses localStorage, it uses different iframe so data can be segmented between different xstore

# usage
No back-end is required.  Out of the box, you can simply reference xstore from (http(s)://niiknow.github.io/xstore/xstore.min.js) - thanks to Github.  xstore cross-domain proxy is provided @ http(s)://niiknow.github.io/xstore/xstore.html

Example:
```
<script src="//niiknow.github.io/xstore/xstore.min.js"></script>
<script>
  store = new window.xstore()
  store.init({dntIgnore: true}); // initialize xstore and ignore doNotTrack
</script>
```

You will need to host xstore.min.js and xstore.html if you want to segment your data from others xstore usage.  This is only for data segmentation and does very little toward security.  A hacker can simply view your source to get at your xstore.html configuration.

Example:

```
<script>
  // initialize your xstore.html url
  store = new window.xstore()
  store.init({url: 'http://yourdomain.com/xstore.html'}); 
</script>
```

Why re-invent the wheel?  xstore uses various components provided by componentjs and specifically, Marcus Westin store.js @ https://github.com/marcuswestin/store.js

### xstore#init(options)
options are: url, dntIgnore

### xstore#get(key).then(fn, errFn)
get method return a promise which can be chain with then function execution.

```
xstore.get('x').then(function(data){
	console.log(data);
});
```

### xstore#set(key, value).then(fn, errFn)
also return a promise for action completion

### xstore#clear().then(fn, errFn)
also return a promise for action completion

### xstore#remove(key).then(fn, errFn)
also return a promise for action completion

# WARNING
Do not use xstore for sensitive data.  Since xstore is a hack for storing data across domain, security will be an issue for storing sensitive data.

