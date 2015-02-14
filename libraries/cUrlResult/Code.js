/** 
 * since I use this all the time,may as well make it a library
 * does UrlFetch() stuff and creates standard results
 */
 
"use strict";  
function getLibraryInfo () {

  return { 
    info: {
      name:'cUrlResult',
      version:'0.0.2',
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
  * @param {function} optChecker for rate limit checking
  * @return {HTTPResponse}
  */
function urlGet (url, optAccessToken,overrideOptions, optChecker) {
  return urlExecute( url , {
    method:"GET",
    muteHttpExceptions:true
  }, optAccessToken , optChecker );
}

/**
* execute a post
* @param {string} url the url
* @param {object} payload the payload
* @param {string} optMethod the method
* @param {string} optAccessToken an optional access token
* @param {string} overrideOptions optional additional options
* @param {function} optChecker for rate limit checking
* @return {HTTPResponse}
*/
function urlPost (url,payload,optMethod,optAccessToken,overrideOptions,optChecker) {
  
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
  return urlExecute( url , options , optAccessToken, overrideOptions,optChecker);
}
  
/**
* execute a urlfetch
* @param {string} url the url
* @param {object} options any additional options
* @param {string} optAccessToken an optional access token
* @param {string} overrideOptions optional additional options
* @param {function} optChecker for rate limit checking
* @return {object} a standard response
*/
function urlExecute (url, options , optAccessToken,overrideOptions,optChecker) {
  var options = options || {};
  options.headers = options.headers || {};
  if (optAccessToken) {
    options.headers.authorization = "Bearer " + optAccessToken;
  }
  
  var finalOptions = cUseful.extend( overrideOptions ? cUseful.clone(overrideOptions) :  {} , options);
  
  // make a standard response object
  var result = cUseful.rateLimitExpBackoff(function() {
    return UrlFetchApp.fetch(url, finalOptions);
  }, undefined ,  undefined, undefined , undefined , optChecker);
  
  return makeResults(result,url);
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
