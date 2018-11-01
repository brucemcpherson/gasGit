/**
 * becoming a little defunct
 * but here for backwards compat
 */
function getLibraryInfo () {

  return { 
    info: {
      name:'gasGit',
      version:'1.0.0',
      key:"1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd",
      description:'extract sources from apps script and write them to github',
      share:'https://script.google.com/d/1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd/edit?usp=sharing'
    },
    dependencies:[

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
