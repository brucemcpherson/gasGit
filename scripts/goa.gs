//oauth2 auth with goa
function doGet(e) {

  // i need these two
  var fs = ['script','gasgit'] ;

  
  // if we are being called back to get consent then the name of the package will be in the parameters
  var name = cGoa.GoaApp.getName(e);
  if(name) {
    var goa = cGoa.GoaApp.createGoa(name,PropertiesService.getScriptProperties()).execute(e); 
    // renter for consent
    if (goa.needsConsent()) {
      return goa.getConsent();
    }
  }
  
  // if we get here then we look through each one to see if any more consent is needed
  for (var i = 0; i < fs.length ; i++ ) {
    var goa = cGoa.GoaApp.createGoa(fs[i],PropertiesService.getScriptProperties()).execute(); 
    if (goa.needsConsent()) {
      return goa.getConsent();
    }
    if (!goa.hasToken()) throw 'something went wrong with goa - did you check if consent was needed?';
  }
  
  
   return HtmlService.createHtmlOutput ('all tokens created for each of ' + fs.join(','))
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);

}
function getAccessToken(packageName) {
  return  cGoa.GoaApp.createGoa(packageName , PropertiesService.getScriptProperties() ).execute().getToken();

}