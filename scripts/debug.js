function debugDependencyService() {
  
  
  var dapi = new cDriveJsonApi.DriveJsonApi()
  .setAccessToken(getAccessToken('script'))
  // get the meta data .. no sign of libraries here
  var meta = dapi.getFileById ('1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd');
  //Logger.log(JSON.stringify(meta.data));
  
  // this has the source for each of the script files and nothing more.
  var content = dapi.getFileContentByOb(meta);
  //Logger.log(content.data.files.map(function(d) {return Object.keys(d);}));
  
  //curl 'https://script.google.com/a/mcpher.com/d/1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd/gwt/autocompleteService' -H 
  //....'X-Same-Domain: 1' -H 'Origin: https://script.google.com' -H 
  //...'ScrTzFp: ug0r1g-3Cr1g0r2g-3Cr6g0r1g-3Cr1g0r1' 
  //-H 'X-Framework-Xsrf-Token: AJuLMu0ECXou5bhYATCv1dPZSn8FsfsnJw:1461757223853' 
  //-H 'User-Agent: Mozilla/5.0 (X11; CrOS x86_64 7834.60.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.95 Safari/537.36' 
  //...-H 'Lib-id: 1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd' 
  //...-H 'Content-Type: text/x-gwt-rpc; charset=UTF-8' 
  //...-H 'X-GWT-Module-Base: https://script.google.com/a/mcpher.com/d/1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd/gwt/'
  //...-H 'X-GWT-Permutation: D999FDA8959C8D7187349AFFF3EE4F3C' 
  //-H 'Referer: https://script.google.com/a/mcpher.com/d/1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd/edit?usp=drive_web' 
  //--data-binary '7|1|4|https://script.google.com/a/mcpher.com/d/1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd/gwt/|3326EFBA241A9C036104CDEDD0BA4430|_|getInitialAutocompleteUpdate|1|2|3|4|0|' 
  //--compressed
  //{"permutation":"D999FDA8959C8D7187349AFFF3EE4F3C","tail":"|2EEC4241878AE31B209922BFA0F159A1|_|getDependencies|1|2|3|4|0|"}
  
  var url = 'https://script.google.com/a/mcpher.com/d/1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd/gwt/autocompleteService'
  var options = {
    contentType:'text/x-gwt-rpc; charset=UTF-8',
    payload:'7|1|4|https://script.google.com/a/mcpher.com/d/1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd/gwt/|3326EFBA241A9C036104CDEDD0BA4430|_|getInitialAutocompleteUpdate|1|2|3|4|0|',
    method:"POST",
    headers: {
      "X-GWT-Permutation":"D999FDA8959C8D7187349AFFF3EE4F3C"
    }
  };
  var result = UrlFetchApp.fetch (url,options);
  
  var text = result.getContentText();
  var ok = text.slice(0,4);
  if (ok !== '//OK') throw ok;
  
  var stuff = JSON.parse(text.slice(4));
  var content = stuff[stuff.length-3];
  
  var advanced = content.filter(function(d,i,a) {
    return d.indexOf ('/api/apiary') !== -1 && a.indexOf(d) === i;
  })
  .reduce (function (p,c) {
    var pos = content.indexOf (c);
    p.push ( {
      library:content[pos+2],
      identifier:content[pos+2],
      key:content[pos+2],
      development:0,
      sdc:content[pos+1],
      version:c.match(/(\/)(\w+)(\/https:%2F%)/)[2]
    } );
    
    return p;
  },[]);

  var libs = content.filter(function(d,i,a) {
    return d.indexOf ('/api/script_lib') !== -1 && a.indexOf(d) === i;
  })
  .reduce (function (p,c) {
    var pos = content.indexOf (c);
    var key = c.match(/(script_lib\/)([^\/]+)/)[2];
    p.push ( {
      library:content[pos+2],
      identifier:content[pos+2],
      key:key,
      development:0,
      sdc:content[pos+1],
      version:c.match(/\d+$/)[0]
    } );
    return p;
  },[]);
  //BigQuery.Jobs.get(projectId, jobId);
  Logger.log(advanced);
  Logger.log(libs);
  //Logger.log(content.slice(100));
  //DriveApp.createFile('ds',result.getContentText() );
}
