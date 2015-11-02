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

  cGoa.GoaApp.setPackage (propertyStore , { 
    clientId : "xxx.apps.googleusercontent.com",
    clientSecret : "CH1l3wW6lZofc0jX2OR6iBvi",
    scopes : cGoa.GoaApp.scopesGoogleExpand (['drive','drive.scripts']),
    service: 'google',
    packageName: 'script'
  });

  cGoa.GoaApp.setPackage (propertyStore , { 
    clientId : "xxx",
    clientSecret : "xxx",
    scopes : [
      'gist',
      'repo'
    ],
    service: 'github',
    packageName: 'gasgit'
  });

}