"use strict";
/** 
 * ONCE YOU GAVE RUN ONE TIME SETUP AND CONFIGURED THE CLOUD CONSOLE AND GITHUB YOU CAN RUN THIS
 * IT WILL SET UP YOUR PROPERTIES WITH AUTOMATED OAUTH2
 * YOU NEED TO PUBLISH AND RUN ONCE with ?package=script and again with ?package=gasgit
 * YOU WONT NEED THIS AGAIN UNLESS YOU CHANGE CREDENTIALS
 * YOU DONT NEED TO TOUCH THIS
 *
 * this is your web app
 * @param {object} webapp param object
 * return {HtmlOutput} 
 */

function doGet (e) {
  e = e || {parameter:{}} ;
  e.parameter.package =  e.parameter.package || 'script';
  
// pattern for drive sdk
  if (e.parameter.package === "script") {
    return doGetPattern(e, constructConsentScreen, doSomething, 'script') ;
  }
  else {
// pattern for github
    return doGetPattern(e, constructConsentScreenGit, doSomething, 'gasgit') ;
  }
}

/**
 * tailor your consent screen with an html template
 * @param {string} consentUrl the url to click to provide user consent
 * @param {string} redirectUrl the url that redirect will happen on
 * @return {string} the html for the consent screen
 */
function constructConsentScreen (consentUrl,redirectUrl) {
  return '<p>Redirect URI to be added to cloud console is ' + 
    redirectUrl + 
    '</p><a href = "' + 
    consentUrl + 
    '">Click to authenticate to drive access to script</a> ' + 
    '<br>If you dont get prompted for offline auth- you may need to run it again';
}

/**
 * tailor your consent screen with an html template
 * @param {string} consentUrl the url to click to provide user consent
 * @param {string} redirectUrl the url that redirect will happen on
 * @return {string} the html for the consent screen
 */
function constructConsentScreenGit (consentUrl,redirectUrl) {
  return '<p>Redirect URI to be added to git application is ' + 
    redirectUrl + 
    '</p><a href = "' + 
    consentUrl + 
    '">Click to authenticate to drive access to github</a> ' + 
    '<br>';
}

/**
 * this is your main processing - will be called with your access token
 * @param {string} accessToken - the accessToken
 */
function doSomething (accessToken) {
 
   var options = {
     method: "GET",
     headers: {
       authorization: "Bearer " + accessToken
     }
   };

  return HtmlService.createHtmlOutput (' it worked');

}

/**
 * gets the property key against which you want the authentication package stored
 * @param {string} optPackageName
 * @return {string}
 */
function getPropertyKey_ (optPackageName) {
  
  return "EzyOauth2" + (optPackageName ? '_' + optPackageName : 'Auth');
}


