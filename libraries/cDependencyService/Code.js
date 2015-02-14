"use strict";

function getLibraryInfo () {

  return { 
    info: {
      name:'cDependencyService',
      version:'0.0.2',
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
    * unravel the depedency array
    * @return {object} a standard results object
    */
   self.getDependencies = function () {
   
     // get the gwt array
     var result = self.getGwtDependencyArray();
     var data,p,libOb,libObs;
     
     if (result.success) {
       // now we need to decipher this wierd format
       var dArray = result.data[result.data.length-3];
       if(!Array.isArray(dArray)) {
         result.success = false;
         result.extended = 'did not find a dependency array';
       }
       else {
         data = result.data.slice(0,result.data.length-3).map(function(d){
           return  d >0 ? dArray[d-1] : d;
         });
         
         // decode all that
         var glibs = getGoogle(data);
         var clibs = getCustom(data);
         
         // send them back
         result.data = {
           custom: clibs , 
           google: glibs
         };

       }
     }
     
     function endSkip (id) {
       // skip over the stuff at the end
       
       for( p=data.length -1 ;  p > 1 && !(data[p] === '1j' &&  (data[p-1] === id ||  data[p-2] === id) ) ;p--) {
          /////Logger.log('rejected ' + data.slice(p-2,p+1).map(function(d,i,a) { return a[a.length-i-1]}));
       }

       // pop the stuff before the first id
       while (data[p] !== id && p >1) p--;

       return p;
     }
     
     // get the custom libraries
     function getCustom() {
     
       // reverse engineered so probably some gaps. Im looking initially for private libraries
       // starting at the end,
      Logger.log('starting custom');
       // libs will be here
       libObs = [];
       
       endSkip ("9");
       
       // when we get here we should have the beginning of a custom library section section
       if (p < 2) {
         // no libaries
         Logger.log("there were no customs");
         return libObs;
       }

       // if there were any libs
       while (p> 0 && data[p] === "9") {

         // pop the 9
         p--;
        
        // sometimes there's extra nines - dont know why
         while (data[p] === "9") p--;
           
         // looks like there are 2 versions of library layout.. so there are some optional skips
         libOb = {};
         // sometimes an extra item
         if(data[p--] === "a") {
           libOb.development = (data[p--] === "0");
         }
         else {
           libOb.development = false;
         }

         libOb.identifier = data[p--];

         if(!depCheck (data[p--] === "i")) return result;
         
         libOb.key = data[p--];

         if(!depCheck (data[p--] === "j")) return result;
         
         libOb.sdc = data[p--];
         
         libOb.library = data[p--];
         
         if(!depCheck (data[p--] === "b")) return result;

         if (data[p--] === "c") {
           // sometimes there's an extra one here - dont know why yet
           p--;
         }
         
         libOb.version = data[p--];

         libObs.push(libOb);

       }

       return libObs;

     }

        
     // get the google libraries
     function getGoogle () {
     
       // reverse engineered so probably some gaps. Im looking initially for private libraries
       // starting at the end,
       Logger.log('starting google');
       // libs will be here
       libObs = [];
       
       endSkip ("8");
       
       // when we get here we should have the beginning of a custom library section section
       if (p < 2) {
         Logger.log("there were no googles");
         // no libaries
         return libObs;
       }
       
       // if there were any libs
       while (p> 0 && data[p] === "8") {

         // pop the 8
         p--;
         
         libOb = {};
         // sometimes theres multiple 8s 
         while (p >=0 && data[p] === "8") p--;
         
         // google useful stuff starts after a ""
         
         while (p >= 3 && data[p] !== "" && data[p] !== "1j" && data[p] !== "1h") { 
           p--;
         }
         // we should have hit a ""
         if(!depCheck (p >= 3 && data[p] === "")) return result; 

         // pop the empty string
         p--;
         libOb.identifier = data[p--];
         libOb.library = data[p--];
         libOb.version = data[p--];
         libObs.push(libOb);
       }
       return libObs;

     }

     function depCheck (test) {

       if (!test) {
         Logger.log("failed at:" + p + ":" + data[p]);
         result.success= false;
         result.debug = { 
           data: data,
           p:p,
           datap:data[p],
           libOb:libOb,
           libObs:libObs 
         };
         result.extended = libObs.length + ' library identifier block was not as expected at ' + data[p] + ' pos ' + p;
       }
       return test;
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
         var dependencyArray = JSON.parse(result.content.slice(4).replace(/'/g, '"'));

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
   
   /**
    * get the dependencies in gwt format
    * @return {object} a standard results object
    */
   self.getGwtDependencies = function () {

    return cUrlResult.urlExecute( self.getDependencyUrl() , {
        method:"POST",
        muteHttpExceptions:true,
        payload:'7|1|4|' + self.getGwtUrl() + '|204C9DD3519E8831D0E079DA7B2AEB40|_|getDependencies|1|2|3|4|0|',
        headers: {
          'X-GWT-Permutation':'30B4B043A3667EA6E3D36DF77D1B612A'
        },
        contentType:'text/x-gwt-rpc;charset=UTF-8'
      }, self.accessToken);

   };
   
   /**
    * get the url
    * @return {string} the base url
    */
   self.getDependencyUrl = function () {
     return self.getGwtUrl() + 'dependencyService';
   };
   
   /**
    * get the gwt url
    * @return {string} the base url
    */
   self.getGwtUrl = function () {
     return "https://script.google.com/d/" + self.getKey() + "/gwt/";
   };
}
