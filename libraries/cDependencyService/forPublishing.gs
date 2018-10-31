
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
      name:'cDependencyService',
      version:'0.0.8',
      key:'Me90hDkr73ajS2dd-CDc4V6i_d-phDA33',
      description:'dependency service to get libraries associated with a script',
      share:'https://script.google.com/d/1QMZceXe24Rwfgw5jzXlqLsvoBLbmk_lvDBYB5K403wdTVeNu6-uzP5g8/edit?usp=sharing'
    },
    dependencies:[
      cUrlResult.getLibraryInfo()
    ]
  }; 
}

