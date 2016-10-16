"use strict";

function getLibraryInfo () {
  
  return { 
    info: {
      name:'cDependencyService',
      version:'0.1.0',
      key:'Me90hDkr73ajS2dd-CDc4V6i_d-phDA33',
      description:'dependency service to get libraries associated with a script',
      share:'https://script.google.com/d/1QMZceXe24Rwfgw5jzXlqLsvoBLbmk_lvDBYB5K403wdTVeNu6-uzP5g8/edit?usp=sharing'
    },
    dependencies:[
      cUrlResult.getLibraryInfo()
    ]
  }; 
}


/**
* this uses the gwt dependency service to find out which libraries are used by a sscript
* from reverse engineering gwt rfc protocol https://docs.google.com/a/mcpher.com/document/d/1eG0YocsYYbNAtivkLtcaiEE5IOF5u4LUol8-LL0TIKU/edit
* @return {DependencyService} self
*/
function DependencyService() {
  
  var self = this;
  var scriptKey_ = "";
  self.accessToken = "";
  
  /**
  * set the access token we'll use for accessing drive dapi
  * @param {string} accessToken
  * @return self
  */
  self.setAccessToken = function (accessToken) {
    if (!accessToken) throw 'accesstoken is not defined';
    self.accessToken = accessToken;
    return self;
  };
  
  /**
  * set the script key
  * @param {string} key the script key
  * @return {DependencyService} self
  */
  self.setKey = function (key) {
    scriptKey_ = key;
    return self;
  };
  
  /**
  * get the script key
  * @param {string} key the script key
  * @return {DependencyService} self
  */
  self.getKey = function (key) {
    return scriptKey_;
  };
  
  
  /**
  * unravel the depedency array - this has been much smplified since im now hacking the autocomplete gwt
  * since the dependency gwt stopped working in April2016
  * @return {object} a standard results object
  */
  self.getDependencies = function () {
    
    // get the gwt array
    var result = self.getGwtDependencyArray();
    
    if (result.success) {
      var content = result.data;
      var advanced = content.filter(function(d,i,a) {
        return d.indexOf ('/api/apiary') !== -1 && a.indexOf(d) === i;
      })
      .reduce (function (p,c) {
        var pos = content.indexOf (c);
        var v = c.match(/(\/)([^\/]+)(\/https:%2F%)/);
        var version = v && v.length > 2 ? v[2] : 'unknown';

        p.push ( {
          library:content[pos+2],
          identifier:content[pos+2],
          key:content[pos+2],
          development:0,
          sdc:content[pos+1],
          version:version
        } );
        
        return p;
      },[]);
      
      var libs = content.filter(function(d,i,a) {
        return d.indexOf ('/api/script_lib') !== -1 && a.indexOf(d) === i;
      })
      .reduce (function (p,c) {
        var pos = content.indexOf (c);
        var k = c.match(/(script_lib\/)([^\/]+)/);
        var key = k && k.length > 2 ? k[2] : 'unknown';
        var v = c.match(/\d+$/);
        var version = v && v.length ? v[0] : 'unknown';

        p.push ( {
          library:content[pos+2],
          identifier:content[pos+2],
          key:key,
          development:0,
          sdc:content[pos+1],
          version:version
        } );
        return p;
      },[]);
      
        
      // send them back
      result.data = {
        custom: libs , 
        google: advanced
      };
      
    }       
    else {
      throw JSON.stringify(result);
    }
    
    return result;

  };  
  
  /**
  * get the dependency array
  * @return {object} a standard results object.
  */
  self.getGwtDependencyArray = function () {
    var result = self.getGwtDependencies();
    
    if (result.success) {
      if (result.content.slice(0,4) === "//OK" ) {
        // make it into something parseable
        var stuff = JSON.parse(result.content.slice(4).replace(/'/g, '"'));
        var dependencyArray = stuff[stuff.length-3];
        
        
        if(!Array.isArray(dependencyArray)) {
          result.success = false;
          result.extended = 'did not find a gwt array';
        }
        
        result.data = dependencyArray;
        
      }
      else {
        result.success = false;
        result.extended = "GWT reported a failure - look at the result.content for details";
      }
      
    }
    return result;
  };
  
  // HOW TO DO THIS
  // open the dev console in the IDE
  // find the call to the dependency service
  // change the tail in properties to the code found afetr the url
  // something like this
  // look at the header and get the gwt permutation and put it in the permutation properties
  /**
  * get the dependencies in gwt format
  * @return {object} a standard results object
  */
  self.getGwtDependencies = function () {
    var prop = JSON.parse(PropertiesService.getScriptProperties().getProperty("dependencyParams"));
    
    return cUrlResult.urlExecute( self.getDependencyUrl() , {
      method:"POST",
      muteHttpExceptions:true,
      payload:'7|1|4|' + self.getGwtUrl() + prop.tail, 
      headers: {'X-GWT-Permutation':prop.permutation},
      contentType:'text/x-gwt-rpc;charset=UTF-8'
    }, self.accessToken);
    
  };
  
  /**
  * get the url
  * @return {string} the base url
  */
  self.getDependencyUrl = function () {
    return self.getGwtUrl() + 'autocompleteService';
  };
  
  /**
  * get the gwt url
  * @return {string} the base url
  */
  self.getGwtUrl = function () {
    return "https://script.google.com/d/" + self.getKey() + "/gwt/";
  };
}
