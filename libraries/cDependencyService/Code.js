"use strict";

function getLibraryInfo () {

  return { 
    info: {
      name:'cDependencyService',
      version:'0.0.7',
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

     var data,p,libObs,workData;
     
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

         // send them back
         result.data = {
           custom: getCustom() , 
           google: getGoogle()
         };
         
       }
       
     }       
     else {
       throw JSON.stringify(result);
     }

     return result;
     
     function getCustom () {
       // reverse engineered so probably some gaps

       // libs will be here
       libObs = [];
       p = 0;
       workData = data;
       
       // find the data
       ignoreTill (["www.googleapis.com"]);
       p++;
       
       // they start at 1j
       ignoreTill(["1j"]);
       var start = p++;
       
       // and finish at 1j
       ignoreTill(["1j"]);
       var finish = p;

       // this is the cusom part
       workData = data.slice ( start+1 , finish); 
       p = 0;
       
       // get all the dependencies
       while (p < workData.length) {

         var libOb = {};
         libOb.version = workData[p++];
           
           // name introduced by d
         if (cUseful.isUndefined(ignoreTill(["d"]))) {
           // force exit - we're done
           p = workData.length;
         }
         
         else {    
           libOb.library = workData[++p];
           libOb.sdc = workData[++p];
           
           // key introduced by l
           ignoreTill(["l"]);
           libOb.key = workData[++p];
           
           //identifier introduced by k
           ignoreTill(["k"]);
           libOb.identifier = workData[++p];
           
           // development version 0
           libOb.development = workData[++p] === 0;
           
           // done
           libObs.push(libOb);
           
           // find the next one
           ignoreTill(["b"]);
           p++;
         }
         
       }

       return libObs;
       
     }
     
     function getGoogle () {
       // reverse engineered so probably some gaps. Im looking initially for private libraries
      
       // libs will be here
       libObs = [];
       
       p = 0;
       
       // this one works better in reverse
       workData = data.reverse();
      
       // find the data
       ignoreTill (['/']);
       p++;
       ignoreTill (['']);
       var start = p;
       
       ignoreTill (["1j"]);
       var finish = p;
      
       // this is the google part
       workData = data.slice ( start , finish); 
       p = 0;
      
       // get all the dependencies
       while (p < workData.length) {
         if (!cUseful.isUndefined(ignoreTill (['']))) {
           var libOb = {};
           libOb.library = libOb.identifier = libOb.key = workData[++p]; // eg Drive API
           libOb.sdc = libOb.key = workData[++p]; // eg drive	
           libOb.version = workData[++p]; // eg v2        
           // done
           libObs.push(libOb);
         }
       }
       return libObs;
       
     }
     
    
     function ignore () {
       while (p < workData.length && 'delkf'.indexOf(workData[p]) >= 0 ) {
         p++;
       }
       return p < workData.length ? workData[p] : undefined;
     }
     
     function ignoreTill (target) {
       while (p < workData.length &&  target.indexOf (workData[p]) < 0 ) { 
         p++;
       }
       return p <workData.length ?workData[p] : undefined;
     }
      
    
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
        payload:'7|1|4|' + self.getGwtUrl() + '|6B9902874FFB0209D71ED9EB07886D5E|_|getDependencies|1|2|3|4|0|',
        headers: {
          'X-GWT-Permutation':'9C8055A1FEB9C7A543C47D445909DC53'
        },
        contentType:'text/x-gwt-rpc;charset=UTF-8'
      }, self.accessToken);

   }
// discovered 9/3/15
//   payload:'7|1|4|' + self.getGwtUrl() + '|62E5DDB596B94438DAD2C2B90696CEF0|_|getDependencies|1|2|3|4|0|',
//     headers: {
//       'X-GWT-Permutation':'2C70220EABC9BBFDA8F26FCE531090C3'
//     },
// discovered 9/22/15  
//X-GWT-Permutation:9C8055A1FEB9C7A543C47D445909DC53
//7|1|4|https://script.google.com/a/mcpher.com/d/1TphrUjRcx5sGlhgkfjB2R9MOZe3cPF7wK1LV8yVNoFCAwRTeNyXVsDFd/gwt/|6B9902874FFB0209D71ED9EB07886D5E|_|getDependencies|1|2|3|4|0|
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
