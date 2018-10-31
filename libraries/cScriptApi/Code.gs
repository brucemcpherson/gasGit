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
  
  // disable caching
  self.enableCaching = function (enable) {
    self.fetcheroo.enableCaching (enable);
    return self;
  };

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
  
  
  // get projects
  self.getProjectByScriptId = function (scriptId, query) {
    if (!scriptId) throw 'must provide a script Id';
    const request = {
      path: '/projects/'+ scriptId,
      query: query,
      cleanData: cleanData,
      
    };
    return self.fetcheroo.request (request); 
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
