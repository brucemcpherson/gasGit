"use strict";
/** 
 * RUN THIRD
 * Commits all the data in the extract folders to GIT
 *
 * run all the dependencies and update the info files
 * @return {Array.object} the updated infos
 */
 
function doGit() {

// this is the extractor handle
  var extractor = getExtractor();
  
  // get all the info files
  var result  = extractor.getAllTheInfos();
  if (!result.success) {
    throw 'failed to get all the infos ' + JSON.stringify(result);
  }
  var infos = result.data.content;
  
  // get a git handle
  var git = new GasGit(extractor).setAccessToken( getAccessToken('gasgit'));

  // get all my repos
  var result = git.getMyRepos();
  if (!result.success) {
    throw 'failed to get all the repos ' + JSON.stringify(result);
  }
  var repos = result.data;

  // create any non existent repos
  infos.forEach(function(d){
    
    // see if we know it
    var repo = findRepo(d,repos);
    
    // if not then create it
    if (!repo) {
      var result = git.createRepo (d.repo);
      if(!result.success) {
        throw "error creating " + d.repo;
      }
      else {
        repo = result.data;
      }
      Logger.log('created repo for ' + d.repo);
    }

    // create a readme if there isnt one
    var f = git.getFileByPath(extractor.getEnums().FILES.README,repo);
    if(!f.success) {
      Logger.log('writing ' + extractor.getEnums().FILES.README + ' for ' + repo.name);
      var result = git.getAndCommitAFile (
        d.readmeFileId, 
        extractor.getEnums().FILES.README,
        repo
      );
    }
    
    
  });
  
  // get the updated repos
  var result = git.getMyRepos();
  if (!result.success) {
    throw 'failed to get all the repos ' + JSON.stringify(result);
  }
  var repos = result.data;

  
  // create/update new dependency files
  infos.forEach (function(d) {
    
    // find the repo - it should exist since we would have created it
    var repo = findRepo (d , repos);
    if (!repo) {
      throw 'should have found repo ' + d.repo;
    }
    
    // write dependency contents to git
    Logger.log('writing ' + extractor.getEnums().FILES.DEPENDENCIES + ' for ' + repo.name);
    var result = git.getAndCommitAFile (
      d.dependenciesFileId, 
      extractor.getEnums().FILES.DEPENDENCIES,
      repo
    );
    
    
    // write info file to git
    Logger.log('writing ' + extractor.getEnums().FILES.INFO + ' for ' + repo.name);
    var result = git.getAndCommitAFile (
      d.fileId, 
      extractor.getEnums().FILES.INFO,
      repo
    );
    
    // write the all the modules from the main project
    Logger.log('writing ' + "modules" + ' for ' + repo.name);
    d.modules.forEach(function(m) {
      var result = git.getAndCommitAFile (
        m.sourceId, 
        SETTINGS.GIT.SCRIPTS + m.fileName,
        repo
      );
    });
    
    // write the libraries/dependencies
    Logger.log('writing ' + "libraries" + ' for ' + repo.name);
    d.dependencies.forEach(function(m) {

      // if we find this , then we know it and can write the source
      var f = findInfo (m , infos) ;
      if (f) {
        f.modules.forEach(function(e) {
          var result = git.getAndCommitAFile (
            e.sourceId, 
            SETTINGS.GIT.LIBRARIES + f.title + "/" + e.fileName,
            repo
          );
        });
      }
      if ((!f && m.known) || (f && !m.known)) {
        throw 'should have found library ' +  m.name + ' in repo ' + repo.name;
      }

    });
   
  });
  
  function findInfo (lib,infs) {
     var f;
     
     for (p=0 ; p < infs.length && !f ; p++) {
        if(lib.library === infs[p].title) {
          f = infs[p];
        }
     }
     return f;
  }
  function findRepo (inf,rs) {
     var f;
     
     for (p=0 ; p < rs.length && !f ; p++) {
        if(inf.repo === rs[p].name) {
          f = rs[p];
        }
     }
     return f;
  }
  
  return infos;
}
