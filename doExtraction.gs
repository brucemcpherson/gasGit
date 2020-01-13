"use strict";
function triggerBatch(){
  doExtraction();
  doLibraries();
  doGit();
  
  // if you want a summary sheet - this with your own sheet ID etc.
  doSheet();
}

/**
 * RUN FIRST
 *
 * examine all the scripts owned by me on drive
 * extract their source code id they've been updated after the current contents of the script dump
 * update or create info.json to describe whats' been done
 * each folder will be equivalent to a project
 * each file will be a .js or a .html from the project
 */
function doExtraction () {

  // this is the extractor 
  var extractor = getExtractor();
  
  // for each of the search areas
  var scripts = SETTINGS.PARENT.SCRIPTS.reduce(function(p,c) {
    
    // where to get the input from
    extractor.setSearch(c);
    
    // get all the scripts that I own
    var scriptChunk = extractor.getAllMyScripts();
    if(!scriptChunk.success) {
      throw 'failed to get scripts ' + JSON.stringify(scriptChunk);
    }

    return cUseful.arrayAppend(p,scriptChunk.data.items);
  }, []);
  
  // now scripts contains an array of {id:'xxx'} - these are what need to be processes
  
  
  // this does all the work - extracts all the sources and returns their infos
  var infos = extractor.getInfosAndExtract (scripts);
  
  sumLog(infos);
}

/**
 * get an extractor object
 * @return {ScriptExtractor} the extractor
 */
function getExtractor () {
  
  const scriptApi = new cScriptApi.ScriptApi()
  .init (ScriptApp.getOAuthToken , UrlFetchApp, {
    cacheCrusher:new cUseful.CrusherPluginCacheService()
    .init ({
      store:CacheService.getUserCache()
    })
  })
  .enableCaching(true);
  
  return new ScriptExtractor(
    new cDriveJsonApi.DriveJsonApi()
    .setAccessToken(ScriptApp.getOAuthToken()), 
    SETTINGS.EXTRACT.TO,
    scriptApi
  );
}


/* just to a summary of what happened
 */
function sumLog(infos) {
  
  // summarize
  Logger.log('These projected were extracted on ' + new Date().toLocaleString() + 
    ' from ' + SETTINGS.PARENT.SCRIPTS + ' to ' + SETTINGS.EXTRACT.TO + '\n' + 
    infos.filter(function(d) {
      return d.extracted;
    })
    .map(function(d) {
       return d.title + ':Last version was from ' + new Date(d.modifiedDate).toLocaleString();
    }).join("\n"));
    
  Logger.log('These projected were skipped on ' + new Date().toLocaleString() + 
    ' from ' + SETTINGS.PARENT.SCRIPTS + '\n' + 
    infos.filter(function(d) {
      return !d.extracted;
    })
    .map(function(d) {
       return d.title + ':Last version was from ' + new Date(d.modifiedDate).toLocaleString();
    }).join("\n"));

}

// run last
function doSheet () {
  // this is the extractor handle
  var extractor = getExtractor();

  
  // get all the info files
  var result  = extractor.getAllTheInfos();
  if (!result.success) {
    throw 'failed to get all the infos ' + JSON.stringify(result);
  }
  var infos = result.data.content;
  writeSummarySpreadsheet ({
    infos: infos,
    id: '1DlKpVVYCrCPNfRbGsz6N_K3oPTgdC9gQIKi0aNb42uI',
    name: 'list',
    gitRoot: 'https://github.com/brucemcpherson/',
    searchRoot: 'http://ramblings.mcpher.com/system/app/pages/search?scope=search-site&q=',
    ideRoot: 'https://script.google.com/a/mcpher.com/d/'
  })
}

function writeSummarySpreadsheet(options) {
  if(!options) return;
  const id = options.id;
  const name = options.name;
  const infos = options.infos;
  const gitRoot = options.gitRoot;
  const searchRoot = options.searchRoot;
  const ideRoot =  options.ideRoot;
  if(!id || !name || !infos || !gitRoot) {
    throw 'missing options from summary sheet'
  }
  const fiddler = new cUseful.Fiddler(SpreadsheetApp.openById(id).getSheetByName(name));
  fiddler.setData(infos.map(function(f) {
    return {
      name: f.title,
      id: f.id,
      created: new Date(f.createdDate),
      modified: new Date(f.modifiedDate),
      noticed: new Date(f.noticed),
      github: gitRoot + f.title,
      ideLink: ideRoot ?  ideRoot + f.id + '/edit?usp=drive_web' : '',
      modules: f.modules.map(function(g) {
        return g.name;
      }).join(','),
      searchLink: searchRoot + f.title
    };
  })).dumpValues();
  
}






