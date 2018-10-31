/**
 * takes care of url fetch stuff, including caching if you want
 * @constructor
 */
 var Curly = function () {

   var self = this, cache_ , token_;
   
   /**
    * set cache 
    * @param {CacheService|null} cache to use
    * @param {number || undefined} [timeoutInSeconds=60] time for cache to live
    * @return {Curly} self
    */
    self.setCache = function (cache,timeoutInSeconds) {
      cache_ =  cache ? new cCacheHandler.CacheHandler(timeoutInSeconds || 60, 'Curly', undefined, false, cache) : undefined;
      return self;
    };
    
   /**
    * set token 
    * @param {string} token the access token to use if needed
    * @return {Curly} self
    */
    self.setToken = function (token) {
      token_ = token;
      return self;
    };
   
   /**
    * execute somethign (defaul get)
    * @param {string} url the url
    * @param {string} optMethod the method
    * @param {object} payload the payload
    * @param {string} overrideOptions optional additional options
    * @param {function} optChecker for rate limit checking
    * @return {CurlResult} standard results package
    */
    self.execute = function (url,optMethod,payload,overrideOptions,optChecker) {
      return urlPost (url,payload,optMethod || "GET",token_,overrideOptions,optChecker,cache_);
    };
    
 
 }
