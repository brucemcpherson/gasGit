/**
* create a goa class
* @constructor
* @param {string} packageName the pockage name
* @param {PropertyStore} propertyStore the property store
* @param {number} [optTimeout] in seconds
* @param {string} [impersonate] email address to impersonate for service accounts
*/
var Goa = function (packageName, propertyStore, optTimeout , impersonate) {

  var _propertyStore = propertyStore, 
      package_name = packageName , 
      self = this , 
      _phase, 
      _id , 
      _params , 
      _callback, 
      _package, 
      _needsConsent, 
      _timeout = optTimeout, 
      _impersonate = impersonate,
      _consentScreen,
      _name,
      _onToken,
      _onTokenResult,
      _uiOpts;
     


  /**
  * the function to call when a token is created
  * @param {string} onTokenFunction the function to call
  * @return {Goa} self
  */
  self.setOnToken = function (onTokenFunction) {
    if (typeof onTokenFunction !== 'function') throw 'ontoken callback must be a function'; 
    _onToken = onTokenFunction;
    return self;
  };
  
  /**
   * any special UI options
   * @param {object} opts
   */
  self.setUiBehavior = function (opts) {
    _uiOpts = opts;
    return self;
  };
  /**
  * execute the requested phase
  * @param {string} params the callback params or user params
  * @return {Goa} self
  */
  self.execute  = function (params) {
    
    // store these for later
    _params = params;

    // the phase & id to execute is in the state token, if it exists
    _phase = GoaApp.getCustomParameter(_params).goaphase || 'init';
    _id = GoaApp.getCustomParameter(_params).goaid; 
    
    // the name 
    _name = GoaApp.getName(_params);
    
    // load in the pockage on initialization
    _package = GoaApp.getPackage (_propertyStore , package_name);  
    if (!_package) throw 'cannot find pockage ' + package_name + ' in given property store';
    
    // check we have parameters matching the pockage 
    if (_name && _name !== _package.packageName) throw 'the param name ' + _name + 
      ' is different than the pockage name ' + _package.packageName; 
    
    // make sure we dont get into a loop with expiry being less than grace period
    _timeout = Math.floor(Math.max (GoaApp.gracePeriod /1000 ,
        Utils.applyDefault(_timeout, GoaApp.getServicePackage(_package).defaultDuration || 0)));
     

    // if we have a token our work is done
    if (self.hasToken() ) {
      return self;
    }
    
    // try to get one.
    GoaApp.start (_package, undefined, _impersonate, _timeout );
    
    if (GoaApp.hasToken(_package)) {
      self.writePackage();
      
      // if there's a call back then do it.
      exec_onToken();
      
      return self;
    }
    
    // apparently we don't have one, so need to enter a consent flow
    // this is able to figure out which function is managing the goa flow
    if(!_callback) {
      // using whereAMI no longer works - so just defaulting to doGet
      self.setCallback ('doGet');
    }

   
    // if this is the first time in, we need to signal a consent screen is needed
    if (_phase === "init") {
        
    // need to store these for later
      _id = Utils.generateUniqueString();
      self.writePackage();

      GoaApp.cachePut ( _id , _package.packageName , _params, _onToken);
      var offline = Utils.applyDefault(_package.offline, true);
      var apack = {
        callback : _callback,
        timeout: _timeout,
        offline:offline,
        force: true
      };
      var bpack =  {
        goaid:_id,
        goaphase:'fetch',
        goaname:_package.packageName
      };

      
      // set up the consent screen
      _needsConsent = (_consentScreen || GoaApp.defaultConsentScreen) ( GoaApp.createAuthenticationUrl ( 
        _package, apack, bpack) ,GoaApp.createRedirectUri(), _package.packageName, _package.service, offline, _uiOpts);

      return self;
    }
    
    // if this is a fetch iteration then we've been called back by a consent requests
    if (_phase === "fetch") {
      
      var result = GoaApp.fetchAccessToken (_package , params);
      if (!self.hasToken()) {
        throw 'Failed to get access token : operation was cancelled';
      }
      
      // store it
      self.writePackage ();
      
      // if there's a call back then do it.
      exec_onToken();
      
      return self;
    }

    throw 'unknown phase:' + _phase
  };

  function getCacheContents_() {
    var p = GoaApp.cacheGet (_id);
    if (!p) throw 'cached arguments not found for ' + _package.packageName;
    if (p.name !== _package.packageName) throw 'cache mismatch for ' + p.name + ':should have been ' +  _package.packageName;
    return p;
  }
  /**
   * get parameters for function
   * @return {object} the parameters
   */
  self.getParams = function () {
    return  _phase === "init" ? _params : getCacheContents_().args;
  };
  
  /**
   * get ontoken callback
   * @return {object} the callback
   */
  self.getOnToken =  () => {
   
    if (_phase !== "init") {
      var  o =  getCacheContents_().onToken; 
      _onToken = o ? eval(o)  : undefined;
    }
    return _onToken;   // just return the function to be executed on completion

  };
  

  /**
   * get ontoken result
   * @return {object} the callback
   */
  self.getOnTokenResult = function () {
    return  _onTokenResult;
  };
  
  /**
   * get the consent page
   * @return {HtmlOutput} the consent page
   */
  self.getConsent = function () {
    return HtmlService.createHtmlOutput(_needsConsent);
  };
  
 
  self.done = function () {
    // set up close message or go away.
    return HtmlService.createHtmlOutput(
      GoaApp.closeWindow(self.hasToken() ,_uiOpts || {
        close:false,
      }));
  };
  
  /**
   * get consent in a sidebar/dialog
   * @param {UI} ui the ui to use
   * @param {object} opts {width:300 , title: "goa oauth2 dialog", type:"SIDEBAR" || "DIALOG" , modal:true }
   */
  self.getConsentUi = function (ui, opts) {

    // clone
    var options = opts ? JSON.parse(JSON.stringify(opts)) : {};
    
    options.type = options.type || "SIDEBAR";
    options.width = options.type === "DIALOG" ? (options.width || 600) : 0;
    options.height = options.type === "DIALOG" ? (options.height || 400) : 0;
    options.title = options.hasOwnProperty("title") ? options.title : ' goa oauth2 dialog for ' + self.getPackage().packageName;
    options.modal = options.hasOwnProperty("modal") ? options.modal : true;
    
    // set up the dialog. consent returns an htmlservice
    var html = self.getConsent()
      .setTitle(options.title);     
      
    
    if (options.height)html.setHeight(options.height);
    if (options.width)html.setWidth(options.width);
    
    // where to do it
    if (options.type === "SIDEBAR") {
      ui.showSidebar (html);
    }
    
    else if (options.type === "DIALOG") {
      ui[options.modal ? 'showModalDialog' : 'showModelessDialog'] (html, options.title);
    }
    
    else {
      throw 'unknown dialog type ' + options.type;
    }
    
    return self;
  }
  
  /**
   * get the consent page
   * @return {boolean} whether consent is needed
   */
  self.needsConsent = function () {
    return _needsConsent ? true : false ;
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
    //_callback = callbackFunction;
    _callback = callback;
    return self;
  };
 
  /**
  * set the callback function for the consent screen
  * it will receive two args - the userconsent url, and the redirect url
  * @param {function} consentCallback user consent callback
  * @return {Goa} self
  */
  self.setConsentScreen = function (consentCallback) {
    _consentScreen = consentCallback;
    return self;
  };
  /**
   * test for token
   * @param {boolean} check whether to check against infra
   * @return {boolean} there is one or not
   */
  self.hasToken = function (check) {
    return GoaApp.hasToken (_package,check);
  };
  
  /**
   * get token
   * @return {string | null} the token
   */
  self.getToken = function () {
    const token = GoaApp.getToken (_package);
    if (token) return token

    // we could try to refresh one
    if (GoaApp.hasRefreshToken(_package)) {
      GoaApp.tryRefresh(_package);
      if (self.hasToken()) {
        self.writePackage()
      } 
      return GoaApp.getToken (_package)
    }
    return null
  };
  
  self.getPropertyStore = () => _propertyStore
  
   /**
   * get property
   * @param {string} key the key
   * @return {string | undefined} the property value
   */
  self.getProperty = function (key) {
    return GoaApp.getProperty (_package , key);
  };
  /**
   * get pockage
   * @return {object | undefined} the pockage
   */
  self.getPackage = function () {
    return _package ;
  };
  
  /**
   * fetch pockage
   * @return {object | null} the package
   */
  self.fetchPackage = () => {
    return _package ? {..._package} : null
  }
  /**
   * write the pockage
   * @return self
   */
  self.writePackage = function () {
    _package.revised = new Date().getTime();
    GoaApp.setPackage ( _propertyStore , _package);
    return self;
  };
  
  /**
   * update the package
   */
  self.updatePackage = (pockage) => {
    _package = pockage
    self.writePackage()
    return self
  }
  /**
   * kill the pockage
   */
  self.kill = function () {
    GoaApp.killPackage(_package);
    return self.writePackage();
  };
  
  /**
   * remove the pockage
   */
  self.remove = function () {
    return GoaApp.removePackage ( _propertyStore, _package.packageName  );
  };
  
  
  function exec_onToken() {
    var onToken = self.getOnToken();
    _onTokenResult = onToken ? onToken(self.getToken() , _package.packageName , self.getParams()) : undefined;
  }

  return self;

};

 