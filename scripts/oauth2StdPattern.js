"use strict";

/* THIS IS THE STANDARD PATTERN FOIR AUTOMATED OAUTH"
 * YOU DONT NEED TO TOUCH THIS
 *
 * patterns you can reuse for writing apps needing oAuth2
 * just copy the whole thing to your project 
 * for first time running seee oneTimeSet to load your credentials to your property store
 * you shouldn't need to modify any of this
 */

"use strict";
/**
 * gets the property key against which the authentication package will be stored
 * @param {string} optPackageName
 * @return {object} authentication package
 */
function getAuthenticationPackage_ (optPackageName) {
  var p = PropertiesService.getScriptProperties().getProperty(getPropertyKey_ (optPackageName));
  if (p) { 
    p.packageName = optPackageName || '';
  }
  return p ? JSON.parse(p) : null;
}

/**
 * set your authentication package back to your property service
 * this will make the access token and refresh token available next time it runs 
 * @param {object} authentication package to set
 * @return {void}
 */
function setAuthenticationPackage_ (package) {
  PropertiesService.getScriptProperties().setProperty(getPropertyKey_ (package.packageName), JSON.stringify(package));
}

/** 
 * this will be the first call back, you now need to get the access token
 * @param {object} e arguments as setup by the statetokenbuilder
 * @param {function} theWork that will be called with the access token as an argumment
 * @return {*} the result of the call to func()
 */
function getAccessTokenCallback(e) {

  // this will fetch the access token
  var authenticationPackage = getAuthenticationPackage_ (e.parameter.package_name);
  var eo = new cEzyOauth2.EzyOauth2 (authenticationPackage).fetchAccessToken(e);
  
  if (!eo.isOk()) {
    //throw ('failed to get access token:'+eo.getAccessTokenResult().getContentText());
    return HtmlService.createHtmlOutput ( eo.getAccessTokenResult().getContentText() );
  }
  else {
    // should save the updated properties for next time
    setAuthenticationPackage_ (authenticationPackage);
    return e.parameter.work ? evalWork(e.parameter.work) : null;
  }
      
  function evalWork (func) {
    return eval (func +'("' +eo.getAccessToken() +'")');
  }
}

/**
 * gets called by doGet
 * @param {object} the doGet() parameters
 * @param {function} consentScreen - will be called with the consent Url as a an argument if required
 * @param {function} doSomething - the function that actually does your work
 * @param {function} optPackageName - optional package name to identify the oauth2 package to use
 * @return {*} whatever doSomething returns
 */ 
function doGetPattern(e, consentScreen, theWork,optPackageName, optArgs) {
  // set up authentication
  var packageName = optPackageName || '';
  var authenticationPackage = getAuthenticationPackage_ (packageName);
  if (!authenticationPackage) {
    throw "You need to set up your credentials one time";
  }

  var eo = new cEzyOauth2.EzyOauth2 ( authenticationPackage, "getAccessTokenCallback", undefined, {work:theWork.name,package_name:packageName} );
  
  // eo will have checked for an unexpired access code, or got a new one with a refresh code if it was possible, and we'll already have it
  if (eo.isOk()) {
    // should save the updated properties for next time
    setAuthenticationPackage_ (authenticationPackage);
    // good to do whatever we're here to do
    return theWork (eo.getAccessToken(),optArgs);
  }
  
  else {

    // start off the oauth2 dance - you'll want to pretty this up probably
      return HtmlService.createHtmlOutput ( consentScreen(eo.getUserConsentUrl(),eo.getRedirectUrl()) );
  }
}

/**
 * once you have done the one time doGet() process you can retrieve an access token like this
 * @return {string} an accessToken
 */
function getAccessToken(package) {
  return doGetPattern({} , constructConsentScreen, function (token) { return token; },package);
}