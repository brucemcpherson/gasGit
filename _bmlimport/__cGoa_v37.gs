//--project:1v_l4xN3ICa0lAW315NQEzAHPSoNiFdWHsMEwj2qA5t9cgZ5VWci2Qxv2 (cGoa) version:37
//  imported by bmImportLibraries at Sun, 06 Mar 2022 16:14:19 GMT
function __cGoa_v37 () {
  
  //---Inlined Instance of library 1EbLSESpiGkI3PYmJqWh3-rmLkYKAtCNPi1L2YCtMgo2Ut8xMThfJ41Ex(cUseful version 130)
  const cUseful = __bmlimporter_gets.__cUseful_v130
  //--script file:forPublishing
  
  function showMyScriptAppResource(s) {
    try {
      return ScriptApp.getResource(s);
    }
    catch (err) {
      throw err + " getting script " + s;
    }
  }
  
  
  function getLibraryInfo () {
  
    return { 
      info: {
        name:'cGoa',
        version:'2.0.1',
        key:'MZx5DzNPsYjVyZaR67xXJQai_d-phDA33',
        description:'simple library for google oauth2',
        share:'https://script.google.com/d/14sGrM0uhamXv89jexZByhH55fjuC7JA6mooKN52b6vendfTX5OFRgCi7/edit?usp=sharing'
      },
      dependencies:[
        cUseful.getLibraryInfo()
      ]
    }; 
  }
//--end:forPublishing

//--script file:GoaApp
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
    * @param {string} packageName the pockage name
    * @param {PropertyStore} propertyStore the property store
    * @param {number} [optTimeout] in seconds
    * @param {string} [impersonate] email address to impersonate for service accounts
    */
    goaApp.createGoa = function (packageName, propertyStore, optTimeout , impersonate) {
      if (!packageName) throw 'pockage name must be provided';
      if (!propertyStore || !cUseful.isObject(propertyStore) || !propertyStore.setProperty) throw 'propertystore must be a PropertiesService store';
      if (optTimeout && typeof optTimeout !== 'number') throw 'timeout must be number of seconds';
      if (impersonate && !cUseful.isEmail (impersonate)) throw 'impersonate should be an email address, not  ' + impersonate;
      return new Goa (packageName, propertyStore, optTimeout , impersonate);
    };
    
    /**
     * start the oauth flow
     * @param {object} pockage the pockage 
     * @param {boolean} [optForce=false] whether to force a dialog
     * @param {string} [impersonate] impersonate email address
     * @param {number} timeout in secs
     * @return {object} pockage the updated pockage
     */
    goaApp.start = function (pockage , optForce ,impersonate, timeout) {
    
      var force = cUseful.applyDefault (optForce , false);
      
      // kill the existing pockage if force was asked for
      if (force) goaApp.killPackage (pockage);
      
      // if havent already got one that will do
      if (!goaApp.hasToken(pockage,true)) {
  
        // if its a service account, its a simple one shot jwt
        if (goaApp.isServiceAccountType(pockage)) {
          var result = goaApp.jwt.makeTokenRequest (pockage , impersonate ,timeout);
          
          // we got something
          if (result && result.content) {
            if (result.content.access_token) {
              pockage.access = {
                accessToken:result.content.access_token,
                expires: result.content.expires_in * 1000 + new Date().getTime()
              }
            }
          }
          // something happened
          if (!goaApp.hasToken(pockage)) throw 'failed to get service account token:' + JSON.stringify(result.content);
           
        }
        
        // maybe its a firebase token
        else if (goaApp.isJwtType(pockage)) {
          var ft = JWT.generateJWT ( goaApp.getProperty(pockage,'data') , pockage.clientSecret );
          if (ft) {
            // make it last 24 hours
            pockage.access = {
              accessToken:ft,
              expires: new Date().getTime() + 60*1000*60*24
            }
          }
          else {
            throw 'failed to get jwt token';
          }
        }
        
        // maybe its a client credentials one
        else if (goaApp.isCredentialType (pockage)) {
          var result = goaApp.credential.makeTokenRequest (pockage  ,timeout);
          
          // we got something
          if (result && result.content) {
            if (result.content.access_token) {
              pockage.access = {
                accessToken:result.content.access_token,
                expires: result.content.expires_in * 1000 + new Date().getTime()
              }
            }
          }
          // something happened
          if (!goaApp.hasToken(pockage)) throw 'failed to get service account token:' + JSON.stringify(result.content);
        }
        
        
        // maybe we can refresh one
        else if ( goaApp.hasRefreshToken(pockage) ) {
          var result = goaApp.tryRefresh (pockage);
          if (!goaApp.hasToken(pockage)) {
            Logger.log('failed to exchange refresh token for access token(ok if this app has been recently revoked)' + result.getContentText());
          }
        }
        
        // will expire soon and refresh not available
        else {
          if (pockage && pockage.packageName && pockage.access && pockage.access.expires) {
            Logger.log ("Goa-warning:" + pockage.packageName + " doesn't support token refresh and expires in " + Math.round((new Date().getTime() - pockage.access.expires)/1000) + " seconds");
          }
        }
      }
      
      return pockage;
      
    }
    
      
    /**
     * get the private parameter from the state token
     * @return {object} the state token custom parameter property
     */
    goaApp.getCustomParameter = function (params) {
      return params && params.parameter && params.parameter ? params.parameter : {};
    };
    
    /**
    * get the pockage name from the state token
    * @return {object} the state token custom parameter property
    */
    goaApp.getName = function (params) {
     return GoaApp.getCustomParameter(params).goaname;
    };
    
    /**
     * get the params from cache
     * @param {object} propertyStore where to find it
     * @param {string} packageName the pockage name
     * @return {object}  the authentication pockage
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
     * @param {string} packageName the pockage name
     */
    goaApp.removePackage = function (propertyStore, packageName) {
    
      var p = cUseful.rateLimitExpBackoff( function () { 
        return propertyStore.deleteProperty(goaApp.getPropertyKey(packageName));
      });
    };
    
      /**
    * creates a pockage from a file for a service account
    * @param {Drive-App} dap the drive-app
    * @param {object} pockage info on how to populate the pockage
    * @return {object}  the authentication pockage
    */
    goaApp.createPackageFromFile = function (dap , pockage) {
    
      // first check that the service is known and it's for a service account
      if (goaApp.isServiceAccountType(pockage)){ 
        throw 'service type for ' + pockage.service + ' should be a web account';
      }
      
      // now get the json key data
      var file = dap.getFileById(pockage.fileId);
      if (!file) throw 'couldnt open file:' + pockage.fileId;
      
      // the file content
      var content = cUseful.rateLimitExpBackoff(function () { 
        return JSON.parse (file.getBlob().getDataAsString() );
      });
      
      
      // check its good
      if (!content.web || !content.web.client_id || !content.web.client_secret) {
        throw 'this is not a credentials file downloaded from the developers console'
      }
      
      var p = cUseful.clone(pockage);
      p.clientId = content.web.client_id;
      p.clientSecret = content.web.client_secret;
      return p;
  
    };
    
    /**
     * set the authentication pockage
     * @param {object} propertyStore where to find it
     * @param {object} pockage the authentication pockage
     * @return {object}  the authentication pockage
     */
    goaApp.setPackage = function (propertyStore, pockage) {
     
      // check a few things - this fail if unknown type
      var sp = goaApp.getServicePackage (pockage);
      
      // check we have a name
      if (!pockage.packageName) throw 'pockage must have a name';
      
      cUseful.rateLimitExpBackoff( function () { 
        return propertyStore.setProperty(goaApp.getPropertyKey(pockage.packageName) , JSON.stringify (pockage)); 
      });
      return pockage;
    };
    
    /**
    * creates a pockage from a file for a service account
    * @param {object} pockage the authentication pockage
    * @return {boolean}  whether its a service account
    */
    goaApp.isServiceAccountType = function (pockage) {
      var servicePackage = goaApp.getServicePackage ( pockage);
      return servicePackage.accountType === 'serviceaccount';
    };
    
   /**
    * creates a pockage from a file for a jwt firebase account
    * @param {object} pockage the authentication pockage
    * @return {boolean}  whether its a jwt account
    */
    goaApp.isJwtType = function (pockage) {
      var servicePackage = goaApp.getServicePackage ( pockage);
      return servicePackage.accountType === 'firebase';
    };
    
     /**
    * creates a pockage from a file for a credentials grant type
    * @param {object} pockage the authentication pockage
    * @return {boolean}  whether its a jwt account
    */
    goaApp.isCredentialType = function (pockage) {
      var servicePackage = goaApp.getServicePackage ( pockage);
      return servicePackage.accountType === 'credential';
    };
  
    /**
    * creates a pockage from a file for a service account
    * @param {Drive-App} dap the drive-app
    * @param {object} pockage info on how to populate the pockage
    * @return {object}  the authentication pockage
    */
    goaApp.createServiceAccount = function (dap , pockage) {
    
      // first check that the service is known and it's for a service account
      if (!goaApp.isServiceAccountType(pockage))throw 'service type for ' + pockage.service + ' should be serviceaccount';
      
      // now get the json key data
      var file = dap.getFileById(pockage.fileId);
      if (!file) throw 'couldnt open file:' + pockage.fileId;
      
      // merge with existing pockage
      return Object.keys(pockage).reduce (function (p,c) {
        p[c] = pockage[c];
        return p;
      } , cUseful.rateLimitExpBackoff(function () { 
        return JSON.parse (file.getBlob().getDataAsString() );
      }));
    };
                               
  
    
   /**
    * gets the property key against which you want the authentication pockage stored
    * @param {string} packageName the pockage name
    * @return {string} the key for this pockage
    */
    goaApp.getPropertyKey = function (packageName) {
      return KEY_PREFIX + packageName;
    };
    
    /**
     * gets the accesstoken
     * @param {object} pockage the authentication pockage
     * @return {string | undefined} the accesstoken
     */
    goaApp.getToken = function (pockage) {
      return goaApp.hasToken(pockage) ? pockage.access.accessToken : undefined;
    };
    
    /**
     * gets an arbirary property stored in a goa packages
     * @param {object} pockage the authentication pockage
     * @param {string} key the property key
     * @return {string | undefined} the accesstoken
     */
    goaApp.getProperty = function (pockage,key) {
      return pockage[key];
    };
    
    /**
     * checks if access token is available and valid
     * @param {object} pockage the authentication pockage
     * @param {boolean} check whether to check it against google oauth2 infra
     * @return {boolean} whether a viable token is present
     */
    goaApp.hasToken = function (pockage,check) {
  
      //for now, lets always check.. maybe remove this later
      check = true;
      
      // first step, make sure we have a likable token
      var ok = (goaApp.hasFlow(pockage) && 
        pockage.access.accessToken && 
        (new Date().getTime() + goaApp.gracePeriod < pockage.access.expires)) ? true : false;  
  
      // next step.. if asked, check against google infra if its possible
  
      if (check && ok) {
  
        var servicePackage = goaApp.getServicePackage (pockage);
  
        if (servicePackage.checkUrl) {
  
          var checked = checkToken_(servicePackage.checkUrl + pockage.access.accessToken);
          ok = checked.ok;
  
          if(!ok) {
            // need to get rid of this token
            pockage.access.accessToken = "";
  
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
     * checks that we have an access flow pockage at all
     * @param {object} pockage the authentication pockage
     * @return {boolean} whether it has an access object
     */
    goaApp.hasFlow = function (pockage) {
      return pockage && pockage.access ? true : false;
    };
    
    /**
     * gets the refresh token
     * @param {object} pockage the authentication pockage
     * @return {string | undefined} the refresh token
     */
    goaApp.getRefreshToken = function (pockage) {
      return goaApp.hasRefreshToken(pockage) ? pockage.access.refreshToken : undefined;
    };
    
    /**
     * checks if refresh token is available 
     * @param {object} pockage the authentication pockage
     * @return {boolean} whether a viable refresh token is present
     */
    goaApp.hasRefreshToken = function (pockage) {
      return goaApp.hasFlow(pockage) && pockage.access.refreshToken ? true : false;
    };
    
    /**
     * gets the service pockage
     * @param {object} pockage the authentication pockage
     * @return the service pockage
     */
    goaApp.getServicePackage = function (pockage) {
      var p = Service.pockage[pockage.service];
      
      // support custom service
      if (!p && pockage.service === "custom") {
       if (typeof pockage.serviceParameters !== typeof {}) {
          throw 'custom service needs a serviceParameters object as a property';
       }
       p = pockage.serviceParameters;
      }
      if (!p) throw 'service provider ' + pockage.service + ' is not known';
      return p;
    };
  
    /**
     * creates authentication uri
     * @param {object} pockage the authentication pockage
     * @param {object} scriptPackage the script pockage
     * @param {[*]} [withArgs] any user args to be preserved
     * @param {boolean} force whether to force authentication (this is needed to provoke a refresh token 1st time)
     * @return {string} the authentication url
     */
    goaApp.createAuthenticationUri = function (pockage, scriptPackage,withArgs,force) {
      
      var servicePackage = goaApp.getServicePackage (pockage);
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
        client_id: pockage.clientId,
        scope: pockage.scopes.join(" "),
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
      return goaApp.getServicePackage(pockage).authUrl + 
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
     * @param {object} pockage the authentication pockage
     * @return {HttpResponse | undefined} the http response from a refresh, or undefined if it didnt happen
     */
    goaApp.tryRefresh = function (pockage) {
      
      
      // if we have enough info to refresh a token
      if (goaApp.hasRefreshToken(pockage)) {
  
        var refreshToken = goaApp.getRefreshToken(pockage);
        
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
        var servicePackage = goaApp.getServicePackage(pockage);
        
        // try to refresh
        var result = setResult_ ( pockage , cUseful.rateLimitExpBackoff (function () { 
          return UrlFetchApp.fetch ( servicePackage.tokenUrl , setOptions_ (pockage, servicePackage , options)); 
        }));
       
        // reuse the original refresh token as we dont get a new one
        if (goaApp.hasToken(pockage)) { 
          pockage.access.refreshToken = refreshToken;
        }
        return result;
      }
  
    };
    
    
    /**
    * This fetches the access token once it has the authorization code and updates the authentication pockage
    * @param {object} pockage the authentication pockage
    * @param {object} e callback parameters from the authorization flow
    * @return {HttpResponse} the query response
    */
    goaApp.fetchAccessToken = function (pockage , e) {
    
        var e = e || {parameter:{code:'dummy for testing'}};
        var servicePackage = goaApp.getServicePackage (pockage);
      
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
        return setResult_ ( pockage , cUseful.rateLimitExpBackoff( function () { 
          return UrlFetchApp.fetch ( servicePackage.tokenUrl , setOptions_ (pockage, servicePackage , options)); 
        }));
  
    };
    
    
    /**
     * Kill the pockage
     * @param {object} pockage the authentication pockage
     * @return {object} the pockage updates
     */
    goaApp.killPackage = function  (pockage) {
      pockage.access = null;
      return pockage;
    };
    
    
     /**
     * @private
     * some service packages need exception things
     * @param {object} pockage the authentication pockage
     * @param {object} servicePackage the service oackage
     * @param {object} options the options to be amended
     * @return the updated options
     */
    function setOptions_ (pockage, servicePackage , options) {
  
      // some APIS want to id.secret to be encoded as basic auth
      options = options || {};
     
      if (servicePackage.basic) {
        options.headers = options.headers || {};
        options.headers.authorization = "Basic " + Utilities.base64Encode(pockage.clientId + ":" + pockage.clientSecret);
       
      }
      else {
        options.payload = options.payload || {};
        options.payload.client_id = pockage.clientId;
        options.payload.client_secret = pockage.clientSecret;
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
     * @param {object} pockage the authentication pockage
     * @param {HttpResponse} result the urlfetch result
     * @return {HttpResponse} the httpresult
     */
    function setResult_ (pockage, result ) {
  
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
  
        // updat the pockage with the access info
        pockage.access = { 
          accessToken: access.access_token, 
          refreshToken: access.refresh_token,
          expires: (access.expires_in ? access.expires_in : aLongTime) * 1000 + new Date().getTime()
        };
        
        
      }
      else {
          // it failed, so scratch it
        goaApp.killPackage (pockage);
      }
      return result;
    }
    
     /**
     * write the args to cache for later
     * @param {object} args the args to store
     * @param {string} packageName the pockage name
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
    
      var pockage = goaApp.getPackage(propertyStore, packageName);
      if (!pockage) {
        throw packageName + ' not found in given propertystore';
      }
      
      goaApp.killPackage (pockage);
      return goaApp.setPackage (propertyStore, pockage);
      
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
    * sets the user property store to a clean pockage copied from the script store if it doesnt exist
    * if the current property does not match the script one, it will be replaced anyway
    * @param  {string} packageName the pockage name
    * @param {PropertyStore} scriptPropertyStore where the credentials are
    * @param {PropertyStore} userPropertyStore where to put them
    * @param {boolean} replace them even if the exist
    * @return {object} the pockage
    */
    goaApp.userClone = function(packageName, scriptPropertyStore , userPropertyStore, replace) {
      
      // get the userpacakage if there is one
      var userPackage = goaApp.getPackage(userPropertyStore, packageName);
      
      // get the script pockage
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
      
  
      var construct =  '<link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons1.css">' + 
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
            // this was target=_parent but this became disallowed following some apps script update
            // seems to work with target=_blank for now - but let's see.
            '<div class="gap">' +
            '<a href = "' + consentUrl + '" id="conAnchor"  target="_blank"><button id="start" class="action" onclick="handleClose();">Start</button></a>' +
          '</div>' +
          '<div class="gap">' +
              '<aside>For more information on Goa see <a target="_blank" href="https://ramblings.mcpher.com/oauth2-for-apps-script-in-a-few-lines-of-code/how-oauth2-works-and-goa-implementation/">Desktop Liberation</aside>'+ 
          '</div>' + 
         '</div>'
         // console.log(construct);
         return construct;
  
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
      
       makeTokenRequest: function (pockage,timeout) {
    
         var tokenPacket = {};
         var servicePackage = goaApp.getServicePackage ( pockage);
    
         // i can use the service account option maker for some of this
         var options = setOptions_ (pockage, servicePackage, {
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
      * @param {object} pockage the authentication pockage
      * @param {string} impersonate email to impersonate if required
      * @param {string} timeout in secs
      * return {string} a jwt claimsm payload b64
      */
      getClaims: function (pockage, impersonate,timeout) {
      
        var now = Math.floor(new Date().getTime()/1000);
       
        var claims = {
          "iss" : pockage.client_email,
          "scope":pockage.scopes.join(' '),
          "aud":goaApp.getServicePackage (pockage).authUrl,
          "exp":Math.floor(now + timeout),
          "iat":now
        };
        
        if (impersonate) claims.impersonate = impersonate;
        return claims;
      },
      
      /**
      * generate a jwt 
      * @param {object} pockage the authentication pockage
      * @param {object} tokenPacket the token data
      * @return {string} the jwt 
      */
      generate: function (pockage, tokenPacket) {
        
        // generate the jwt
        var jwt = cUseful.encodeB64 (JSON.stringify(tokenPacket.header)) + "." + 
          cUseful.encodeB64(JSON.stringify(tokenPacket.claims));
        
        // now sign it 
        var signed = cUseful.encodeB64(Utilities.computeRsaSha256Signature (jwt, pockage.private_key));
        
        // and thats it
        return jwt + "." + signed;
      },
      
      /**
      * make token request
      */
      makeTokenRequest: function (pockage,impersonate,timeout) {
        
        // initialize the token
        var tokenPacket = {
          header: goaApp.jwt.getHeader(pockage),
          claims: goaApp.jwt.getClaims(pockage, impersonate,timeout)
        };
        
        // request a new one
        var result = cUseful.rateLimitExpBackoff(function () {
          return UrlFetchApp.fetch(goaApp.getServicePackage (pockage).tokenUrl, {
            method:"POST",
            muteHttpExceptions : true,
            contentType:'application/x-www-form-urlencoded',
            payload:{
              grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
              assertion:goaApp.jwt.generate(pockage, tokenPacket)
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
  
//--end:GoaApp

//--script file:Service
  /**
   * this is the list of known Service and their url pockage
   * contact me to add to this list permamently so others can have them too.
   */
  var Service = (function (service) {
    "use strict";
  
    /**
    * this list can be added to temporarily by using Service.pockage.yourprovider = { your url pockage }
    */
    service.pockage = {
      "google_service": {
        authUrl : "https://www.googleapis.com/oauth2/v3/token",
        tokenUrl: "https://www.googleapis.com/oauth2/v3/token",
        defaultDuration:600,
        accountType:'serviceaccount',
        checkUrl:"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token="
      },
      "google": {
        authUrl : "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://accounts.google.com/o/oauth2/token",
        refreshUrl: "https://accounts.google.com/o/oauth2/token",
        checkUrl: "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token="
      },
      "linkedin": {
        authUrl : "https://www.linkedin.com/oauth/v2/authorization",
        tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
        refreshUrl: "https://www.linkedin.com/oauth/v2/accessToken" 
      },
      "soundcloud": {
        authUrl : "https://soundcloud.com/connect",
        tokenUrl: "https://api.soundcloud.com/oauth2/token",
        refreshUrl: "https://api.soundcloud.com/oauth2/token" 
      },
      "podio": {
        authUrl : "https://podio.com/oauth/authorize",
        tokenUrl: "https://podio.com/oauth/token",
        refreshUrl: "https://podio.com/oauth/token" 
      },
      "shoeboxed": {
        authUrl : "https://id.shoeboxed.com/oauth/authorize",
        tokenUrl: "https://id.shoeboxed.com/oauth/token",
        refreshUrl: "https://id.shoeboxed.com/oauth/token" 
      },
      "github": {
        authUrl : "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        refreshUrl: "https://github.com/login/oauth/access_token",
        accept: "application/json"
      },  
      "reddit": {
        authUrl : "https://ssl.reddit.com/api/v1/authorize",
        tokenUrl: "https://ssl.reddit.com/api/v1/access_token",
        refreshUrl: "https://ssl.reddit.com/api/v1/access_token",
        basic:true,
        duration:'permanent'
      },
      "asana": {
        authUrl : "https://app.asana.com/-/oauth_authorize",
        tokenUrl: "https://app.asana.com/-/oauth_token",
        refreshUrl: "https://app.asana.com/-/oauth_token",
      },
      "live": {
        authUrl : "https://login.live.com/oauth20_authorize.srf",
        tokenUrl: "https://login.live.com/oauth20_token.srf",
        refreshUrl: "https://login.live.com/oauth20_token.srf",
      },
      "paypal_sandbox": {
        authUrl : "https://api.sandbox.paypal.com/v1/oauth2/token",
        tokenUrl: "https://api.sandbox.paypal.com/v1/oauth2/token",
        refreshUrl: "https://api.sandbox.paypal.com/v1/oauth2/token",
        basic:true,
        accountType:"credential",
        accept: "application/json"
      },
      "paypal_live": {
        authUrl : "https://api.paypal.com/v1/oauth2/token",
        tokenUrl: "https://api.paypal.com/v1/oauth2/token",
        refreshUrl: "https://api.paypal.com/v1/oauth2/token",
        basic:true,
        accountType:"credential",
        accept: "application/json"
      },
      classy: {
        authUrl : "https://api.classy.org/oauth2/auth",
        tokenUrl: "https://api.classy.org/oauth2/auth",
        refreshUrl: "https://api.classy.org/oauth2/auth",
        accountType:"credential"
      },
      quickbooks: {
        authUrl : "https://appcenter.intuit.com/connect/oauth2",
        tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
        refreshUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
      },
      firebase: {
        accountType:'firebase'
      },
      vimeo: {
        authUrl: "https://api.vimeo.com/oauth/authorize",
        tokenUrl: "https://api.vimeo.com/oauth/access_token",
        refreshUrl: "https://api.vimeo.com/oauth/access_token"
      }
    };
    
    return service;
  } ) (Service || {}); 
  
  
  
  
//--end:Service

//--script file:Goa
  /**
  * create a goa class
  * @constructor
  * @param {string} packageName the pockage name
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
        onTokenResult_,
        uiOpts_;
       
  
  
    /**
    * the function to call when a token is created
    * @param {string} onTokenFunction the function to call
    * @return {Goa} self
    */
    self.setOnToken = function (onTokenFunction) {
      if (typeof onTokenFunction !== 'function') throw 'ontoken callback must be a function'; 
      onToken_ = onTokenFunction;
      return self;
    };
    
    /**
     * any special UI options
     * @param {object} opts
     */
    self.setUiBehavior = function (opts) {
      uiOpts_ = opts;
      return self;
    };
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
      
      // the name 
      name_ = GoaApp.getName(params_);
      
      // load in the pockage on initialization
      package_ = GoaApp.getPackage (propertyStore_ , packageName_);  
      if (!package_) throw 'cannot find pockage ' + packageName_ + ' in given property store';
      
      // check we have parameters matching the pockage 
      if (name_ && name_ !== package_.packageName) throw 'the param name ' + name_ + 
        ' is different than the pockage name ' + package_.packageName; 
      
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
      // this is able to figure out which function is managing the goa flow
      if(!callback_) {
        // using whereAMI no longer works - so just defaulting to doGet
        self.setCallback ('doGet');
      }
  
     
      // if this is the first time in, we need to signal a consent screen is needed
      if (phase_ === "init") {
          
      // need to store these for later
        id_ = cUseful.generateUniqueString();
        GoaApp.cachePut ( id_ , package_.packageName , params_, onToken_);
        var offline = cUseful.applyDefault(package_.offline, true);
        var apack = {
          callback : callback_,
          timeout: timeout_,
          offline:offline,
          force: true
        };
        var bpack =  {
          goaid:id_,
          goaphase:'fetch',
          goaname:package_.packageName
        };
  
        
        // set up the consent screen
        needsConsent_ = (consentScreen_ || GoaApp.defaultConsentScreen) ( GoaApp.createAuthenticationUri ( 
          package_, apack, bpack) ,GoaApp.createRedirectUri(), package_.packageName, package_.service, offline, uiOpts_);
  
        return self;
      }
      
      // if this is a fetch iteration then we've been called back by a consent requests
      if (phase_ === "fetch") {
        
        var result = GoaApp.fetchAccessToken (package_ , params);
        if (!self.hasToken()) {
          throw 'Failed to get access token : operation was cancelled';
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
    
   
    self.done = function () {
      // set up close message or go away.
      return HtmlService.createHtmlOutput(
        GoaApp.closeWindow(self.hasToken() ,uiOpts_ || {
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
     * get pockage
     * @return {object | undefined} the pockage
     */
    self.getPackage = function () {
      return package_ ;
    };
    
    /**
     * write the pockage
     * @return self
     */
    self.writePackage = function () {
      package_.revised = new Date().getTime();
      GoaApp.setPackage ( propertyStore_ , package_);
      return self;
    };
    
    /**
     * kill the pockage
     */
    self.kill = function () {
      GoaApp.killPackage(package_);
      return self.writePackage();
    };
    
    /**
     * remove the pockage
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
  
   
//--end:Goa

//--script file:JWT
  /**
   * @namespace JWT
   * a namespace to generate a firebase jwt
   */
  var JWT = (function (ns) {
  
    /**
     * generate a jwt for firebase using default settings
     * @param {object} data the data pockage
     * @param {string} secret the jwt secret
     */
    ns.generateJWT = function(data, secret) {
      
      var header = getHeader_ ();
      var claims = getClaims_ (data);
      var jwt = header + "." + claims;
      
      // now sign it 
      var signature = Utilities.computeHmacSha256Signature (jwt, secret);
      var signed = unPad_ (Utilities.base64EncodeWebSafe(signature));
  
      // and thats the jwt
      return jwt + "." + signed;
    };
    
    /**
     * generate a jwt header
     * return {string} a jwt header b64
     */
    function getHeader_ () {
    
      return unPad_(Utilities.base64EncodeWebSafe(JSON.stringify( {
        "alg": "HS256",
        "typ": "JWT" 
      })));
    }
    
    /**
     * generate a jwt claim for firebase
     * return {string} a jwt claimsm payload b64
     */
    function getClaims_  (data) {
      
      return unPad_ (Utilities.base64EncodeWebSafe( JSON.stringify( {
        "d" : data || {},
        "iat": Math.floor(new Date().getTime()/1000),
        "v": 0
      })));
    }
    
    /**
     * remove padding from base 64
     * @param {string} b64 the encoded string
     * @return {string} padding removed
     */
    function unPad_ (b64) {
      return b64 ?  b64.split ("=")[0] : b64;
    }
  
    return ns;
  })(JWT || {});
  
  
//--end:JWT

  return {
    showMyScriptAppResource,
    getLibraryInfo,
    make,
    GoaApp,
    Service,
    Goa,
    JWT
  }
}
//--end project:cGoa