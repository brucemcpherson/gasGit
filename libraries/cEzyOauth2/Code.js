
 
/**
 * @param {Object} authenticationPackage -- from cloud console - see below
 * @param {string=} optCallback callback when access code is obtained
 * @param {number=200} optTimeout timeout in ms
 * @param {Object=} optArgs any data in this object is passed as arguments to your callback. Flatten objects if more than 1 deep (see http://sites.mcpher.com/share/Home/excelquirks/gassnips/unflatten)
 * @param {boolean=false} optForce whether to force an approval dialog
 * @constructor
 */
function EzyOauth2 (authenticationPackage, optCallback , optTimeout , optArgs , optForce) {

  var self = this;
  
  // this is your authentication package, and looks like this
  //{clientId : "xxx.apps.googleusercontent.com", // from cloud console
  // clientSecret : "xxxxxxxxxxxxxxxxx", // from cloud console
  // scopes : ['https://www.googleapis.com/auth/datastore','https://www.googleapis.com/auth/userinfo.email'] //for example
  // };
  
  // it will be updated with an object like this
  // { access: {
  //    "accessToken":"1/fFAGRNJru1FTz70BzhT3Zg",
  //    "expires":1234567890123,
  //    "refreshToken":"1/xEoDL4iW3cxlI7yDbSRFYNG01kVKM2C-259HOF2aQbI"
  //  }
  // }
  // you can then store the whole thing in your properties store. 
  // if EzyOauth2 finds a refresh token or an unexpired access token, it will use them and avoid the whole oauth2 dance
  
  var authenticationPackage_ = authenticationPackage;
  authenticationPackage_.service = authenticationPackage_.service  || 'google';
    
  // these are the standard oauth Urls for the requested service
  var urlPackage_ =  getImpPackage_(authenticationPackage_.service);
  
  // this is the function you want to be called back post user consent
  var callback_ = optCallback;
 
  // this is specific to this script and is the name of the callback function that deals with getting the access token
  var timeOut_ = optTimeout || 200;
  var scriptPackage_ = {
    callback : callback_,
    timeout:timeOut_,
    redirectUri:'',
    grace:1000 * 60 * 6.5,     // make sure it lasts at least for maximum time a GAS script can run
  };

  // this object contains args will be passed to the callback function
  var withArgs_ = optArgs || {};


  // this is where the access token, and it's result will be stored
  var  accessTokenResult_;
  var force = typeof optForce === 'undefined' ? false : optForce;
  
  // kill the existing package if force was asked for
  if (force) killPackage_();
  
  // first thing to do is to try refreshing the current token, if there is one
  tryRefresh_();

  /**
   * force a refresh and return a new accesstoken
   * @return {string} the access token
   **/
  this.refreshToken = function () {
    tryRefresh_();
    return this.getAccessToken();
  }
  /** 
   * get the last known accesstoken
   * @return {string} the access token
   */
   
  this.getAccessToken = function () {
    return isGoodToGo_() ? authenticationPackage_.access.accessToken : '';
  }
  
  /** 
   * get whether we have a valid access token
   * @memberof EzyOauth2#
   * @return {boolean} we have a valid access token
   */
   
  this.isOk = function () {
    return isGoodToGo_ ();
  }
  /** 
   * this is a mode to show the redirect URI that needs to be authorized in the cloud console
   * @return {string} the access token
   */
  
  this.showRedirect = function () {
    return  createRedirectUri_();
  }
  
  /** 
   * get the HTTPResponse returned when access token attempt was last made
   * @return {HTTPResponse} the response when access token attempt was last made
   */
   
  this.getAccessTokenResult =function () {
    return accessTokenResult_;
  }

  /** 
   * get the user consent
   * @memberof EzyOauth2#
   * @return {string} the url for user consent
   */
   
   this.getUserConsentUrl = function()  {
       return createAuthenticationUrl_ ();
   }

  /** 
   * get the redirecturi
   * @memberof EzyOauth2#
   * @return {string} the url for user consent
   */
   
   this.getRedirectUrl = function()  {
       return  createRedirectUri_ ();
   }
   
  /**
   * should be called back after the authorization process 
   * @param {object} e callback parameters
   * @return {EzyOauth2} self
   */

  this.fetchAccessToken =function (e) {
  
      var e = e || {parameter:{code:'dummy'}};
      var options = {
          method : "POST" ,
          payload : {
              code : e.parameter.code,
              redirect_uri : e.parameter.redirectUri,
              grant_type : "authorization_code"
          },
          muteHttpExceptions : true
      };
      
      // some APIS want to id.secret to be encoded as basic auth
      if (urlPackage_.basic) {
        options.headers = {
           authorization: "Basic " + Utilities.base64Encode(authenticationPackage_.clientId + ":" + authenticationPackage_.clientSecret)
        }
      }
      else {
        options.payload.client_id = authenticationPackage_.clientId;
        options.payload.client_secret = authenticationPackage_.clientSecret;
      }
      
      if (urlPackage_.accept) {
        options.headers = {accept:urlPackage_.accept};
      }
  
      accessTokenResult_ = UrlFetchApp.fetch ( urlPackage_.tokenUrl , options);

      if (accessTokenResult_.getResponseCode() === 200) {
        try {
          var access = JSON.parse (accessTokenResult_.getContentText ());
        }
        catch (error) {
          throw 'received unparseable reponse getting access token ' + accessTokenResult_.getContentText ();
        }
        var aLongTime = 60*60*24*500;
        authenticationPackage_.access = { 
          accessToken: access.access_token, 
          refreshToken: access.refresh_token,
          expires: (access.expires_in ? access.expires_in : aLongTime) * 1000 + new Date().getTime()
        };
      }
      else {
        authenticationPackage_.access = null;
      }

      return self;
  };
  
    
  /**
   * @private
   * refresh the access token from the refresh token if we have one
   * @return {boolean} we refreshed the access token
   */
  function tryRefresh_ () {
    if (!isGoodToGo_()) {
      var refreshToken = getRefreshToken_();
      if (refreshToken) {
        // if we're here then we must have an expired access token - get a new one
        var options = {
            method : "POST" ,
            payload : {
                client_id: authenticationPackage_.clientId,
                client_secret : authenticationPackage_.clientSecret,
                refresh_token : refreshToken,
                grant_type : "refresh_token"
            },
            muteHttpExceptions : false
        };
        
        if (urlPackage_.accept) {
          options.headers = {accept:urlPackage_.accept};
        }
      
        var result = UrlFetchApp.fetch ( urlPackage_.tokenUrl , options);

        if (result.getResponseCode() === 200) {
          var access = JSON.parse (result.getContentText ());
          authenticationPackage_.access = { 
            accessToken: access.access_token, 
            refreshToken: refreshToken,
            expires: access.expires_in * 1000 + new Date().getTime()
          };
          return true;
        }
        else {
          killPackage_();
        }
      }
    }
    return false;
  }
  
  /**
   * @private
   * get whether we have a valid/unexpired access token
   * @return {boolean} we have a valid access token
   */
  function isGoodToGo_ () {
    return isPackageOk_ () && authenticationPackage_.access.accessToken && new Date().getTime()+scriptPackage_.grace < authenticationPackage_.access.expires ;
  }
  
  /**
   * @private
   * get whether we have an access package to test
   * @return {boolean} we have a valid access token
   */
  function isPackageOk_ () {
    return authenticationPackage_ && authenticationPackage_.access;
  }
  
  /**
   * @private
   * get refresh token if we have one
   * @return {boolean} we have a valid access token
   */
  function getRefreshToken_  () {
    return isPackageOk_ () ? authenticationPackage_.access.refreshToken :'' ;
  }
  
  /**
   * @private
   * get refresh token if we have one
   * @return {boolean} we have a valid access token
   */
  function killPackage_  () {
    if (isPackageOk_ ()) {
      authenticationPackage_.access = null;
    }
  }
  
  /**
   * create a redirect Uri derived from the currently invoked macro
   * @private
   * @param {string} [optScriptUrl] if not specified will figure it out dynamically
   * @return {string} the redirect uri
   */
 
  function  createRedirectUri_ (optScriptUrl) {
    
    // note that the redirect URI's created here will need to be inserted into the cloud console
    var url = optScriptUrl || ScriptApp.getService().getUrl();
    // strip off the function specific
    var k = url.lastIndexOf("/");
    if (k !== -1) {
      url = url.slice (0,k);
    }
    return url + "/usercallback";
  }

  /** 
   * create an authentication url including the parameters needed to provoke a callback
   * @private
   * return {string} the constructed url
   */
 
  function createAuthenticationUrl_ () {
  
  
    // setup the redirect Url - we'll want this back as an argument to preserve its value, since a published script seems to call back on a different url
    scriptPackage_.redirectUri =  createRedirectUri_(urlPackage_.redirectUri);
    
    // this statetoken sets up what to call back when this script is re-initiated
    var s = ScriptApp.newStateToken()
      .withMethod(scriptPackage_.callback)
      .withTimeout(scriptPackage_.timeout)
      .withArgument("redirectUri",scriptPackage_.redirectUri );
      
    // add any user arguments
    Object.keys(withArgs_).forEach (function(k) { s.withArgument(k, withArgs_[k]) } );
    
    // generate the text token for the url
    var stateToken = s.createToken();

 
    // these are the parameters needed to peovoke authentication dialog
    var bundle = { 
      response_type: "code",
      client_id: authenticationPackage_.clientId,
      scope: authenticationPackage_.scopes.join(" "),
      state: stateToken,
      access_type: "offline",
      redirect_uri: scriptPackage_.redirectUri
    };
  
    // if this is the first time, we need to force to ensure a refresh token is returned
    if (force || !authenticationPackage_.access) bundle.approval_prompt = "force";
    
    // this is the authentication url
    return urlPackage_.authUrl + "?" + Object.keys(bundle).map(function(d) { return d + '=' + encodeURIComponent(bundle[d]); }).join("&");
  };
  
  /**
   * providers have slightly different implementations of oauth2
   * these packages describe each one
   * @param {string} optServiceName the name
   * @return {string} the package
   */
  function getImpPackage_  (optServiceName) {
    var PACKAGELIST = [
      { name:'google',
          authUrl : "https://accounts.google.com/o/oauth2/auth",
          tokenUrl: "https://accounts.Google.Com/o/oauth2/token",
          refreshUrl: "https://accounts.google.com/o/oauth2/token"  
      },
      { name:'linkedin',
          authUrl : "https://www.linkedin.com/uas/oauth2/authorization",
          tokenUrl: "https://www.linkedin.com/uas/oauth2/accessToken",
          refreshUrl: "https://www.linkedin.com/uas/oauth2/authorization" 
      },
      { name:'soundcloud',
          authUrl : "https://soundcloud.com/connect",
          tokenUrl: "https://api.soundcloud.com/oauth2/token",
          refreshUrl: "https://api.soundcloud.com/oauth2/token" 
      },
      { name:'podio',
          authUrl : "https://podio.com/oauth/authorize",
          tokenUrl: "https://podio.com/oauth/token",
          refreshUrl: "https://podio.com/oauth/token" 
      },
      { name:'shoeboxd',
          authUrl : "https://id.shoeboxed.com/oauth/authorize",
          tokenUrl: "https://id.shoeboxed.com/oauth/token",
          refreshUrl: "https://id.shoeboxed.com/oauth/token" 
      },
      { name:'github',
          authUrl : "https://github.com/login/oauth/authorize",
          tokenUrl: "https://github.com/login/oauth/access_token",
          refreshUrl: "https://github.com/login/oauth/access_token",
          accept: "application/json"
      },
      { name:'reddit',
          authUrl : "https://www.reddit.com/api/v1/authorize",
          tokenUrl: "https://www.reddit.com/api/v1/access_token",
          refreshUrl: "https://www.reddit.com/api/v1/access_token",
          basic:true
      },
      { name:'asana',
         authUrl : "https://app.asana.com/-/oauth_authorize",
         tokenUrl: "https://app.asana.com/-/oauth_token",
         refreshUrl: "https://app.asana.com/-/oauth_token",
      },
      { name:'live',
         authUrl : "https://login.live.com/oauth20_authorize.srf",
         tokenUrl: "https://login.live.com/oauth20_token.srf",
         refreshUrl: "https://login.live.com/oauth20_token.srf",
      }

    ];
    var s = optServiceName || 'google';
    var f = PACKAGELIST.filter(function(d) {
      return s === d.name;
    });
    
    if(f.length !== 1) {
      throw ('could not identify service package '+s);
    }
    
    return f[0];
  
  }

}
