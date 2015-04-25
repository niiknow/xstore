xstore = require('../src/index.coffee')
assert = require('component-assert')

describe 'webanalyser.set', ->
  it 'should use xstore set by default', (done)->
    myVar = 0
    store = new xstore()
    store.set('a', 8).then ->
      store.get('a').then (v) ->
        myVar = v
        assert.equal myVar, 8, 'xstore set success'
        done()
