"use strict";
/**
 * SET THIS STUFF TO WHATEVER YOU NEED
 */
var SETTINGS = {
  EXTRACT: { // where to put the sources to
    TO:"/Extraction/Scripts"
  },
  PARENT: {  // where to start looking for scripts
    SCRIPTS:[
      "/Published Scripts"
    ]
  },
  DEPENDENCY: { // things for dependency management
    LIST: {
      URL: "https://script.google.com/macros/s/AKfycbwZ2Hht93wTNzvRmYINYF7obaOHciBXWcP_wAiEtyGq70_x3cI/exec"
    }
  },
  GIT: {
    COMMITTER: {
      "name": "Bruce McPherson",
      "email": "bruce@mcpher.com"
    },
    USERAGENT: "brucemcpherson",
    LIBRARIES: "libraries/",
    SCRIPTS: "scripts/"
  }
};

