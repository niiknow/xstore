# xstore
All your bases are belong to us.  ;)

xstore is a hack for high-performance, cross-domain data storage.  

1. As a default behavior, xstore comply with brower's doNotTrack setting.  You can override this through xstore init parameter.  If doNotTrack is true, xstore fallback to store data in-memory.  This mean that it will still store data for SPA type of application.
2. xstore uses localStorage and fallback to cookie if localStorage is not enabled
3. even though xstore uses localStorage, xstore instances use different iframe so data can be segmented between different proxy urls.

# usage
No back-end is required.  Out of the box, you can simply reference xstore from (http(s)://niiknow.github.io/xstore/xstore.min.js) - thanks to Github.  xstore cross-domain proxy is provided @ http(s)://niiknow.github.io/xstore/xstore.html

Example:
```
<script src="//niiknow.github.io/xstore/xstore.min.js"></script>
<script>
  xs = new window.xstore()
  xs.init({dntIgnore: true}); // initialize xstore and ignore doNotTrack
</script>
```

You will need to host xstore.min.js and xstore.html if you want to segment your data from others xstore usage.  This is only for data segmentation and does very little toward security.  Anyone can view your source to get at your xstore proxy url.

Example:

```
<script>
  // initialize your xstore.html url
  xs = new window.xstore()
  xs.init({url: 'http://yourdomain.com/xstore.html'}); 
</script>
```

Why re-invent the wheel?  xstore uses various components provided by componentjs and specifically, Marcus Westin store.js @ https://github.com/marcuswestin/store.js

### xstore#init(options)
options are: url, dntIgnore

### xstore#get(key).then(fn, errFn)
get method return a promise for returning of data

```
xstore.get('x').then(function(data){
	console.log(data);
});
```

### xstore#set(key, value).then(fn, errFn)
also return a promise for done/action completion

### xstore#clear().then(fn, errFn)
also return a promise for done/action completion

### xstore#remove(key).then(fn, errFn)
also return a promise for done/action completion

# WARNING
Do not use xstore for sensitive data.  Since xstore is a hack for storing data across domain, security will be an issue for storing sensitive data.

# License
The MIT License (MIT)

Copyright (c) 2015 niiknow

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
