/**
 * api for the Script API
 * needs scopes
 * https://www.googleapis.com/auth/script.external_request
 * https://www.googleapis.com/auth/script.processes
 * https://www.googleapis.com/auth/script.projects
 * if using same apps script cloud project
 * your apps script token will do
 * Example init to get a caching instance is like this
 * you#ll need cUseful library for this '1EbLSESpiGkI3PYmJqWh3-rmLkYKAtCNPi1L2YCtMgo2Ut8xMThfJ41Ex'
 * const api = new ScriptApi()
    .init (ScriptApp.getOAuthToken , UrlFetchApp, {
      cacheCrusher:new cUseful.CrusherPluginCacheService()
      .init ({
        store:CacheService.getUserCache()
      })
   });
 * 
 */
function ScriptApi  () {

  const self = this;
  const cuse = cUseful;
  const utils = cuse.Utils;

  // api default settings
  const OPTIONS =  {
      hostName:"script.googleapis.com",
      version:"/v1"
    };
  const SETTINGS = {
    tokenRequired: true
  };
  const MANIFEST_NAME = "appsscript";
  const MANIFEST_TYPE = "JSON";
  
  // set any app specific settings
  self.init = function (tokenService , fetchApp,  settings , options) {
    
    // merge with anything arriving
    self.fetcheroo = new cUseful.Fetcheroo()
    .init (fetchApp , utils.vanExtend (OPTIONS , options), utils.vanExtend (SETTINGS , settings))
    .setTokenService (function () {
      return ScriptApp.getOAuthToken();
    });
    
    return self;
  };
  
  /**
   * enable/diable caching
   * @param {boolean} enable
   * @return self
   */
  self.setCaching = function (enable) {
    self.fetcheroo.setCaching (enable);
    return self;
  };
  
   /**
   * check caching
   * @return {boolean}
   */
  self.getCaching = function () {
    return self.fetcheroo.getCaching ();
  };
  
  /**
   * clean data
   * this is about cleaning up the result so that paging can work
   * @param {object} result the api result
   * @param {string} [key] the key to find the array to be paged
   * @return {object} result cleanned up
   */
  function cleanData (result, key) {
    if (!result || !result.data) {
      result.data = [];
      return result;
    }
    
    if (!Array.isArray(result.data)) {
      result.data =[result.data];
    }
    
    if ( result.data.length !== 1) {
      result.error = 'unexpected data format - should be exactly 1 response array';
    } 
    else {
      result.data = key ? result.data[0][key] : result.data[0];
      if(!Array.isArray(result.data)) {
        result.data = result.data ? [result.data] : [];
      }
    }
    return result;
  }
  
  // update project
  self.updateProjectContent = function (scriptId , files , query) {
    if (!scriptId) throw 'must provide a script Id';
    if (!files) throw 'must provide some file content';
    if (!Array.isArray(files)) files = [files];
    
    const request = {
      path: '/projects/'+ scriptId +'/content',
      query: query,
      cleanData: cleanData,
      method: "PUT",
      body: {
        files:files
      }
    };
    return self.fetcheroo.request (request); 
  };
  
  // get processes
  self.getProcesses = function (limit,query) {
    query = utils.clone(query) || {};
    // limit to the last week if not mentioned
    const st = new Date();
    const gt = query['userProcessFilter.startTime'] ? new Date (gt) : null;
    
    query['userProcessFilter.startTime'] = 
      Utilities.formatDate(gt || new Date(st.setDate(st.getDate() - 7)),
       "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const request = {
      path: '/processes',
      query: query,
      limit: limit,
      cleanData: function (result) {
        return cleanData (result, "processes")
      }
    };
    return self.fetcheroo.request (request);
  };
  
  // get processes by script ID
  self.getProcessesByScriptId = function (scriptId, limit, query) {
    query = utils.clone(query) || {};
    if (!scriptId) throw 'must provide a script Id';
    query['userProcessFilter.scriptId'] =  scriptId;
    return self.getProcesses (limit, query); 
  };
  
  
  /**
   * get project files
   * @param {string} scriptId
   * @param {object} [query] any addition url params
   * @return {object} a Fetcheroo response {error:,code:,data:[]}
   */
  self.getProjectByScriptId = function (scriptId, query) {
    if (!scriptId) throw 'must provide a script Id';
    const request = {
      path: '/projects/'+ scriptId,
      query: query,
      cleanData: cleanData,
      
    };
    return self.fetcheroo.request (request); 
  };

  /**
   * get the content uncached
   * @param {string} scriptId
   * @param {string} version
   * @return {object} api result
   */
   self.getContentUncached = function (scriptId , version , query) {
    
     // make sure we're not caching
     var cached = self.getCaching();
     self.setCaching (false);
    
     // get the content and deal with the caching
     var content = self.getContent (scriptId , version, query);
     // set the caching to how it was
     self.setCaching(cached);
     return content;
   };

   /**
    * from content.data get the manifest file
    * @param {[object]} data the array of content
    * @return {[object]} an array of 1 element containing the manifest
    */
   function extractManifest  (data) {
     // now get the manifest
     var manifest = (data || [])
     .filter (function (d) {
       return d.name === MANIFEST_NAME && d.type === MANIFEST_TYPE;
     });
     if (manifest.length !== 1) throw 'should have been 1 manifest - there were ' + manifest.length;
     return manifest;
   }
  /**
   * get the manifest file only
   * @param {string} scriptId
   * @param {string} version
   * @return {[object]} manifest
   */
   self.getManifest = function ( scriptId , version ) {
     var content = self.getContentUncached (scriptId , version);
     if (content.error) return content;
     return extractManifest ( content.data );
   };
  /** 
   * CAUTION: dangerous as all content gets re-written
   * you can test by running first with commit set to false
   * add libraries or update them if already there
   * @param {boolean} commit whether or not to actually commit - if false you get the content with the changes, but not written
   * @param {string} scriptId
   * @param {string} version
   * @param {[object]} library object {"userSymbol": "cSpaceify","libraryId": "1ieq2KPsicq6u0VqerW6IQI2zK4fZQ1P5ktg8M3lGTCDV3LA3kO7OxCzI","version": "1","developmentMode": true}
   * @return {object} content
   */
  self.updateLibraries = function ( commit, scriptId , version , libraries ) {
    
    // this is what a library entry looks like
    var template = {"userSymbol": undefined,"libraryId": undefined,"version": undefined,"developmentMode": false};
    
    // get content
    if (typeof commit !== "boolean") throw 'commit argument should be boolean true to write/false to rehearse';
    
    // now check the libraries object is ok
    libraries = Array.isArray(libraries) ? libraries : [libraries];
    libraries = libraries.map (function (d) {
      // must be an object
      if ( !utils || !utils.isVanObject (d) ) throw 'library should be an object';
      // merge with template for defaults
      var o = utils.vanExtend ( template , d);
      // no unknown keys added and every require valued specified
      if( Object.keys(o).every (function (f) {
          return template.hasOwnProperty (f) && !utils.isUndefined(o[f]);
        })) throw 'invalid or missing key value in ' + JSON.stringify(o);
      return o;
    });

    // get the content and deal with the caching
    var content = self.getContentUncached (scriptId , version);
    if (content.error) return content;
    
    // now get the manifest source
    var manifest = extractManifest ( content.data )[0];
    var source = JSON.parse(manifest.source);

    // shortcut
    var ml = source.dependencies.libraries || [];
    
    // add or update each library
    libraries.forEach (function (d) {
      var matchIndex = utils.findIndex (ml, function (e) {
        return e.userSymbol === d.userSymbol;
      });
      // it's new
      if (matchIndex === -1) {
        ml.push (d);
      }
      // it's an update
      else {
        ml[matchIndex] = d;
      }
    });
    
    // put the updated source back
    source.dependencies.libraries = ml;
    manifest.source = JSON.stringify(source);
    
    // if it's a commit, do it, otherwise return what would have been done
    return commit ? self.updateProjectContent  (scriptId , content.data ) : content.data;

  };
  

  // get content
  /**
  * @param {string} scriptId 
  * @param {number} [version]
  * @param {object} [query]
  * @return api result
  */
  self.getContent = function (scriptId , version , query) {
    if (!scriptId) throw 'must provide a script Id';
    query - utils.clone (query) || {};
    if (version) {
      query.versionNumber = version;
    }
    const request = {
      path: '/projects/' + scriptId + '/content',
      query:query,
      cleanData: function (result) {
        return cleanData (result, "files")
      }
    };
    return self.fetcheroo.request (request);
    
  } 
  
}
