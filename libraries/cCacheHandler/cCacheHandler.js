// this will handle cache requests
// key feature is that it generates some key based on a some series of objects you pass to identify it
function getLibraryInfo () {
  return {
    info: {
      name:'cCacheHandler',
      version:'2.2.0',
      key:'M3reA5eBxtwxSqCEgPywb9ai_d-phDA33',
      description:'cache handler library',
      share:'https://script.google.com/d/1U6j9t_3ONTbhTCvhjwANMcEXeHXr4shgzTG0ZrRnDYLcFl3_IH2b2eAY/edit?usp=sharing'
    },
    dependencies:[]
  }; 
}
var  MAXCACHECHUNK = 96000;
/**
 * CacheHandler
 * @param {number} optSeconds some number of seconds for the cache to last
 * @param {string} optSiloId some string to differentiate this CacheHandler instance
 * @param {boolean} [optPrivate=true] if this is a private cache
 * @param {boolean} optDisableCache whether or not to disable all caching
 * @param {Cache} optSpecificCache - can take a specific cache
 * @param {string} optCacheCommunity - an id for siloing cache into groups
 * @return {CacheHandler} self
 */
 
function CacheHandler (optSeconds,optSiloId,optPrivate,optDisableCache,optSpecificCache,optCacheCommunity) {

  var self = this;
  var expiry = optSeconds || 20;
  var private = applyDefault (optPrivate,true);
  var siloId = (optSiloId || 'CacheHandler'); 
  var cacheCommunity =  applyDefault(optCacheCommunity,'tintin');

  var cache = optSpecificCache || (private ? CacheService.getUserCache() : CacheService.getScriptCache());
  var disableCache = optDisableCache || false;
  
  /**
   * return the cache object for use by other capabilities
   * @return {Cache} the cache object
   */
   self.getCacheObject = function () {
       return cache;
   }
   
  /**
   * CacheHandler.removeCache()
   * @param {object,..} ob data to put to cache
   * @param {object,..} queryOb some objects/text from which to generate a key.
   * @return {void} 
   */
  self.removeCache = function () {
    // this is how i can pass on the variable number of args
    if (!disableCache) {
      var s = self.generateCacheKey.apply (null, Array.prototype.slice.call(arguments));
      cache.remove(s);
    }
  };
  /**
   * CacheHandler.putCache()
   * @param {object} ob data to put to cache
   * @param {object,..} queryOb some objects/text from which to generate a key.
   * @return {string} some one way encrypted version of text
   */
  self.putCache = function (ob) {
    
    if (!disableCache) {
      
      // this is how i can pass on the variable number of args, minus the first one
      var a= Array.prototype.slice.call(arguments);
      a.shift();
      var s = self.generateCacheKey.apply (null, a);
      
      var t = JSON.stringify(ob);
      
      // it will automatically split cache into chunks, if it's going to be too big
      if (t.length > MAXCACHECHUNK) {
        
        // the main cache entry will just contain pointers to the pieces
        var chunkKeys = [],chunk;
        for (var x = 0 ; x < t.length  ; x+= chunk.length) {
          chunk = t.slice (x,x+MAXCACHECHUNK);
          
          try {
            // want to make sure the pieces last longer than the master, so make them slightly longer expiry
            var k = s+x.toString(36);
            chunkKeys.push (k);
            cache.put ( k,chunk,expiry * 1.2);
           
          }
          catch (err) {
            // just silently fail - there'll be no caching this one
            return '';
          }
        }
        // now we need to store pointers to chunks
        t = JSON.stringify ({cacheHandlerChunks:chunkKeys});
      }
      
      // write to cache, either the pointers to the pieces, or the whole thing
      try {
        cache.put ( s,t,expiry);
        return s;
      }
      catch(err) {
        // for now, just doesn't write to cache.
        return '';
      }
    }
    else {
      return '';
    }
  };
  /**
   * CacheHandler.getCache()
   * @param {object,..} queryOb some objects/text from which to generate a key.
   * @return {object} the object
   */
  self.getCache = function () {
    // this is how i can pass on the variable number of args
    var ob = null;
    if (!disableCache) {
     
      // generate key from all arguments to function
      var s = self.generateCacheKey.apply (null, Array.prototype.slice.call(arguments));
      
      // get the cache item
      var o = cache.get (s);
      
      // if there was one
      if (o) {
        
        // it may have been chunked
        var ob = JSON.parse(o);
        if (ob.hasOwnProperty('cacheHandlerChunks')) {
          
          // need to unwind the chunks - the cache entry keys for the pieces will be in the main entry
          var chunks = [];
          
          // get each chunk , and piece it back together again
          // if any failure, then we just return null as if no cache entries were found
          for (var i=0; i < ob.cacheHandlerChunks.length ;i++) {
            try {
              var t = cache.get(ob.cacheHandlerChunks[i]); 
              if (!t) return null;
              chunks.push(t);
            }
            catch(err) {
              return null;
            }
          }
          // if we get this far then we've managed to put cache together again
          var ob = JSON.parse(chunks.join(''));
        }
      }
    }
    return ob;

  };
  /**
   * CacheHandler.generateCacheKey()
   * @param {object,..} queryOb some objects.
   * @return {string} some one way encrypted version of text
   */
  self.generateCacheKey = function () {
    var s = siloId + cacheCommunity;
    for (var i = 0; i < arguments.length; i++) {
      if(arguments[i]) { 
        s+= ((typeof arguments[i]  === "object" ) ? JSON.stringify(arguments[i]) : arguments[i].toString()) + i.toString();
      }
    }

    return Utilities.base64Encode( Utilities.computeDigest( Utilities.DigestAlgorithm.MD2, s));
  };
 /** 
  * check if item is undefined
  * @param {*} item the item to check
  * @return {boolean} whether it is undefined
  **/
  function isUndefined (item) {
    return typeof item === 'undefined';
  }
  
 /** 
  * check if item is undefined
  * @param {*} item the item to check
  * @param {*} defaultValue the default value if undefined
  * @return {*} the value with the default applied
  **/
  function applyDefault (item,defaultValue) {
    return isUndefined(item) ? defaultValue : item;
  } 

  return this;

}