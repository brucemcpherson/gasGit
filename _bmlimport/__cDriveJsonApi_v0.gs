//--project:1P0ZbhWVxXcYU8kJxtpdzm_tNuoBa34NLAubBUgEqsW7-pvEg5NVppTyx (cDriveJsonApi) version:latest
//  imported by bmImportLibraries at Sun, 06 Mar 2022 16:14:19 GMT
function __cDriveJsonApi_v0 () {
  
  //---Inlined Instance of library 1EbLSESpiGkI3PYmJqWh3-rmLkYKAtCNPi1L2YCtMgo2Ut8xMThfJ41Ex(cUseful version 130)
  const cUseful = __bmlimporter_gets.__cUseful_v130
  
  //---Inlined Instance of library 1NtAiJulZM4DssyN0HcK2XXTnykN_Ir2ee2pXV-CT367nKbdbTvRX4pTM(cUrlResult version 0)
  const cUrlResult = __bmlimporter_gets.__cUrlResult_v0
  //--script file:Code
  "use strict";
  
  function getLibraryInfo () {
  
    return { 
      info: {
        name:'cDriveJsonApi',
        version:'0.0.7',
        key:'MvIo2UPbHoLDhAVcRHrI-VSz3TLx7pV4j',
        description:'drive sdk json API for apps script',
        share:'https://script.google.com/d/1P0ZbhWVxXcYU8kJxtpdzm_tNuoBa34NLAubBUgEqsW7-pvEg5NVppTyx/edit?usp=sharing'
      },
      dependencies:[
        cUrlResult.getLibraryInfo()
      ]
    }; 
  }
  
  /**
   * just a wrapper to simplify the drive dapi access
   */
  function DriveJsonApi () {
  
    var ENUMS =  { 
      MIMES: {
        SOURCE:"application/vnd.google-apps.script+json",
        SCRIPT:"application/vnd.google-apps.script",
        FOLDER:"application/vnd.google-apps.folder",
        AUDIO:"application/vnd.google-apps.audio",
        DOCUMENT:"application/vnd.google-apps.document",
        DRAWING:"application/vnd.google-apps.drawing",
        FILE:"application/vnd.google-apps.file",
        FORM:"application/vnd.google-apps.form",
        PHOTO:"application/vnd.google-apps.photo",
        PRESENTATION:"application/vnd.google-apps.presentation",
        SITES:"application/vnd.google-apps.sites",
        FUSIONTABLE:"application/vnd.google-apps.fusiontable",
        SPREADSHEET:"application/vnd.google-apps.spreadsheet",
        UNKNOWN:"application/vnd.google-apps.unknown",
        VIDEO:"application/vnd.google-apps.video"
      }
    };
    
  
    var self = this;
    /** 
     * if you are using ezyauth2 this is usually set by 
     * DriverJsonApi.setAccessToken(doGetPattern({} , constructConsentScreen, function (token) { return token; },'script'))
     */
    self.accessToken= null;
    var lookAhead_ = function(response,attempt) {
      var code = response.getResponseCode();
      return (code === 500 && attempt < 3 ) || code === 403;
    };
    
    /**
     * set a lookahead for a get
     * @param {function} fun the lookahead function
     * @return {cDriveJsonApi} self
     */
    self.setLookAhead = function (fun) {
      lookAhead_ = fun;
      return self;
    };
    
    self.getEnums = function () {
      return ENUMS;
    }
    /**
     * set the access token we'll use for accessing drive dapi
     * @param {string} accessToken
     * @return self
     */
    self.setAccessToken = function (accessToken) {
      if (!accessToken) throw 'accesstoken is not defined';
      self.accessToken = accessToken;
      return self;
    };
    
    self.updateAllParams = function () {
      return "updateViewedDate=false&maxResults=1000";
    };
  
    /**
     * finalize the uri parameters
     * @param {Array.string} params
     * @param {boolean} optOmitStandard whether to omit appending standard parms
     * @return {string} the paramstring
     */
    self.joinParams = function (params, optOmitStandard) {
      var p = "";
      if (params && Array.isArray(params) && params.length) {
        p= "?" + 
          params.filter(function(d) {
            return d;
          })
          .join("&");
      }
      else if (params) {
        p= "?" + params;
      }
      else {
        p= "";
      }
      
      // add standard param
      return optOmitStandard ? p : (p + (p ? "&" : "?" ) + self.updateAllParams());
    }
    /**
     * do an api query
     * @param {string} qString the query string
     * @param {string} optFields a list of fields to include in the response(if missing then all fields)
     * @return {object} a standard results object
     */
    self.query = function (qString,optFields) {
    
      // apend constraint to exclude delted files
      qString += ((qString ? " and " : "") + "trashed=false");
      
      // do the query
      return self.urlGet( this.apiBase() + 
        self.joinParams(["q=" + encodeURIComponent(qString), self.fields(optFields)]));
    };
    
    /**
     * sort out fields
     * @param {string} optFields optional fields
     * @return {string} the fields parameter or ""
     */
    self.fields = function (optFields) {
      return (optFields ? ("fields=" + encodeURIComponent(optFields)) : "");
    };
  
    
   /**
    * given a result from getFileById, return its content
    * @param {object} resultOb a result object
    * @return {object} the content
    */
    self.getFileContentByOb = function (resultOb,optFields) {
    
      // mime types contain "'" so get rid of them
      var k = self.getEnums().MIMES.SOURCE;
  
      // check we have all we need to get the script content
      var success = resultOb.success && resultOb.data.exportLinks && resultOb.data.exportLinks[k];
      
      if (success) {
        // go and get the script content
        return self.urlGet (resultOb.data.exportLinks[k],self.joinParams(self.fields(optFields)));
      }
      else {
        // modify the result ob with failure
        resultOb.success = success;
        resultOb.extended = "couldnt find feed link exportlinks for " + k;
        return resultOb;
      }
    };
  
    
   /**
    * given a fileID, return its info
    * @param {string} id
    * @param {string} optFields
    * @return {object} the response
    */
    self.getFileById = function (id,optFields) {
      return self.urlGet(self.apiBase() + "/" + id + self.joinParams(self.fields(optFields)));
    };
    
   /**
    * function the api base url
    * @param {string} optMod opertion that might chnage the normal base
    * @return {string} the api base url
    */
    self.apiBase = function (optMod) {
      const op = optMod ? optMod + "/" : "";
      return "https://www.googleapis.com/" + op + "drive/v2/files";
    };
  
    /**
     * get the root folder
     * @param {string} optFields the fields to return
     * @return {object} standard results object
     */
    self.getRootFolder = function (optFields) {
      return self.getFileById('root', optFields);
    };
    
    /**
     * get child items for all folders and sub folders
     * @param {string} parentId the id of the parent
     * @param {ENUM.MIMES} optMime the mime type
     * @param {Array.string} optExtraQueries
     * @param {object} standard result 
     */
    self.getRecursiveChildItems = function (parentId,mime,optExtraQueries) {
        
        // need at least items(id)
  
        var fields="items(id)";
        var r = recurse (parentId, []);
        
        // hack result a bit to return consolidated items
        r.result.data.items = r.items; 
        return r.result;
        
        // recursive get contents of all the directories + scripts
        function recurse(id, items) {
          // get any scripts here
          var result = self.getChildItems (id, mime, fields,optExtraQueries);
          
          // accumulate script files
          if(result.success) {
            cUseful.arrayAppend(items, result.data.items); 
  
            // now recurse any folders in this folder
            result = self.getChildFolders (id,fields);
  
            if (result.success) {
              result.data.items.forEach(function(d) {
                recurse (d.id , items);
              });
            }
          }
  
          return {items:items , result:result} ;
        }
    }
    /**
     * get child items
     * @param {string} parentId the id of the parent
     * @param {ENUM.MIMES} optMime the mime type
     * @param {string} optFields the fields to return
     * @param {Array.string} optExtraQueries
     */
    self.getChildItems = function (parentId,mime,optFields,optExtraQueries) {
  
      // add the folder filter
      var q= mime ? ["mimeType='" + mime + "'"] : [];
      
      // dont include anything deleted
      q.push("trashed=false");
      
      //plus any extra queries
      if(optExtraQueries) {
        var e = Array.isArray(optExtraQueries) ? optExtraQueries : [optExtraQueries];
        Array.prototype.push.apply (q,e);
      } 
     
      // do a query
      return self.urlGet (self.apiBase() + "/" + parentId + "/children" + 
        self.joinParams(["q="+encodeURIComponent(q.join(" and ")),self.fields(optFields)]));
    };
    
    /**
     * get files by name
     * @param {string} parentId the parentId
     * @param {string} name the name
     * @param {string} optMime the mime type
     * @param {string} optFields the fields to return
     */
    self.getFilesByName = function (parentId, name , optMime, optFields) {
      return self.getChildItems (parentId, optMime , optFields , "title='" + name + "'");
    }; 
   
    /**
     * put content of a file given its id
     * @param {string} id the id
     * @param {string || object} content the content
     * @return {object} a standard result object
     */
    self.putContentById = function (id,content) {
      return self.urlPost (self.apiBase("upload") + "/" + id + "?uploadType=media",content,"PUT");
    };
  
    /**
     * get content of a file given its id
     * @param {string} id the id
     * @return {object} a standard result object
     */
    self.getContentById = function (id) {
      return self.urlGet(self.apiBase() + "/" + id + "?alt=media");
    };
    /**
     * get files by name or create
     * @param {string} parentId the parentId
     * @param {string} name the name
     * @param {string} optMime the mime type
     * @param {string} optFields the fields to return
     */
    self.getFilesByNameOrCreate = function (parentId, name , optMime, optFields) {
      var result = self.getChildItems (parentId, optMime, optFields , "title='" + name + "'");
      if (result.success && result.data && !result.data.items.length) {
        // lets create it.
        var r = self.createItem(parentId , name , optMime, "id");
        
        // double check to make sure it got created
        result = self.getChildItems (parentId, optMime, optFields , "title='" + name + "'");
      }
      return result;
    }; 
    
    /**
     * get child folders
     * @param {string} parentId the id of the parent
     * @param {string} optFields the fields to return
     * @param {Array.string} optExtraQueries
     */
    self.getChildFolders = function (parentId,optFields,optExtraQueries) {
      return self.getChildItems(parentId , self.getEnums().MIMES.FOLDER , optFields, optExtraQueries) ;
    };
    
   /**
    * create a folder
    * @param {string} parentId the folder parent id
    * @param {string} name the filename
    * @param {string} optFields optional return fields
    * @return }object} a standard result object
    */
    self.createFolder = function (parentId, name,optFields) {
       return self.createItem(parentId , name , self.getEnums().MIMES.FOLDER, optFields);
    };
    
   /**
    * create an item
    * @param {string} parentId the folder parent id
    * @param {string} name the filename
    * @param {string} mime the mimetype,
    * @param {string} optFields optional return fields
    * @return {object} a standard result object
    */
    self.createItem = function (parentId, name,mime, optFields) {
       if(!parentId || typeof parentId !== "string") {
         throw 'parentId invalid for create item';
       }
       return self.urlPost (self.apiBase() + self.joinParams(self.fields(optFields),true) , {
         title:name,
         parents:[{id:parentId}],
         mimeType:mime
       });
    }
    
    /**
     * get a files parents
     * @param {string} id the files id
     * @param {string} optFields optional return fields
     * @return {object} a result object
     */
    self.getParents = function (id,optFields) {
      return self.urlGet (self.apiBase() + "/" + id + "/parents" + self.joinParams(self.fields(optFields)));
    }
    /**
     * get folders by name
     * @param {string} parentId the parentId
     * @param {string} name 
     * @param {string} optFields the fields to return
     */
    self.getFoldersByName = function (parentId, name , optFields) {
      return self.getChildFolders (parentId, optFields , "title='" + name + "'");
    }; 
    
    /**
     * return a folder id from a path like /abc/def/ghi
     * @param {string} path the path
     * @param {boolean} optCreate if true, then create it if it doesnt exist
     * @return {object} {id:'xxxx'} or null
     */
    self.getFolderFromPath = function (path,optCreate)  {
      
      return (path || "/").split("/").reduce ( function(prev,current) {
        if (prev && current) {
          // this gets the folder with the name of the current fragment
          var fldrs = self.getFoldersByName(prev.id,current,"items(id)");
          if(!fldrs.success || true) {
            Logger.log(JSON.stringify(fldrs));
          }
          // see if it existed
          var f = fldrs.success && fldrs.data.items.length ? fldrs.data.items[0] : null;
          
          // if not then create it.
          if (!f && optCreate) {
          
            // create it and return the id of created folder
            var r = self.createFolder(prev.id , current,"id");
            if(r.success && r.data) { 
              f = r.data;
            }
          }
          return f;
        }
        else { 
          return current ? null : prev; 
        }
      },self.getRootFolder("id").data); 
    };
    
    
   /**
    * execute a get
    * @param {string} url the url
    * @return {HTTPResponse}
    */
    self.urlGet = function (url) {
      return cUrlResult.urlGet(url, self.accessToken , undefined, lookAhead_);
    };
  
   /**
    * execute a post
    * @param {string} url the url
    * @param {object} payload the payload
    * @param {string} optMethod the method
    * @return {HTTPResponse}
    */
    self.urlPost = function (url,payload,optMethod) {
      return cUrlResult.urlPost(url, payload, optMethod, self.accessToken,undefined,lookAhead_);
    };
  
    /**
     * this is a standard result object to simply error checking etc.
     * @param {HTTPResponse} response the response from UrlFetchApp
     / @param {string} optUrl the url if given
     * @return {object} the result object
     */
    self.makeResults = function (response,optUrl) {
      return cUrlResult.makeResults(response, optUrl);
    };
  }
  
//--end:Code

//--script file:forPublishing
  
  function showMyScriptAppResource(s) {
    try {
      return ScriptApp.getResource(s);
    }
    catch (err) {
      throw err + " getting script " + s;
    }
  }
  
//--end:forPublishing

  return {
    getLibraryInfo,
    DriveJsonApi,
    showMyScriptAppResource
  }
}
//--end project:cDriveJsonApi