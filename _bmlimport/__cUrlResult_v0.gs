//--project:1NtAiJulZM4DssyN0HcK2XXTnykN_Ir2ee2pXV-CT367nKbdbTvRX4pTM (cUrlResult) version:latest
//  imported by bmImportLibraries at Sun, 06 Mar 2022 16:14:19 GMT
function __cUrlResult_v0 () {
  
  //---Inlined Instance of library 1U6j9t_3ONTbhTCvhjwANMcEXeHXr4shgzTG0ZrRnDYLcFl3_IH2b2eAY(cCacheHandler version 20)
  const cCacheHandler = __bmlimporter_gets.__cCacheHandler_v20
  
  //---Inlined Instance of library 1EbLSESpiGkI3PYmJqWh3-rmLkYKAtCNPi1L2YCtMgo2Ut8xMThfJ41Ex(cUseful version 130)
  const cUseful = __bmlimporter_gets.__cUseful_v130
  //--script file:Code
  /** 
   * since I use this all the time,may as well make it a library
   * does UrlFetch() stuff and creates standard results
   */
   
  "use strict";  
  function getLibraryInfo () {
  
    return { 
      info: {
        name:'cUrlResult',
        version:'0.1.5',
        key:'M59PE-C_VqcthwNDmXB9gsCz3TLx7pV4j',
        description:'urlfetch utilities',
        share:'https://script.google.com/d/1NtAiJulZM4DssyN0HcK2XXTnykN_Ir2ee2pXV-CT367nKbdbTvRX4pTM/edit?usp=sharing'
      },
      dependencies:[
        cUseful.getLibraryInfo()
      ]
    }; 
  }
   
  /**
    * execute a get
    * @param {string} url the url
    * @param {string} optAccessToken an optional access token
    * @param {string} overrideOptions optional additional options
    * @param {function} optLookahead for rate limit checking
    * @param {cCacheHandler} optCache cachehandler to use 
    * @return {HTTPResponse}
    */
  
  function urlGet (url, optAccessToken,overrideOptions, optLookahead,optCache) {
    return urlExecute( url , {
      method:"GET",
      muteHttpExceptions:true
    }, optAccessToken , overrideOptions, optLookahead,optCache );
  }
  
  
  /**
  * execute a post
  * @param {string} url the url
  * @param {object} payload the payload
  * @param {string} optMethod the method
  * @param {string} optAccessToken an optional access token
  * @param {string} overrideOptions optional additional options
  * @param {function} optLookahead for rate limit checking
  * @param {cCacheHandler} optCache cachehandler to use 
  * @return {HTTPResponse}
  */
  function urlPost (url,payload,optMethod,optAccessToken,overrideOptions,optLookahead,optCache) {
    
    var options = {};
    options.method = optMethod || "POST",
    options.muteHttpExceptions = true;
    
    if (payload) {
      if(cUseful.isObject(payload)) {
        options.contentType = "application/json";
        options.payload = JSON.stringify(payload);
      }
      else {
        options.payload = payload;
      }
    }
    return urlExecute( url , options , optAccessToken, overrideOptions,optLookahead,optCache);
  }
    
  /**
  * execute a urlfetch
  * @param {string} url the url
  * @param {object} options any additional options
  * @param {string} optAccessToken an optional access token
  * @param {string} overrideOptions optional additional options
  * @param {function} optLookahead for rate limit checking
  * @param {cCacheHandler} optCache cachehandler to use 
  * @return {object} a standard response
  */
  function urlExecute (url, options , optAccessToken,overrideOptions,optLookahead,optCache) {
  
    var options = options || {};
    options.headers = options.headers || {};
    if (optAccessToken) {
      options.headers.authorization = "Bearer " + optAccessToken;
    }
    
    var finalOptions = cUseful.extend( overrideOptions ? cUseful.clone(overrideOptions) :  {} , options);
    
    
    // whether to cache this 
    var cache = finalOptions.method === "GET" && optCache ? optCache : undefined;
      
    // if this is caching then try there first
    if (cache) {
      var result = cache.getCache (url,finalOptions);
      if (result) { 
        result.fromCache = true;
        return result;
      }  
    }
    
    // make a standard response object
    var result = cUseful.Utils.expBackoff(function() {
      return UrlFetchApp.fetch(url, finalOptions);
    }, {
      lookahead:optLookahead
    });
    
    // write it to cache if using
    var mr = makeResults(result,url);
    if(optCache && finalOptions.method === "GET") {
      cache.putCache (mr,url,finalOptions)
    }
    
    return mr;
  }
    
  /**
  * this is a standard result object to simply error checking etc.
  * @param {HTTPResponse} response the response from UrlFetchApp
  / @param {string} optUrl the url if given
  * @return {object} the result object
  */
  function makeResults (response,optUrl) {
    
    var result = {
      success:false,
      data:null,
      code:null,
      url:optUrl,
      extended:'',
      parsed:false
    };
    
    // process the result
    if (response) {
      
      result.code = response.getResponseCode();
      result.headers = response.getAllHeaders();
      result.content = response.getContentText();
     
      result.success = (result.code === 200 || result.code === 201);
      
      try {
        if(result.content) { 
          result.data = JSON.parse(result.content);
          result.parsed = true;
        }
      }
      catch(err) {
        result.extended = err;  
      }
    }
    
    return result;
    
  };
  
//--end:Code

//--script file:Curly
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
  
//--end:Curly

  return {
    getLibraryInfo,
    urlGet,
    urlPost,
    urlExecute,
    makeResults,
    Curly
  }
}
//--end project:cUrlResult