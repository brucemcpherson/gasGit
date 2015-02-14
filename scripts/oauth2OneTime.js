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
  setAuthenticationPackage_ ({ 
    clientId : "xxxx.apps.googleusercontent.com",
    clientSecret : "xxx",
    scopes : [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.scripts'
    ],
    service: 'google',
    packageName: 'script'
  });


  setAuthenticationPackage_ ({ 
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