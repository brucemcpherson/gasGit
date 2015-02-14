"use strict";

/**
 * RUN FIRST
 * CAN BE RUN IN Paralell or restarted as it uses locking
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
  
  // this does all the work - extracts all the sources and returns their infos
  var infos = extractor.getInfosAndExtract (scripts);

  sumLog(infos);
}

/**
 * get an extractor object
 * @return {ScriptExtractor} the extractor
 */
function getExtractor () {
  return new ScriptExtractor(
    new cDriveJsonApi.DriveJsonApi().setAccessToken(getAccessToken('script')), 
    SETTINGS.EXTRACT.TO
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







