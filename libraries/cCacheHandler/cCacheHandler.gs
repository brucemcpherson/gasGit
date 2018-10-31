// this will handle cache requests
// key feature is that it generates some key based on a some series of objects you pass to identify it
function getLibraryInfo () {
  return {
    info: {
      name:'cCacheHandler',
      version:'2.3.0',
      key:'M3reA5eBxtwxSqCEgPywb9ai_d-phDA33',
      description:'cache handler library',
      share:'https://script.google.com/d/1U6j9t_3ONTbhTCvhjwANMcEXeHXr4shgzTG0ZrRnDYLcFl3_IH2b2eAY/edit?usp=sharing'
    },
    dependencies:[]
  }; 
}

var MAXCACHECHUNK = 96000;
var MAXPROPCHUNK = 8800;

/**
 * CacheHandler
 * @param {number} optSeconds some number of seconds for the cache to last
 * @param {string} optSiloId some string to differentiate this CacheHandler instance
 * @param {boolean} [optPrivate=true] if this is a private cache
 * @param {boolean} optDisableCache whether or not to disable all caching
 * @param {Cache||PropertyService} optSpecificCache - can take a specific cache
 * @param {string} optCacheCommunity - an id for siloing cache into groups
 * @return {CacheHandler} self
 */
function CacheHandler (optSeconds,optSiloId,optPrivate,optDisableCache,optSpecificCache,optCacheCommunity) {

  var self = this;
  var expiry = optSeconds || 20;
  var private = applyDefault (optPrivate,true);
  var siloId = (optSiloId || 'CacheHandler'); 
  var cacheCommunity =  applyDefault(optCacheCommunity,'tintin');

  var usingProperties = optSpecificCache && optSpecificCache.getProperty ? true : false;
  var cache,maxChunk;
  if (!usingProperties) {
    cache = optSpecificCache || (private ? CacheService.getUserCache() : CacheService.getScriptCache());
    maxChunk = MAXCACHECHUNK;
  }
  else {
    cache = optSpecificCache;
    maxChunk = MAXPROPCHUNK;
  }
  var disableCache = optDisableCache || false;

  
  /**
   * clean all expired items from property store
   */
  self.propertyHousekeeping = function () {
    if (!usingProperties) throw 'you must provide a property store to clean up';
    
    var props = cache.getProperties();
    Object.keys(props).forEach(function(k) {
      var o = JSON.parse(props[k]);
      if (o.hasOwnProperty('handlerExpiry') && o.handlerExpiry <= new Date().getTime() ) {
        cUseful.rateLimitExpBackoff(function() {
          cache.deleteProperty(k);
        });
      }
    });
    
  }
  /**
   * return the cache object for use by other capabilities
   * @return {Cache} the cache object
   */
   self.getCacheObject = function () {
       return cache;
   };
   
  /**
   * is it ausing properties as cache
   * @return {boolean} is it?
   */
  self.isProperties = function() {
    return usingProperties;
  };
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
      if (usingProperties) {
        cUseful.rateLimitExpBackoff(function() {
          cache.deleteProperty(s);
        });
      }
      else {
        cache.remove(s);
      }
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
      if (t.length > maxChunk) {
      
        // will be needed if using properties
        var chunkExpiry = new Date().getTime() + 1.2 * 1000 * expiry;
      
      // the main cache entry will just contain pointers to the pieces
        var chunkKeys = [],chunk;
        for (var x = 0 ; x < t.length  ; x+= chunk.length) {
          chunk = t.slice (x,x+maxChunk);
          
          try {
            // want to make sure the pieces last longer than the master, so make them slightly longer expiry
            var k = s+x.toString(36);
            chunkKeys.push (k);
            if (usingProperties) {
              var o = cUseful.rateLimitExpBackoff(function() {
                return cache.setProperty(k,JSON.stringify({handlerExpiry:chunkExpiry,ob:chunk}));
              });
            }
            else {
              var o =  cache.put ( k,chunk,Math.min(60*6*60,expiry * 1.2));
            }

          }
          catch (err) {
            // just silently fail - there'll be no caching this one
            return '';
          }
        }
        // now we need to store pointers to chunks
        ob = {cacheHandlerChunks:chunkKeys};
      }
      
      // write to cache, either the pointers to the pieces, or the whole thing
      try {
        if (usingProperties) {
          cUseful.rateLimitExpBackoff(function() {
            return cache.setProperty(s,JSON.stringify({ob:ob, handlerExpiry: expiry*1000 + new Date().getTime()}));
          });
        }
        else {
          cache.put (s, JSON.stringify(ob),expiry);
        }
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
    var ob;
    if (!disableCache) {
     
      // generate key from all arguments to function & get item
      var s = self.generateCacheKey.apply (null, Array.prototype.slice.call(arguments));
      
      if(usingProperties) {
        // we have to check for expiry and strip off expiry field
        var t = cUseful.rateLimitExpBackoff(function() {
          return cache.getProperty(s);
        });
        
        if (t) {
          var p = JSON.parse(t);
          ob = p.handlerExpiry > new Date().getTime() ? p.ob : null;
        }
      }
      else {
        // expiry is handled by cache service

        var t =  cache.get (s);
        
        if (t) {
          ob = JSON.parse(t);
        }
      }

      // if there was one
      if (ob) {
        
        // it may have been chunked

        if (ob.hasOwnProperty('cacheHandlerChunks')) {

          // need to unwind the chunks - the cache entry keys for the pieces will be in the main entry

          // get each chunk , and piece it back together again
          // if any failure, then we just return null as if no cache entries were found
          var fail;
          var chunks = ob.cacheHandlerChunks.map(function(d) {
            try {
              if (usingProperties) {
                var t = cUseful.rateLimitExpBackoff(function() {
                  return cache.getProperty(d);
                });
                if (t) {
                  var p = JSON.parse(t);
                  return p.ob;
                }
              }
              else {
                var p = cache.get(d);
                fail = fail || !p;
                return p;
              }
            }
            catch(err) {
                fail = true;
            }
          });

          // if we get this far then we've managed to put cache together again
          var ob = fail ?  null: JSON.parse(chunks.join(''))  ;
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