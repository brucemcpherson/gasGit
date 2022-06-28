"use strict";
/**
 * USE YOUR OWN CREDENTIALS THEN DELETE AFTER RUNNING ONCE
 * DONT PUT ON PUBLIC WITH REAL CREDENTIALS 
 *
 * setting your user properties, one time, with your credentials
 * running this will provoke an oauth dialog, since any refresh tokens will be cleared out
 * once you have run this once, you can delete it from this file.
 * @return {void}
 */
function oneTimeSetProperties () {

   // used by all using this script
  var propertyStore = PropertiesService.getUserProperties();

  cGoa.GoaApp.setPackage (propertyStore , { 
    clientId : "76xx0c",
    clientSecret : "5xx44",
    scopes : [
      'gist',
      'repo'
    ],
    service: 'github',
    packageName: 'gasgit'
  });

}

