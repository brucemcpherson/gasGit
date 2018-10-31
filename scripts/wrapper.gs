/**
 * if you want to use the regular git client,
 * you can do this to create a folder from 
 * various scripts
 * then use the regulr git client to push
 * here's some examples of how to fiddle around with this
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

function youtubeWrapper () {


  var folders = [
    {path:'/books/youtube/repo'}
  ];
  
  folders.forEach(function(d) {
    if (d.path) {
      SETTINGS.EXTRACT.TO = d.path + '/source';
      SETTINGS.PARENT.SCRIPTS = [d.path];
      
      doExtraction();
      doLibraries(); 
    }
  });

}
/**
 * if you want to use the regular git client,
 * you can do this to create a folder from 
 * various scripts
 * then use the regulr git client to push
 */
function videosWrapper () {
  
  // get a handler
  var dapi = new cDriveJsonApi.DriveJsonApi()
  .setAccessToken(getAccessToken('script'));
  var c = [1,2,3,4,5,6,7,8,9,10,11,12,13,16,15,16];
  
  var chapters = c.map(function(d,i) {
    return '/books/going gas/admin/video/assets/Chapter ' + (i+1) ;
  });
  
  chapters.push('/books/going gas/admin/video/assets/Shared');
  
  // get all the folders
  var folders = chapters.map(function(d) {

    return {
      scripts:dapi.getFolderFromPath(d,false),
      containers:dapi.getFolderFromPath(d,false),
      source:dapi.getFolderFromPath(d + '/source',false),
      path:d
    }
    
  });
  
  // get any script files

  folders.forEach(function(d) {
    if (d.source) {
      SETTINGS.EXTRACT.TO = d.path + '/source';
      SETTINGS.PARENT.SCRIPTS = [d.path];
      
      doExtraction();
      doLibraries(); 
    }
  });
  

}