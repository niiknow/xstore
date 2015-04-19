# xstore
All your bases are belong to us.  ;)

xstore is a hack for high-performance, cross-domain data storage.  As a result, xstore default behavior comply with brower's doNotTrack setting.

# usage
No back-end is required.  Out of the box, xstore can be use by simply including the xstore.min.js file.  The proxy is provided by xstore.html hosted on github at http://niiknow.github.io/xstore/xstore.html (https is also supported)

Example:
```
<!-- you can even use the xstore.min.js directly from github -->
<script src="//niknow.github.io/xstore/xstore.min.js"></script>
<script>
  xstore.init({dntIgnore: true}); // initialize xstore and ignore doNotTrack setting
</script>
```

You will need to host xstore.min.js and xstore.html on some server if you want to segment your data from other website xstore usage.  This is only for data segmentation and does very little toward security.  A hacker can simply view your source to get your xstore.html location for access to your data.

Example:

```
<!-- you can even use the xstore.min.js directly -->
<script src="//niknow.github.io/xstore/xstore.min.js"></script>
<script>
  xstore.init({url: 'http://yoururl.com/xstore.html'}); // initialize and provide your own data hosting/segmentation
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
Do not use xstore for sensitive data.  Since xstore is a hack for storing data across domain, security will be an issue for storing sensitive data.  If you must store sensitive data, then you should implement some kind of server-side storage.  Alternatively, you can use SaaS service such as firebase or parsed.com to acheive the same goal.

# Disclaimer
This code is provided AS-IS under the knowledge that data type, storage, and security is the responsibility of the end-user.  Effort has also been made in this document to warn user of security issue with storing of sensitive data.  The author is in NO WAY responsible for issue such as sensitive data breach as a result of the using this code.