"use strict";
/**
 * SET THIS STUFF TO WHATEVER YOU NEED
 */
var SETTINGS = {
  EXTRACT: { // where to put the sources to
    TO: "/Extraction/Scripts"
  },
  PARENT: {  // where to start looking for scripts
    SCRIPTS:[
      "/Published Scripts"
    ]
  },
  GIT: {
    COMMITTER: {
      "name": "Bruce McPherson",
      "email": "bruce@mcpher.com"
    },
    USERAGENT: "brucemcpherson",
    LIBRARIES: "libraries/",
    SCRIPTS: "",
    ALL: false                   // overrides committed dates to do all found items - this'll take ages
  }
};


