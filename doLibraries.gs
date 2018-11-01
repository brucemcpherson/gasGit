"use strict";
/** 
 * RUN SECOND
 * UPDATES ALL THE INFO FILES IN THE EXTRACTO FOLDER
 *
 * run all the dependencies and update the info files
 * @return {Array.object} the updated infos
 */
function doLibraries () {
  var extractor = getExtractor();
  
  // get all the info files
  var result  = extractor.getAllTheInfos();
  if (!result.success) {
    throw 'failed to get all the infos ' + JSON.stringify(result);
  }

  var infoData = result.data;
  
  // now add all the dependencies and rewrite the info files
  extractor.addDependencies(infoData);
  
  // create all the readmes and reference files
  infoData.items.forEach(function(d,i){
    
    // the info file content
    var content = infoData.content[i];

    // the parent folder
    var parentId = extractor.getParents(d.id).data.items[0].id;
    
    // make an MD file if there isnt one
    var md = extractor.getOrCreateReadMeFile(parentId, content.title ,content);
    content.readmeFileId = md.data.items[0].id;
    
    // make a new dependencies md file
    var md= extractor.createDependenciesMdFile(parentId , content.title, content);
    content.dependenciesFileId = md.data.items[0].id;

  });
  
  // make a new set of info files
  return extractor.rewriteInfos(infoData.content);

}

