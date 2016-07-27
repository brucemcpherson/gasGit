/**
* create a goa class
* @constructor
* @param {string} packageName the package name
* @param {PropertyStore} propertyStore the property store
* @param {number} [optTimeout] in seconds
* @param {string} [impersonate] email address to impersonate for service accounts
*/
var Goa = function (packageName, propertyStore, optTimeout , impersonate) {
  'use strict';

  var propertyStore_ = propertyStore, 
      packageName_ = packageName , 
      self = this , 
      phase_, 
      id_ , 
      params_ , 
      callback_, 
      package_, 
      needsConsent_, 
      timeout_ = optTimeout, 
      impersonate_ = impersonate,
      consentScreen_,
      name_,
      onToken_,
      onTokenResult_;
     


  /**
  * the function to call when a token is created
  * @param {string} onTokenFunction the function to call
  * @return {Goa} self
  */
  self.setOnToken = function (onTokenFunction) {
    if (typeof onTokenFunction !== 'function') throw 'ontoken callback must be a function'; 
    onToken_ = onTokenFunction;
    return self;
  }
  /**
  * execute the requested phase
  * @param {string} params the callback params or user params
  * @return {Goa} self
  */
  self.execute  = function (params) {
    
    // store these for later
    params_ = params;

    // the phase & id to execute is in the state token, if it exists
    phase_ = GoaApp.getCustomParameter(params_).goaphase || 'init';
    id_ = GoaApp.getCustomParameter(params_).goaid; 
    name_ = GoaApp.getName(params_);
    
    // load in the package on initialization
    package_ = GoaApp.getPackage (propertyStore_ , packageName_);  
    if (!package_) throw 'cannot find package ' + packageName_ + ' in given property store';
    
    // check we have parameters matching the package 
    if (name_ && name_ !== package_.packageName) throw 'the param name ' + name_ + 
      ' is different than the package name ' + package_.packageName; 
    
    // make sure we dont get into a loop with expiry being less than grace period
    timeout_ = Math.floor(Math.max (GoaApp.gracePeriod /1000 ,
        cUseful.applyDefault(timeout_, GoaApp.getServicePackage(package_).defaultDuration || 0)));
     

    // if we have a token our work is done
    if (self.hasToken() ) {
      return self;
    }
    
    // try to get one.
    GoaApp.start (package_, undefined, impersonate_, timeout_ );
    
    if (GoaApp.hasToken(package_)) {
      self.writePackage();
      
      // if there's a call back then do it.
      execOnToken_();
      
      return self;
    }
    
    // apparently we don't have one, so need to enter a consent flow
    if(!callback_) {
      self.setCallback (cUseful.whereAmI(2).caller);
    }


    // if this is the first time in, we need to signal a consent screen is needed
    if (phase_ === "init") {
        
    // need to store these for later
      id_ = cUseful.generateUniqueString();
      GoaApp.cachePut ( id_ , package_.packageName , params_, onToken_);
      var offline = cUseful.applyDefault(package_.offline, true);
      
      needsConsent_ = consentScreen_ || GoaApp.defaultConsentScreen ( GoaApp.createAuthenticationUri ( 
        package_, {
          callback : callback_,
          timeout: timeout_,
          offline:offline,
          force: true
        }, {
          goaid:id_,
          goaphase:'fetch',
          goaname:package_.packageName
        }) ,GoaApp.createRedirectUri(), package_.packageName, package_.service, offline);

      return self;
    }
    
    // if this is a fetch iteration then we've been called back by a consent requests
    if (phase_ === "fetch") {
      
      var result = GoaApp.fetchAccessToken (package_ , params);
      if (!self.hasToken()) {
        throw 'failed to exchange code for token ' + result.getContentText();
      }
      
      // store it
      self.writePackage ();
      
      // if there's a call back then do it.
      execOnToken_();
      
      return self;
    }

    throw 'unknown phase:' + phase_
  };

  function getCacheContents_() {
    var p = GoaApp.cacheGet (id_);
    if (!p) throw 'cached arguments not found for ' + package_.packageName;
    if (p.name !== package_.packageName) throw 'cache mismatch for ' + p.name + ':should have been ' +  package_.packageName;
    return p;
  }
  /**
   * get parameters for function
   * @return {object} the parameters
   */
  self.getParams = function () {
    return  phase_ === "init" ? params_ : getCacheContents_().args;
  };
  
  /**
   * get ontoken callback
   * @return {object} the callback
   */
  self.getOnToken = function () {
   
    if (phase_ !== "init") {
      var  o =  getCacheContents_().onToken; 
      onToken_ = o ? eval(o)  : undefined;
    }
    return onToken_;   // just return the function to be executed on completion

  };
  

  /**
   * get ontoken result
   * @return {object} the callback
   */
  self.getOnTokenResult = function () {
    return  onTokenResult_;
  };
  
  /**
   * get the consent page
   * @return {HtmlOutput} the consent page
   */
  self.getConsent = function () {
    return HtmlService.createHtmlOutput(needsConsent_);
  };
  
  /**
   * get the consent page
   * @return {boolean} whether consent is needed
   */
  self.needsConsent = function () {
    return needsConsent_ ? true : false ;
  };
  

  
  /**
   * set the callback
   * @param {string} callback callback name
   * @return {Goa} self
   */
  self.setCallback = function (callback) {
    
    // convert the  string into a function
    //var callbackFunction = eval(callback);
    
    // make sure it is a function
    //if (typeof callbackFunction !== 'function' || !callbackFunction.name) throw 'callback must be a named function';    
    //callback_ = callbackFunction;
    callback_ = callback;
    return self;
  };
 
  /**
  * set the callback function for the consent screen
  * it will receive two args - the userconsent url, and the redirect url
  * @param {function} consentCallback user consent callback
  * @return {Goa} self
  */
  self.setConsentScreen = function (consentCallback) {
    consentScreen_ = consentCallback;
    return self;
  };
  /**
   * test for token
   * @param {boolean} check whether to check against infra
   * @return {boolean} there is one or not
   */
  self.hasToken = function (check) {
    return GoaApp.hasToken (package_,check);
  };
  
  /**
   * get token
   * @return {string | undefined} the token
   */
  self.getToken = function () {
    return GoaApp.getToken (package_);
  };
  
   /**
   * get property
   * @param {string} key the key
   * @return {string | undefined} the property value
   */
  self.getProperty = function (key) {
    return GoaApp.getProperty (package_ , key);
  };
  /**
   * get package
   * @return {object | undefined} the package
   */
  self.getPackage = function () {
    return package_ ;
  };
  
  /**
   * write the package
   * @return self
   */
  self.writePackage = function () {
    package_.revised = new Date().getTime();
    GoaApp.setPackage ( propertyStore_ , package_);
    return self;
  };
  
  /**
   * kill the package
   */
  self.kill = function () {
    GoaApp.killPackage(package_);
    return self.writePackage();
  };
  
  /**
   * remove the package
   */
  self.remove = function () {
    return GoaApp.removePackage ( propertyStore_, package_.packageName  );
  };
  
  
  function execOnToken_() {
    var onToken = self.getOnToken();
    onTokenResult_ = onToken ? onToken(self.getToken() , package_.packageName , self.getParams()) : undefined;
  }

  return self;

};
