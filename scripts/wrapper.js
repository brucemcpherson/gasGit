/**
 * if you want to use the regular git client,
 * you can do this to create a folder from 
 * various scripts
 * then use the regulr git client to push
 */
function wrapper () {
  //sp

  ['executionapi','addons','advancedservices','contentservice','externalapis','gmail','htmlservice','spreadsheetapp','vbalibrary'].forEach(function(d) {
   
    SETTINGS.EXTRACT.TO = "/books/going gas/assets/goinggas/"+ d +"/gas/source";
    SETTINGS.PARENT.SCRIPTS = ["/books/going gas/assets/goinggas/"+ d +"/gas/scripts"];
    doExtraction();
    doLibraries(); 
    
  });

    ['executionapi'].forEach(function(d) {
   
    SETTINGS.EXTRACT.TO = "/Extraction/repos/"+ d +"/gas/source";
    SETTINGS.PARENT.SCRIPTS = ["/books/going gas/assets/goinggas/"+ d +"/gas/scripts"];
    doExtraction();
    doLibraries(); 
    
  });
}
