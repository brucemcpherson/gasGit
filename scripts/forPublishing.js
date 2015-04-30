/**
 * becoming a little defunct
 * but here for backwards compat
 */
function getLibraryInfo () {

  return { 
    info: {
      name:'gasGit',
      version:'0.0.2',
      key:'M6Heerx1czXDLw7NL4S7pdKi_d-phDA33',
      description:'extract sources from apps script and write them to github',
      share:'https://script.google.com/d/1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd/edit?usp=sharing'
    },
    dependencies:[
      cUseful.getLibraryInfo(),
      cUrlResult.getLibraryInfo(),
      cEzyOauth2.getLibraryInfo(),
      cDriveJsonApi.getLibraryInfo()
    ]
  }; 
}


function showMyScriptAppResource(s) {
  try {
    return ScriptApp.getResource(s);
  }
  catch (err) {
    throw err + " getting script " + s;
  }
}
