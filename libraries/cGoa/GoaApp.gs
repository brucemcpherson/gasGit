// just a shortcut
function make (packageName , propertyStore , e, optTimeout, impersonate) {
  return GoaApp.createGoa (packageName , propertyStore , optTimeout, impersonate).execute(e);
};
/**
 * helpers for Goa oauth2 class
 * @namespace GoaApp
 */
var GoaApp = (function (goaApp) {
  'use strict';

  // cred names are prefixed by this in store
  var KEY_PREFIX = 'EzyOauth2_';

  // a token needs at least this time left to be able to be used (max time a script can run)
  goaApp.gracePeriod = 1000 * 60 * 7;
  
  

  /**
  * create a goa class
  * @param {string} packageName the package name
  * @param {PropertyStore} propertyStore the property store
  * @param {number} [optTimeout] in seconds
  * @param {string} [impersonate] email address to impersonate for service accounts
  */
  goaApp.createGoa = function (packageName, propertyStore, optTimeout , impersonate) {
    if (!packageName) throw 'package name must be provided';
    if (!propertyStore || !cUseful.isObject(propertyStore) || !propertyStore.setProperty) throw 'propertystore must be a PropertiesService store';
    if (optTimeout && typeof optTimeout !== 'number') throw 'timeout must be number of seconds';
    if (impersonate && !cUseful.isEmail (impersonate)) throw 'impersonate should be an email address, not  ' + impersonate;
    return new Goa (packageName, propertyStore, optTimeout , impersonate);
  };
  
  /**
   * start the oauth flow
   * @param {object} package the package 
   * @param {boolean} [optForce=false] whether to force a dialog
   * @param {string} [impersonate] impersonate email address
   * @param {number} timeout in secs
   * @return {object} package the updated package
   */
  goaApp.start = function (package , optForce ,impersonate, timeout) {
  
    var force = cUseful.applyDefault (optForce , false);
    
    // kill the existing package if force was asked for
    if (force) goaApp.killPackage (package);
    
    // if havent already got one that will do
    if (!goaApp.hasToken(package,true)) {

      // if its a service account, its a simple one shot jwt
      if (goaApp.isServiceAccountType(package)) {
        var result = goaApp.jwt.makeTokenRequest (package , impersonate ,timeout);
        
        // we got something
        if (result && result.content) {
          if (result.content.access_token) {
            package.access = {
              accessToken:result.content.access_token,
              expires: result.content.expires_in * 1000 + new Date().getTime()
            }
          }
        }
        // something happened
        if (!goaApp.hasToken(package)) throw 'failed to get service account token:' + JSON.stringify(result.content);
         
      }
      
      // maybe its a firebase token
      else if (goaApp.isJwtType(package)) {
        var ft = JWT.generateJWT ( goaApp.getProperty(package,'data') , package.clientSecret );
        if (ft) {
          // make it last 24 hours
          package.access = {
            accessToken:ft,
            expires: new Date().getTime() + 60*1000*60*24
          }
        }
        else {
          throw 'failed to get jwt token';
        }
      }
      
      // maybe its a client credentials one
      else if (goaApp.isCredentialType (package)) {
        var result = goaApp.credential.makeTokenRequest (package  ,timeout);
        
        // we got something
        if (result && result.content) {
          if (result.content.access_token) {
            package.access = {
              accessToken:result.content.access_token,
              expires: result.content.expires_in * 1000 + new Date().getTime()
            }
          }
        }
        // something happened
        if (!goaApp.hasToken(package)) throw 'failed to get service account token:' + JSON.stringify(result.content);
      }
      
      
      // maybe we can refresh one
      else if ( goaApp.hasRefreshToken(package) ) {
        var result = goaApp.tryRefresh (package);
        if (!goaApp.hasToken(package)) {
          Logger.log('failed to exchange refresh token for access token(ok if this app has been recently revoked)' + result.getContentText());
        }
      }
      
      // will expire soon and refresh not available
      else {
        if (package && package.packageName && package.access && package.access.expires) {
          Logger.log ("Goa-warning:" + package.packageName + " doesn't support token refresh and expires in " + Math.round((new Date().getTime() - package.access.expires)/1000) + " seconds");
        }
      }
    }
    
    return package;
    
  }
  
    
  /**
   * get the private parameter from the state token
   * @return {object} the state token custom parameter property
   */
  goaApp.getCustomParameter = function (params) {
    return params && params.parameter && params.parameter ? params.parameter : {};
  };
  
  /**
  * get the package name from the state token
  * @return {object} the state token custom parameter property
  */
  goaApp.getName = function (params) {
   return GoaApp.getCustomParameter(params).goaname;
  };
  
  /**
   * get the params from cache
   * @param {object} propertyStore where to find it
   * @param {string} packageName the package name
   * @return {object}  the authentication package
   */
  goaApp.getPackage = function (propertyStore, packageName) {
    var p = cUseful.rateLimitExpBackoff( function () { 
      return propertyStore.getProperty(goaApp.getPropertyKey(packageName));
    });
    return p ? JSON.parse(p) : null;
  };
  
  /**
   * remove params from cache
   * @param {object} propertyStore where to find it
   * @param {string} packageName the package name
   */
  goaApp.removePackage = function (propertyStore, packageName) {
  
    var p = cUseful.rateLimitExpBackoff( function () { 
      return propertyStore.deleteProperty(goaApp.getPropertyKey(packageName));
    });
  };
  
    /**
  * creates a package from a file for a service account
  * @param {Drive-App} dap the drive-app
  * @param {object} package info on how to populate the package
  * @return {object}  the authentication package
  */
  goaApp.createPackageFromFile = function (dap , package) {
  
    // first check that the service is known and it's for a service account
    if (goaApp.isServiceAccountType(package)){ 
      throw 'service type for ' + package.service + ' should be a web account';
    }
    
    // now get the json key data
    var file = dap.getFileById(package.fileId);
    if (!file) throw 'couldnt open file:' + package.fileId;
    
    // the file content
    var content = cUseful.rateLimitExpBackoff(function () { 
      return JSON.parse (file.getBlob().getDataAsString() );
    });
    
    
    // check its good
    if (!content.web || !content.web.client_id || !content.web.client_secret) {
      throw 'this is not a credentials file downloaded from the developers console'
    }
    
    var p = cUseful.clone(package);
    p.clientId = content.web.client_id;
    p.clientSecret = content.web.client_secret;
    return p;

  };
  
  /**
   * set the authentication package
   * @param {object} propertyStore where to find it
   * @param {object} package the authentication package
   * @return {object}  the authentication package
   */
  goaApp.setPackage = function (propertyStore, package) {
   
    // check a few things - this fail if unknown type
    var sp = goaApp.getServicePackage (package);
    
    // check we have a name
    if (!package.packageName) throw 'package must have a name';
    
    cUseful.rateLimitExpBackoff( function () { 
      return propertyStore.setProperty(goaApp.getPropertyKey(package.packageName) , JSON.stringify (package)); 
    });
    return package;
  };
  
  /**
  * creates a package from a file for a service account
  * @param {object} package the authentication package
  * @return {boolean}  whether its a service account
  */
  goaApp.isServiceAccountType = function (package) {
    var servicePackage = goaApp.getServicePackage ( package);
    return servicePackage.accountType === 'serviceaccount';
  };
  
 /**
  * creates a package from a file for a jwt firebase account
  * @param {object} package the authentication package
  * @return {boolean}  whether its a jwt account
  */
  goaApp.isJwtType = function (package) {
    var servicePackage = goaApp.getServicePackage ( package);
    return servicePackage.accountType === 'firebase';
  };
  
   /**
  * creates a package from a file for a credentials grant type
  * @param {object} package the authentication package
  * @return {boolean}  whether its a jwt account
  */
  goaApp.isCredentialType = function (package) {
    var servicePackage = goaApp.getServicePackage ( package);
    return servicePackage.accountType === 'credential';
  };

  /**
  * creates a package from a file for a service account
  * @param {Drive-App} dap the drive-app
  * @param {object} package info on how to populate the package
  * @return {object}  the authentication package
  */
  goaApp.createServiceAccount = function (dap , package) {
  
    // first check that the service is known and it's for a service account
    if (!goaApp.isServiceAccountType(package))throw 'service type for ' + package.service + ' should be serviceaccount';
    
    // now get the json key data
    var file = dap.getFileById(package.fileId);
    if (!file) throw 'couldnt open file:' + package.fileId;
    
    // merge with existing package
    return Object.keys(package).reduce (function (p,c) {
      p[c] = package[c];
      return p;
    } , cUseful.rateLimitExpBackoff(function () { 
      return JSON.parse (file.getBlob().getDataAsString() );
    }));
  };
                             

  
 /**
  * gets the property key against which you want the authentication package stored
  * @param {string} packageName the package name
  * @return {string} the key for this package
  */
  goaApp.getPropertyKey = function (packageName) {
    return KEY_PREFIX + packageName;
  };
  
  /**
   * gets the accesstoken
   * @param {object} package the authentication package
   * @return {string | undefined} the accesstoken
   */
  goaApp.getToken = function (package) {
    return goaApp.hasToken(package) ? package.access.accessToken : undefined;
  };
  
  /**
   * gets an arbirary property stored in a goa packages
   * @param {object} package the authentication package
   * @param {string} key the property key
   * @return {string | undefined} the accesstoken
   */
  goaApp.getProperty = function (package,key) {
    return package[key];
  };
  
  /**
   * checks if access token is available and valid
   * @param {object} package the authentication package
   * @param {boolean} check whether to check it against google oauth2 infra
   * @return {boolean} whether a viable token is present
   */
  goaApp.hasToken = function (package,check) {

    //for now, lets always check.. maybe remove this later
    check = true;
    
    // first step, make sure we have a likable token
    var ok = (goaApp.hasFlow(package) && 
      package.access.accessToken && 
      (new Date().getTime() + goaApp.gracePeriod < package.access.expires)) ? true : false;  

    // next step.. if asked, check against google infra if its possible

    if (check && ok) {

      var servicePackage = goaApp.getServicePackage (package);

      if (servicePackage.checkUrl) {

        var checked = checkToken_(servicePackage.checkUrl + package.access.accessToken);
        ok = checked.ok;

        if(!ok) {
          // need to get rid of this token
          package.access.accessToken = "";

        }
      }
    }

    
    return ok;
  };
  
  // checks the token 
  function checkToken_ (url) {
    var response = UrlFetchApp.fetch(
      url, {muteHttpExceptions:true});
    try {
      var result = JSON.parse(response.getContentText());
      return {
        ok:result.error ? false : true,
        info:result
      }
    }
    catch(err) {
      return{ ok:false,info:{error_description:'parse error', error:err , data: response.getContentText()}};
    }
  }
  
  /** 
   * checks that we have an access flow package at all
   * @param {object} package the authentication package
   * @return {boolean} whether it has an access object
   */
  goaApp.hasFlow = function (package) {
    return package && package.access ? true : false;
  };
  
  /**
   * gets the refresh token
   * @param {object} package the authentication package
   * @return {string | undefined} the refresh token
   */
  goaApp.getRefreshToken = function (package) {
    return goaApp.hasRefreshToken(package) ? package.access.refreshToken : undefined;
  };
  
  /**
   * checks if refresh token is available 
   * @param {object} package the authentication package
   * @return {boolean} whether a viable refresh token is present
   */
  goaApp.hasRefreshToken = function (package) {
    return goaApp.hasFlow(package) && package.access.refreshToken ? true : false;
  };
  
  /**
   * gets the service package
   * @param {object} package the authentication package
   * @return the service package
   */
  goaApp.getServicePackage = function (package) {
    var p = Service.package[package.service];
    
    // support custom service
    if (!p && package.service === "custom") {
     if (typeof package.serviceParameters !== typeof {}) {
        throw 'custom service needs a serviceParameters object as a property';
     }
     p = package.serviceParameters;
    }
    if (!p) throw 'service provider ' + package.service + ' is not known';
    return p;
  };

  /**
   * creates authentication uri
   * @param {object} package the authentication package
   * @param {object} scriptPackage the script package
   * @param {[*]} [withArgs] any user args to be preserved
   * @param {boolean} force whether to force authentication (this is needed to provoke a refresh token 1st time)
   * @return {string} the authentication url
   */
  goaApp.createAuthenticationUri = function (package, scriptPackage,withArgs,force) {
    
    var servicePackage = goaApp.getServicePackage (package);
    // setup the redirect Url - we'll want this back as an argument to preserve its value for servthe callback
    scriptPackage.redirectUri =  goaApp.createRedirectUri(servicePackage.redirectUri);
    
    // this statetoken sets up what to call back when this script is re-initiated
    var s = ScriptApp.newStateToken()
      .withMethod(scriptPackage.callback)
      .withTimeout(scriptPackage.timeout)
      .withArgument("redirectUri",scriptPackage.redirectUri);
    
    // add any user arguments
    if(withArgs){ 
      Object.keys(withArgs).forEach (function(k) { s.withArgument(k, withArgs[k]) } );
    }
    
    // generate the text token for the url
    var stateToken = s.createToken();
 
    // these are the parameters needed to provoke authentication dialog
    var bundle = { 
      response_type: "code",
      client_id: package.clientId,
      scope: package.scopes.join(" "),
      state: stateToken,
      redirect_uri: scriptPackage.redirectUri
    };

    // if this token is allowed for offline use
    // eg reddit uses duration:permamnent to get a refresh token
    bundle.access_type = "online";
    
    if(scriptPackage.offline) { 
      if (!servicePackage.duration) {
        bundle.access_type= "offline";
      }
      else {
        bundle.duration= servicePackage.duration;
      }
    }
    
    // whether to force approval prompt
    if(scriptPackage.force) { 
      bundle.approval_prompt = "force";
    }


    // this is the authentication url
    return goaApp.getServicePackage(package).authUrl + 
      "?" + Object.keys(bundle).map(function(d) { return d + '=' + encodeURIComponent(bundle[d]); }).join("&");
    
  };
  
  /**
   * creates redirect uri
   * @return {string} the redirect url
   */
  goaApp.createRedirectUri = function () {
    return 'https://script.google.com/macros/d/' + ScriptApp.getScriptId() + '/usercallback'
  };
  
 
  /**
   * try to refresh the access token from the refresh token if we have one
   * @param {object} package the authentication package
   * @return {HttpResponse | undefined} the http response from a refresh, or undefined if it didnt happen
   */
  goaApp.tryRefresh = function (package) {
    
    
    // if we have enough info to refresh a token
    if (goaApp.hasRefreshToken(package)) {

      var refreshToken = goaApp.getRefreshToken(package);
      
      //try to exchange it for an access token
      var options = {
        method : "POST" ,
        payload : {
          refresh_token : refreshToken,
          grant_type : "refresh_token"
        },
        muteHttpExceptions : true
      };
      
      // get the service info
      var servicePackage = goaApp.getServicePackage(package);
      
      // try to refresh
      var result = setResult_ ( package , cUseful.rateLimitExpBackoff (function () { 
        return UrlFetchApp.fetch ( servicePackage.tokenUrl , setOptions_ (package, servicePackage , options)); 
      }));
     
      // reuse the original refresh token as we dont get a new one
      if (goaApp.hasToken(package)) { 
        package.access.refreshToken = refreshToken;
      }
      return result;
    }

  };
  
  
  /**
  * This fetches the access token once it has the authorization code and updates the authentication package
  * @param {object} package the authentication package
  * @param {object} e callback parameters from the authorization flow
  * @return {HttpResponse} the query response
  */
  goaApp.fetchAccessToken = function (package , e) {
  
      var e = e || {parameter:{code:'dummy for testing'}};
      var servicePackage = goaApp.getServicePackage (package);
    
      // this swops the authorization code in the callback args for an access token
      var options = {
          method : "POST" ,
          payload : {
              code : e.parameter.code,
              redirect_uri : e.parameter.redirectUri,
              grant_type : "authorization_code"
          },
          muteHttpExceptions : true
      };

      // return the result of token request
      return setResult_ ( package , cUseful.rateLimitExpBackoff( function () { 
        return UrlFetchApp.fetch ( servicePackage.tokenUrl , setOptions_ (package, servicePackage , options)); 
      }));

  };
  
  
  /**
   * Kill the package
   * @param {object} package the authentication package
   * @return {object} the package updates
   */
  goaApp.killPackage = function  (package) {
    package.access = null;
    return package;
  };
  
  
   /**
   * @private
   * some service packages need exception things
   * @param {object} package the authentication package
   * @param {object} servicePackage the service oackage
   * @param {object} options the options to be amended
   * @return the updated options
   */
  function setOptions_ (package, servicePackage , options) {

    // some APIS want to id.secret to be encoded as basic auth
    options = options || {};
   
    if (servicePackage.basic) {
      options.headers = options.headers || {};
      options.headers.authorization = "Basic " + Utilities.base64Encode(package.clientId + ":" + package.clientSecret);
     
    }
    else {
      options.payload = options.payload || {};
      options.payload.client_id = package.clientId;
      options.payload.client_secret = package.clientSecret;
    }
    
    // some APIS need accept headers
    if (servicePackage.accept) {
      options.headers = options.headers || {};
      options.headers.accept = servicePackage.accept;
    }
    
    return options;
  } 
  
  /**
   * @private
   * store result of getting refresh or code access token
   * @param {object} package the authentication package
   * @param {HttpResponse} result the urlfetch result
   * @return {HttpResponse} the httpresult
   */
  function setResult_ (package, result ) {

    // if it was good, then decipter the token
    if (result.getResponseCode() === 200) {
      try {
        var access = JSON.parse (result.getContentText ());
      }
      catch (error) {
        throw 'received unparseable reponse getting access token ' + result.getContentText ();
      }
      
      // make the token have a long life if non specified.
      var aLongTime = 60*60*24*500;

      // updat the package with the access info
      package.access = { 
        accessToken: access.access_token, 
        refreshToken: access.refresh_token,
        expires: (access.expires_in ? access.expires_in : aLongTime) * 1000 + new Date().getTime()
      };
      
      
    }
    else {
        // it failed, so scratch it
      goaApp.killPackage (package);
    }
    return result;
  }
  
   /**
   * write the args to cache for later
   * @param {object} args the args to store
   * @param {string} packageName the package name
   * @param {string} id the args id
   * @param {function} onToken the callback code
   * @return {object} the args
   */
  goaApp.cachePut = function (id, packageName, args, onToken) {
    var packet = {args:args , name:packageName , onToken:onToken ? onToken.toString() :'' , id:id};
    getCache_().put (KEY_PREFIX+id , JSON.stringify(packet)  );
  };
  
  /**
   * get any args to pasas back to executing function
   * @param {string} id the args id
   * @return {object} the args
   */
  goaApp.cacheGet = function (id) {
    var result = getCache_().get (KEY_PREFIX+id);
    return result ? JSON.parse(result) : null;
  };
  goaApp.invalidate = function (propertyStore, packageName) {
  
    var package = goaApp.getPackage(propertyStore, packageName);
    if (!package) {
      throw packageName + ' not found in given propertystore';
    }
    
    goaApp.killPackage (package);
    return goaApp.setPackage (propertyStore, package);
    
  }
  /**
   * expand scopes from allowed google shortcuts
   * @param {[string]} scopes an array of potential shortnames
   * @return fully qualified scopes
   */
  goaApp.scopesGoogleExpand = function (scopes) {
    
    // no need to put the full scope .. things tasks.readonly will do.
    return scopes.map(function(d) {
      return d.indexOf('https://') === -1 ? "https://www.googleapis.com/auth/" + d : d;
    });

  };
  /**
  * sets the user property store to a clean package copied from the script store if it doesnt exist
  * if the current property does not match the script one, it will be replaced anyway
  * @param  {string} packageName the package name
  * @param {PropertyStore} scriptPropertyStore where the credentials are
  * @param {PropertyStore} userPropertyStore where to put them
  * @param {boolean} replace them even if the exist
  * @return {object} the package
  */
  goaApp.userClone = function(packageName, scriptPropertyStore , userPropertyStore, replace) {
    
    // get the userpacakage if there is one
    var userPackage = goaApp.getPackage(userPropertyStore, packageName);
    
    // get the script package
    var scriptPackage = goaApp.getPackage(scriptPropertyStore, packageName);
    if (!scriptPackage) throw packageName + ' cannot be copied from script store as it is not there';
    
    // replace it with the script version if it has changed
    if (!userPackage || replace || !samePackages(scriptPackage,userPackage)) {

      // kill token information
      goaApp.killPackage (scriptPackage);
      
      // write to user store
      goaApp.setPackage (userPropertyStore , scriptPackage);
      
    }
    
    // kill token information and compare
    function samePackages( a, b) {
      if (!a || !b) return false;
      
      var ca = goaApp.killPackage(cUseful.clone(a));
      var cb = goaApp.killPackage(cUseful.clone(b));
      
      // remove the timestamp from each
      ca.revised = cb.revised = 0;

      return JSON.stringify(ca) === JSON.stringify(cb);
    }
  };
  
  // these are used to include their code in the consentscreen
  function handleCon(con) {  
    var o=document.getElementById("conAnchor");
    var newUrl=o.href.toString().replace(/access_type=\\w+/, "access_type=" + (con.checked ? "off" :"on") + "line");
    o.setAttribute ("href", newUrl);
  }
  
  goaApp.closeWindow = function (hasToken , opts) {
    var script = '<script>(' + handleClose.toString() + ')()</script>';
 
    var mess = hasToken ? 
      "<div>Successfully authentication - you can close this window</div>" : 
      "<div>Unsuccessful authentication - failed to get token</div>";

    return opts.close && hasToken ? script : mess;

  };
  
   // this can be included in the generated code
  function handleClose () {
    
    
    if (google && google.script && google.script.host && typeof google.script.host.close === "function") {
      google.script.host.close();
    }
    
    else if (window.top && typeof window.top.close === "function") { 
      window.top.close();
    } 
    
    else if (document.getElementById("closetop"))
    { 
      document.getElementById("closetop").innerHTML="You can close this window now";
    }
    
    else {
      // don't know how to close window
    }
  }
  
  
  /**
   * the standard consent screen
   * these parameters can be used to consreuct a consent screen
   * it must at a mimum contain a clickable line to the consentUrl
   * @param {string} consentUrl the consent URL
   * @param {string} redirect Url the redirect URL
   * @param {string} packageName the pckage name
   * @param {string} serviceName the service name
   * @param {boolean} offline whether offline access is allowed
   * @param {object} options {close:false, showRedirect:true}
   * @return {string} the html code for a consent screen
   */
  goaApp.defaultConsentScreen = function  (consentUrl,redirectUrl,packageName,serviceName,offline, options) {
    
    var opts = options ? JSON.parse(JSON.stringify(options)) : {};
    opts.close = opts.hasOwnProperty ("close") ? opts.close : false;
    opts.closeConsent = opts.hasOwnProperty ("closeConsent") ? opts.closeConsent : true;
    opts.showRedirect = opts.hasOwnProperty ("showRedirect") ? opts.showRedirect : true;
    
    // this will close the consent screen
    var close = opts.closeConsent ? handleClose.toString() : "";
    
    // can hide redirect if necessary
    var redirect = opts.showRedirect ? 
        '<div><label for="redirect">Redirect URI (for the developers console)</label></div>' + 
        '<div><input class="redirect" type="text" id="redirect" value="' + redirectUrl + '" readonly size=' + redirectUrl.length + '></div>' :
        '';
        
    return '<link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons1.css">' + 
      '<style>aside {font-size:.8em;} .strip {margin:10px;} .gap {margin-top:20px;} </style>' +
      '<script>' + handleCon.toString() + close + "</script>" + 
      '<div class="strip">' +

        '<h3>Goa has detected that authentication is required for a ' + serviceName + ' service</h3>' + 
          
        '<div class="block"></div>' + redirect +

        '<div class="gap">' +
          '<div><label><input type="checkbox" onclick="handleCon(this);"' + 
            (offline ? ' checked' : '') + '>Allow ' + packageName + ' to always access this resource in the future ?</label></div>' + 
        '</div>' +
          
        '<div class="gap">' +
          '<div><label for="start">Please provide your consent to start authentication for ' + packageName + '</label></div>' + 
        '</div>' +
          
        '<div class="gap">' +
          '<a href = "' + consentUrl + '" id="conAnchor"  target="_parent"><button id="start" class="action" onclick="handleClose();">Start</button></a>' +
        '</div>' +
          
        '<div class="gap">' +
            '<aside>For more information on Goa see <a href="http://ramblings.mcpher.com/Home/excelquirks/oauthtoo">Desktop Liberation</aside>'+ 
        '</div>' + 
       '</div>'

  };
  
  /**
   * get the cache to use
   * @return {Cache} the cahce
   */
  function getCache_ () {
    return CacheService.getUserCache();
  }
         
              
  /**
   * @namespace GoaApp.credential
   * for handling credential claims
   */
  goaApp.credential = {
    
     makeTokenRequest: function (package,timeout) {
  
       var tokenPacket = {};
       var servicePackage = goaApp.getServicePackage ( package);
  
       // i can use the service account option maker for some of this
       var options = setOptions_ (package, servicePackage, {
         method:"POST",
         muteHttpExceptions:true,
         contentType:'application/x-www-form-urlencoded',
         payload: {
           grant_type:"client_credentials"
         },
         headers: {
           "Accept-Language":"en_US"
         }
       });
  

       // request a new one
       var result = cUseful.rateLimitExpBackoff(function () {
        return UrlFetchApp.fetch(servicePackage.tokenUrl, options);
      });
      
      tokenPacket.content = JSON.parse(result.getContentText());
      tokenPacket.status = result.getResponseCode();
      return tokenPacket;
     }
  };
  
  /**
   * @namespace GoaApp.jwt
   * for handling jwt claims
   */
  goaApp.jwt = {
    
    /**
    * generate a jwt header
    * return {string} a jwt header b64
    */
    getHeader: function () {
      return {
        "alg": "RS256",
        "typ": "JWT" 
      };
    },
    
    /**
    * generate a jwt claim 
    * @param {object} package the authentication package
    * @param {string} impersonate email to impersonate if required
    * @param {string} timeout in secs
    * return {string} a jwt claimsm payload b64
    */
    getClaims: function (package, impersonate,timeout) {
    
      var now = Math.floor(new Date().getTime()/1000);
     
      var claims = {
        "iss" : package.client_email,
        "scope":package.scopes.join(' '),
        "aud":goaApp.getServicePackage (package).authUrl,
        "exp":Math.floor(now + timeout),
        "iat":now
      };
      
      if (impersonate) claims.impersonate = impersonate;
      return claims;
    },
    
    /**
    * generate a jwt 
    * @param {object} package the authentication package
    * @param {object} tokenPacket the token data
    * @return {string} the jwt 
    */
    generate: function (package, tokenPacket) {
      
      // generate the jwt
      var jwt = cUseful.encodeB64 (JSON.stringify(tokenPacket.header)) + "." + 
        cUseful.encodeB64(JSON.stringify(tokenPacket.claims));
      
      // now sign it 
      var signed = cUseful.encodeB64(Utilities.computeRsaSha256Signature (jwt, package.private_key));
      
      // and thats it
      return jwt + "." + signed;
    },
    
    /**
    * make token request
    */
    makeTokenRequest: function (package,impersonate,timeout) {
      
      // initialize the token
      var tokenPacket = {
        header: goaApp.jwt.getHeader(package),
        claims: goaApp.jwt.getClaims(package, impersonate,timeout)
      };
      
      // request a new one
      var result = cUseful.rateLimitExpBackoff(function () {
        return UrlFetchApp.fetch(goaApp.getServicePackage (package).tokenUrl, {
          method:"POST",
          muteHttpExceptions : true,
          contentType:'application/x-www-form-urlencoded',
          payload:{
            grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion:goaApp.jwt.generate(package, tokenPacket)
          } 
        }); 
      });
      
      tokenPacket.content = JSON.parse(result.getContentText());
      tokenPacket.status = result.getResponseCode();
      return tokenPacket;
    }
  };
  
  return goaApp;
  
}) (GoaApp || {});
