
function showMyScriptAppResource(s) {
  try {
    return ScriptApp.getResource(s);
  }
  catch (err) {
    throw err + " getting script " + s;
  }
}


function getLibraryInfo () {

  return { 
    info: {
      name:'cEzyOauth2',
      version:'0.0.2',
      key:'MSaYlTXSVk7FAqpHNCcqBv6i_d-phDA33',
      description:'library for google oauth2',
      share:'https://script.google.com/d/1lW9pn80yQH1hbbKsZDJiZTtvioJw8MWppFj8G3FBz7BegvhOSSI6pNYf/edit?usp=sharing'
    },
    dependencies:[
    ]
  }; 
}