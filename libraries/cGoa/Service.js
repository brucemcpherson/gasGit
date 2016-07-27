/**
 * this is the list of known Service and their url package
 * contact me to add to this list permamently so others can have them too.
 */
var Service = (function (service) {
  "use strict";

  /**
  * this list can be added to temporarily by using Service.package.yourprovider = { your url package }
  */
  service.package = {
    "google_service": {
      authUrl : "https://www.googleapis.com/oauth2/v3/token",
      tokenUrl: "https://www.googleapis.com/oauth2/v3/token",
      defaultDuration:600,
      accountType:'serviceaccount',
      checkUrl:"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token="
    },
    "google": {
      authUrl : "https://accounts.google.com/o/oauth2/auth",
      tokenUrl: "https://accounts.google.com/o/oauth2/token",
      refreshUrl: "https://accounts.google.com/o/oauth2/token",
      checkUrl: "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token="
    },
    "linkedin": {
      authUrl : "https://www.linkedin.com/uas/oauth2/authorization",
      tokenUrl: "https://www.linkedin.com/uas/oauth2/accessToken",
      refreshUrl: "https://www.linkedin.com/uas/oauth2/authorization" 
    },
    "soundcloud": {
      authUrl : "https://soundcloud.com/connect",
      tokenUrl: "https://api.soundcloud.com/oauth2/token",
      refreshUrl: "https://api.soundcloud.com/oauth2/token" 
    },
    "podio": {
      authUrl : "https://podio.com/oauth/authorize",
      tokenUrl: "https://podio.com/oauth/token",
      refreshUrl: "https://podio.com/oauth/token" 
    },
    "shoeboxed": {
      authUrl : "https://id.shoeboxed.com/oauth/authorize",
      tokenUrl: "https://id.shoeboxed.com/oauth/token",
      refreshUrl: "https://id.shoeboxed.com/oauth/token" 
    },
    "github": {
      authUrl : "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      refreshUrl: "https://github.com/login/oauth/access_token",
      accept: "application/json"
    },  
    "reddit": {
      authUrl : "https://ssl.reddit.com/api/v1/authorize",
      tokenUrl: "https://ssl.reddit.com/api/v1/access_token",
      refreshUrl: "https://ssl.reddit.com/api/v1/access_token",
      basic:true,
      duration:'permanent'
    },
    "asana": {
      authUrl : "https://app.asana.com/-/oauth_authorize",
      tokenUrl: "https://app.asana.com/-/oauth_token",
      refreshUrl: "https://app.asana.com/-/oauth_token",
    },
    "live": {
      authUrl : "https://login.live.com/oauth20_authorize.srf",
      tokenUrl: "https://login.live.com/oauth20_token.srf",
      refreshUrl: "https://login.live.com/oauth20_token.srf",
    },
    firebase: {
      accountType:'firebase'
    }
  };
  
  return service;
} ) (Service || {}); 



