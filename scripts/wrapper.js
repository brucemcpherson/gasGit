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
