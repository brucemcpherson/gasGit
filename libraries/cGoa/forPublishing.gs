
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
      name:'cGoa',
      version:'1.0.5',
      key:'MZx5DzNPsYjVyZaR67xXJQai_d-phDA33',
      description:'simple library for google oauth2',
      share:'https://script.google.com/d/14sGrM0uhamXv89jexZByhH55fjuC7JA6mooKN52b6vendfTX5OFRgCi7/edit?usp=sharing'
    },
    dependencies:[
      cUseful.getLibraryInfo()
    ]
  }; 
}