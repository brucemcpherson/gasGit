/**
 * this is the list of known Service and their url pockage
 * contact me to add to this list permamently so others can have them too.
 */
var Service = (function (service) {

  const isUndefined = (item) => typeof item === typeof undefined
  const isNull = (item) => item === null
  const isNU = (item) => isNull(item) || isUndefined(item)
  const arrify = (item) => Array.isArray(item) ? item : (isNU(item) ? [] : [item])
  const encoder = (str) => encodeURIComponent(str)
  const codify = (params) => {
    params = arrify(params)
    const pars = params.reduce((p, c) => {
      Object.keys(c).forEach(k => p.push([k, encoder(c[k])].join('=')))
      return p
    }, [])

    return pars.length ? `?${pars.join('&')}` : ''
  }

  /**
  * this list can be added to temporarily by using Service.pockage.yourprovider = { your url pockage }
  */
  service.pockage = {
    // some of the twitter API use credentials only oauth
    twitterAppOnly: {
      tokenUrl: "https://api.twitter.com/oauth2/token",
      basic: true,
      accountType: "credential",
    },
    twitter: {
      authUrl: "https://twitter.com/i/oauth2/authorize",
      tokenUrl: "https://api.twitter.com/2/oauth2/token",
      refreshUrl: "https://api.twitter.com/2/oauth2/token",
      // twitter needs the client id/secret sent over basic authentication to get an access token back
      basic: true,
      customizeOptions: {
        // twitter has some code verification stuff
        codeVerify: (url, pockage) => {
          return `${url}${qiffyUrl(url)}code_challenge=${pockage.id}&code_challenge_method=plain`
        },
        // twitter defines offline access via a scope rather than a url parameter, 
        // so we'll just get rid of it in case its here
        // and sort it out from the consent url
        scopes: (scopes) => {
          const offline = 'offline.access'
          const online = scopes.filter(f => f !== offline)
          return {
            offline: online.concat([offline]),
            online
          }
        },
        // getting a token needs a couple of extra parameters
        token: (options = {}, pockage) => {
          const { payload = {} } = options || {}
          const newOptions = {
            ...options,
            contentType: 'application/x-www-form-urlencoded',
            payload: {
              ...payload,
              code_verifier: pockage.id,
              client_id: pockage.clientId
            }
          }
          return newOptions
        }
      }
    },
    "google_service": {
      authUrl: "https://www.googleapis.com/oauth2/v3/token",
      tokenUrl: "https://www.googleapis.com/oauth2/v3/token",
      defaultDuration: 600,
      accountType: 'serviceaccount',
      checkUrl: "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token="
    },
    "google": {
      authUrl: "https://accounts.google.com/o/oauth2/auth",
      tokenUrl: "https://accounts.google.com/o/oauth2/token",
      refreshUrl: "https://accounts.google.com/o/oauth2/token",
      checkUrl: "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token="
    },
    "linkedin": {
      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
      refreshUrl: "https://www.linkedin.com/oauth/v2/accessToken"
    },
    "soundcloud": {
      authUrl: "https://soundcloud.com/connect",
      tokenUrl: "https://api.soundcloud.com/oauth2/token",
      refreshUrl: "https://api.soundcloud.com/oauth2/token"
    },
    "podio": {
      authUrl: "https://podio.com/oauth/authorize",
      tokenUrl: "https://podio.com/oauth/token",
      refreshUrl: "https://podio.com/oauth/token"
    },
    "shoeboxed": {
      authUrl: "https://id.shoeboxed.com/oauth/authorize",
      tokenUrl: "https://id.shoeboxed.com/oauth/token",
      refreshUrl: "https://id.shoeboxed.com/oauth/token"
    },
    "github": {
      authUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      refreshUrl: "https://github.com/login/oauth/access_token",
      accept: "application/json"
    },
    "reddit": {
      authUrl: "https://ssl.reddit.com/api/v1/authorize",
      tokenUrl: "https://ssl.reddit.com/api/v1/access_token",
      refreshUrl: "https://ssl.reddit.com/api/v1/access_token",
      basic: true,
      duration: 'permanent'
    },
    "asana": {
      authUrl: "https://app.asana.com/-/oauth_authorize",
      tokenUrl: "https://app.asana.com/-/oauth_token",
      refreshUrl: "https://app.asana.com/-/oauth_token",
    },
    "live": {
      authUrl: "https://login.live.com/oauth20_authorize.srf",
      tokenUrl: "https://login.live.com/oauth20_token.srf",
      refreshUrl: "https://login.live.com/oauth20_token.srf",
    },
    "paypal_sandbox": {
      authUrl: "https://api.sandbox.paypal.com/v1/oauth2/token",
      tokenUrl: "https://api.sandbox.paypal.com/v1/oauth2/token",
      refreshUrl: "https://api.sandbox.paypal.com/v1/oauth2/token",
      basic: true,
      accountType: "credential",
      accept: "application/json"
    },
    "paypal_live": {
      authUrl: "https://api.paypal.com/v1/oauth2/token",
      tokenUrl: "https://api.paypal.com/v1/oauth2/token",
      refreshUrl: "https://api.paypal.com/v1/oauth2/token",
      basic: true,
      accountType: "credential",
      accept: "application/json"
    },
    classy: {
      authUrl: "https://api.classy.org/oauth2/auth",
      tokenUrl: "https://api.classy.org/oauth2/auth",
      refreshUrl: "https://api.classy.org/oauth2/auth",
      accountType: "credential"
    },
    quickbooks: {
      authUrl: "https://appcenter.intuit.com/connect/oauth2",
      tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      refreshUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
    },
    firebase: {
      accountType: 'firebase'
    },
    vimeo: {
      authUrl: "https://api.vimeo.com/oauth/authorize",
      tokenUrl: "https://api.vimeo.com/oauth/access_token",
      refreshUrl: "https://api.vimeo.com/oauth/access_token"
    }
  };

  return service;
})(Service || {});



