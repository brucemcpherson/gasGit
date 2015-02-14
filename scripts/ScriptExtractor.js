"use strict";
/**
 * THIS IS THE ScriptExtractor Object
 *
 * this one takes all scripts from a given folder downwards
 * extracts them, one per folder, to a given contained folder (will be flattened, duplicates are replaced)
 * if the modified date of the script is later than the one contained in the folders info.json
 * updates the info file with things about the run
 * note that unknown files in the extraction folder are left alone(not deleted) - i may (add an option) to change that later
 * since it only porcesses changes, you can run it as many times as you like
 * @param {DriveJsonApi} dapi handler for drive
 * @param {string} extractPath where to extract to
 * @return {ScriptExtractor} self
 */
function ScriptExtractor(dapi,  extractPath) {
  
  var ENUMS = {
    TYPES: {  // extensiona to apply to script types
      server_js:"js",  
      html:"html"
    },
    FIELDS: {  // partial response fields to return based on query
      SCRIPT: "items(id)",
      PROJECT: "id,title,createdDate,modifiedDate,version,exportLinks",
      FEED: "",
      ROOT: "id",
      CHILDREN: "items(id)",
      PARENTS: "items(id)"
    },
    FILES: {
      README:'README.md',
      INFO:'info.json',
      DEPENDENCIES:'dependencies.md'
    }
  };

  var self = this;
  // this is the drive object to use. access token should be already set up
  dapi_ = dapi;
  
  self.setSearch = function (searchPath) {
    searchPath_ = searchPath;
  };
  extractPath_ = extractPath;

  
  /**
   * get the dapi handle we are using
   * @return {DriveJsonApi} the dapi
   */
  self.getDapi = function () {
    return dapi_;
  }
  
  /**
   * return the ENUMS object
   * @return {object} the enums
   */
  self.getEnums = function () {
    return ENUMS;
  };

  // the extraction folder will be created if necessary
  self.extractionRoot = dapi_.getFolderFromPath(extractPath_,true);
  if (!self.extractionRoot) {
    throw 'unable to create/find ' + extractPath_; 
  }
  
  /**
   * get all the folders in the extraction area
   * @return {object} standard result object
   */
  self.getExtractedFolders = function () {
    return dapi.getChildFolders(self.extractionRoot.id,ENUMS.FIELDS.CHILDREN);
  };
  
  /**
   * get the parents
   * @param {string} id the id
   * @return {object} standard result object
   */
  self.getParents = function (id) {
    return dapi_.getParents(id,ENUMS.FIELDS.PARENTS);
  };
  
  /**
   * get all the scripts on drive belonging to me
   * @return {object} a standard drivejsonapi result
   */
  self.getAllMyScripts = function () {
    
    // get the folder where the scripts start from
    var scriptRoot = dapi_.getFolderFromPath (searchPath_);
    if(!scriptRoot) {
      throw 'could not find starting folder for scripts ' + searchPath_;
    }
    
    // get all the scripts below this
    var result = dapi_.getRecursiveChildItems (scriptRoot.id, dapi_.getEnums().MIMES.SCRIPT  ,  "'me' in owners");
    return result;

  };
  
  /** 
  * @param {object} content make a readme file
  * @return {string} marked up readme
  */
  self.makeReadme = function (content) {
    return "# Google Apps Script Project: " + content.title + "\n" +
    "This repo (" + content.repo + ") was automatically created on " + new Date().toLocaleString() + " by GasGit\n" +
    'for more information see the [desktop liberation site](http://ramblings.mcpher.com/Home/excelquirks/drivesdk/gettinggithubready "desktop liberation")\n' +
    'you can see [library and dependency information here](' + ENUMS.FILES.DEPENDENCIES +')\n\n' +
    "Now update manually with details of this project - this skeleton file is committed only when there is no README.md in the repo.";
  };

  /** 
  * @param {object} content make a dependency readme file
  * @return {string} marked up dependency readme
  */
  self.makeDepenciesMd = function (content) {
    return "# Google Apps Script Project: " + content.title + "\n" +
    "This repo (" + content.repo + ") was automatically updated on " + new Date().toLocaleString() + " by GasGit\n\n" +
    'For more information see the [desktop liberation site](http://ramblings.mcpher.com/Home/excelquirks/drivesdk/gettinggithubready "desktop liberation") or ' +
    '[contact me on G+](https://plus.google.com/+BruceMcpherson "Bruce McPherson - GDE")' +
    "\n## Details for Apps Script project " + content.title +
    "\nWhere possibile directly referenced or sub referenced library sources have been copied to this repository" +
    ", or you can include the library references shown. " +
    "\nThe shared link for [" + content.title + " is here](https://script.google.com/d/" + content.id + '/edit?usp=sharing "open in the GAS IDE")\n' +
    "\n### Modules of " + content.title + ".gs included in this repo\n" +
    (content.modules && content.modules.length ? (
      "*name*|*type*\n" +
      "--- | --- \n" + 
      content.modules.map(function(d) {
        return d.name + "| " + d.type;
      }).join("\n")  ) : "no modules found") +
    "\n### Directly referenced libraries\n" + libTable("libraries") + 
    "\n### All dependencies and sub dependencies\n" + libTable("dependencies") + 
    "\n### Enabled Google Services\n" + gTable("google") + 
    '\n###Need more detail ?\nYou can see [full project info as json here](' + ENUMS.FILES.INFO +')\n'; 
    
    function libTable(prop) {
    
      return  (content[prop] && content[prop].length ? (
          "*library*|*identifier*|*key*|*version*|*dev mode*|*source*|\n" +
          "--- | --- | --- | --- | --- | --- \n" +
          content[prop].map(function(d) {
            return d.library + "| " + d.identifier + "|" + d.key +  "|" + d.version + "|" + (d.development ? "yes" : "no") + "|"  + 
            (d.known ? '[here](' + SETTINGS.GIT.LIBRARIES + d.library + ' "library source")' : 'no') ;
          }).join("\n")) : "no libraries discovered") ;
    }
    
    function gTable (prop) {
      return  (content[prop] && content[prop].length ? (
          "*library*|*identifier*|*version*\n" +
          "--- | --- | --- \n" +
          content[prop].map(function(d) {
            return d.library + "| " + d.identifier + "|" + d.version ;
          }).join("\n")) : "no libraries discovered") ;
    }
    

  };
  
   /**
   * get all the scripts on drive belonging to me
   * @return {object} a standard drivejsonapi result
   */
  self.getAllTheInfos = function () {
    
    // get the folder where the scripts start from
    var scriptRoot = dapi_.getFolderFromPath (extractPath_);
    
    if(!scriptRoot) {
      throw 'could not find starting folder for infos ' + extractPath_;
    }
    
    // get all the info.jsons below this
    var result = dapi_.getRecursiveChildItems (scriptRoot.id, undefined ,  "title='"+ENUMS.FILES.INFO+"'");

    if (result.success) {
      result.data.content = result.data.items.map (function (d) {
        var r = self.getInfoContent (d.id, extractPath_);
        if (!r.success || !r.data) {
          throw 'failed to get info content for ' + d.id;
        }
        return r.data;
      });
    }
    return result;

  };
  
  /**
   * @param {string} folderId id of the folder
   * @param {string} folderTitle project title for error message
   * @return {object} regular result object
   */
  self.getOrCreateInfoFile = function (folderId, folderTitle) {
    return self.getOrCreateFile(folderId,folderTitle,ENUMS.FILES.INFO);
  };
  
  /**
   * @param {string} folderId id of the folder
   * @param {string} folderTitle project title for error message
   * @param {object} content the info content
   * @return {object} regular result object
   */
  self.getOrCreateReadMeFile = function (folderId, folderTitle,content) { 
    return self.getOrCreateFile(folderId,folderTitle,ENUMS.FILES.README, function () {
      return self.makeReadme(content);
    });
  };
  
  /**
   * @param {string} folderId id of the folder
   * @param {string} folderTitle project title for error message
   * @param {object} content the info content
   * @return {object} regular result object
   */
  self.createDependenciesMdFile = function (folderId, folderTitle,content) { 
    return self.getOrCreateFile(folderId,folderTitle,ENUMS.FILES.DEPENDENCIES, function () {
      return self.makeDepenciesMd(content);
    }, true);
  };
  
  /**
   * @param {string} folderId id of the folder
   * @param {string} folderTitle project title for error message
   * @param {string} fileName the filename
   * @param {function} newContent how to create default content if file empty or if overwrite
   * @param {boolean} overwrite force overwrite the current contents
   * @return {object} regular result object
   */
  self.getOrCreateFile = function (folderId, folderTitle,fileName,newContent, overWrite) {
    var f = dapi_.getFilesByNameOrCreate (folderId , fileName , null, ENUMS.FIELDS.CHILDREN  ) ;
    if(!f.success || !f.data || !f.data.items || !f.data.items.length) {
      throw "error creating/accessing " + fileName + " for " + folderTitle+ ":" + JSON.stringify(f);
    }
    if (newContent) {
      
      // need to create default content if file is empty
      if (!overWrite) {
        var content = self.getFileContent (f.data.items[0].id , folderTitle , fileName);
      }
      if (overWrite || !content.data || !content.data.length || !content.data[0]) {
        self.putContent (f.data.items[0].id, folderTitle, newContent () );
      }
    
    }
    
    return f;
  };
  
  /**
   * @param {string}  id of the  file
   * @param {string} folderTitle project title for error message
   * @param {string} fileName
   * @return {object} regular result object
   */
  self.getFileContent = function (id, folderTitle, fileName) {
    // now get the media content
    var content = dapi_.getContentById(id);
    if (!content.success) {
      throw "error getting " + fileName + " content for " + folderTitle + ":" + JSON.stringify(content);
    }
    return content;
  };

  /**
   * @param {string} infoId id of the info.json file
   * @param {string} folderTitle project title for error message
   * @return {object} regular result object
   */
  self.getInfoContent = function (infoId, folderTitle) {
    return self.getFileContent (infoId , folderTitle , ENUMS.FILES.INFO);
  };
  
  /**
   * @param {string} infoId id of the info.json file
   * @param {string} folderTitle project title for error message
   * @param {object} content the content to write
   * @return {object} regular result object
   */
  self.putContent = function (infoId, folderTitle, content) {
    // now get the media content
    var content = dapi_.putContentById(infoId,content);
    if (!content.success) {
      throw "error writing info content for " + folderTitle + ":" + JSON.stringify(content);
    }
    return content;
    
  };
  
  /**
   * set the data we updated of an info object to now
   * @return {object} the updated info object
   */
  self.setUpdateTime = function (info) {
    info.sourceWritten = new Date().getTime();
    return info;
  }
    
 /**
  * get the folder location for the given info item
  * @param {object} info an info item
  * @param {Array.string} source the source code for each module
  * @return {object} a result object with the folder to write this stuff to
  */
  self.extract = function (info, source) {
  
    // if there is no folder for the project then create it
    var project = dapi_.getFolderFromPath(extractPath_ + "/" + info.title,true); 
    if(!project) {
      throw 'error creating/accessing project folder for ' + info.title;
    }

    // check the info file
    var dInfo = self.getOrCreateInfoFile(project.id, info.title);
    info.fileId = dInfo.data.items[0].id;
    
    // now get the media content
    var content = self.getInfoContent (info.fileId , info.title);

    // if no content, create some
    var oldInfo = content.data || null;
    
    if (!oldInfo || oldInfo.modifiedDate < info.modifiedDate) {
      info.extracted = true;
      info.repo = cUseful.replaceAll(info.title," " ,"-") ;
     
      
      // extraction process - write the modules
      info.modules.forEach(function (m,i) {
          m.sourceId = self.createAndPut (project.id , m.name + "." + ENUMS.TYPES[m.type] , source[i]);
          m.derivedSha = cUseful.makeSha1Hex(source[i]);
          m.fileName = m.name + "." + ENUMS.TYPES[m.type];
      });
      
      // write the info file
      self.setUpdateTime(info);
      var content = self.putContent (dInfo.data.items[0].id, info.title, info );

    }
    else {
      info.extracted = false;
    }

    return project;
  }
  
 /**
  * create a file if necessary and write to it
  * @param {string} parentId the id of the parent folder
  * @param {string} name the name
  * @param {object || undefined || string} payload what to write
  * @return {string} the id of the created.updated file
  */
  self.createAndPut = function (parentId , name , payload ) {   
    var f = self.getOrCreateFile  (parentId, name , name , function () { 
      return payload; 
    }, true) ;
    
    if(!f.success || !f.data || !f.data.items || !f.data.items.length) {
      throw "error creating/accessing " + name + ":" + JSON.stringify(f);
    }
    return f.data.items[0].id;
  };
    
 
 /**
   * get all the script content and info files
   * @param {Array.object} scripts all the scripts
   * @return {Array.object} the infos
   */
  self.getInfosAndExtract = function (scripts) {
  
    return scripts.map (function (d) {
      
      // design in parallelism 
      
      // we'll use named locks to be able to share
      var lock = new cNamedLock.NamedLock().setKey("getInfosAndExtract",d.id);
      
      if (lock.isLocked()) {
        Logger.log('skipping ' + d.title + ' as its locked');
      }
      
      else {
        return lock.protect( d.id, function () {
          // get the project file
          var project = dapi_.getFileById (d.id,self.getEnums().FIELDS.PROJECT);
          if (!project.success) {
            throw 'failed to get project ' + d.id + ':' + JSON.stringify(project);
          }
          
          // create an info package
          var info = Object.keys(project.data).reduce(function(p,c) {
            // convert anything that looks like a date to a timestamp
            var dc = new Date(project.data[c]).getTime();
            p[c] = isNaN(dc) ? project.data[c] : dc;
            return p;
          },{});;
          info.noticed = new Date().getTime();
          
          // now get the actual file, again limiting to only needed fields
          var feed = dapi_.getFileContentByOb(project,self.getEnums().FIELDS.FEED);
          if (!feed.success) {
            throw 'failed to get feed ' + JSON.stringify(feed);
          }
          
          var source = [];
          // and get info on each of the modules
          info.modules = feed.data.files.map (function (m) {
            // dont want to put the source in the info summary file
            source.push(m.source);
            return Object.keys(m).reduce(function (p,c) {
              if (c != 'source') {
                p[c] =  m[c] ;
              }
              return p;
            } ,{});
          });
          
          // extract the sources
          self.extract (info, source);
          return info;
        }).result;
      }
    });
  };
  
  /**
   * use the gwt dependency service to get all known dependencies for all projects
   * @param {array.object} infos the info.json for all known projects
   * @return {array.object} the updated infos
   */
  self.getKnownDependencies = function (infos) {
  
    // get a ds handler - lets try using the access token of the drive api
    var ds = new cDependencyService.DependencyService().setAccessToken(dapi_.accessToken);
    
    // look at each porject
    infos.forEach(function(d) {
      
      // get top level dependencies
      Logger.log('doing dependencies for ' + d.title);
        var deps = ds.setKey(d.id).getDependencies();
        
        if(!deps.success) {
          Logger.log(deps);
          throw 'dependency service failed - see log';
        }
        else {
          d.libraries = deps.data.custom;
          d.google = deps.data.google;
        }
        
    });
    
    return infos;
  
  };
  
  /**
  * creates a fully resolved list of libraries recursively needed by each project
  * @param {array.object} infos the array of infos for each being analyzed
  * @return {Array.object} the updated infos
  */ 
  self.libResolution = function (infos) {
    
    function recurse(pdep,cob) {
      
      // the currently observed projects libraries
      return cob.libraries.reduce (function (p,c) {

        if (!pdep.some(function(d) {
          return d.library === c.library; 
        })) {
          // we dont already know about this one
          p.push(c);
          var os = infos.filter(function(d) { return c.library === d.title; });
          
          // if we know it then resolve its libraries too.
          c.known = os.length > 0;
          if (c.known) {

            recurse (p , os[0]);
            
          }
        }
        return p;
      },pdep);
      
    }
    
    // kick off
    infos.forEach(function(d) {
      d.dependencies = [];
      return recurse (d.dependencies , d);
    },{});
    
    return infos;
  }
  
 /**
  * creates a fully resolved list of libraries recursively needed by each project
  * @param {array.object} infos the array of infos for each being analyzed
  * @return {ScriptExtractor} self
  */ 
  self.rewriteInfos = function (infos) {

    infos.forEach(function(d) {
      // write the info file
      self.setUpdateTime(d);
      self.putContent (d.fileId, d.title, d );
    });
    return self;
  
  };

 /**
  * does all the wwork of adding dependencies 
  * @param {array.object} infoData the array of infos for each being analyzed
  * @return {ScriptExtractor} self
  */ 
  self.addDependencies = function (infoData){
    
    var infos = infoData.content;
    
    // attach all known libraries
    self.getKnownDependencies(infos);
    
    // recurse to deep resolve them all
    self.libResolution(infos);
    
    return infos;

    
  };

    
  return self;
};