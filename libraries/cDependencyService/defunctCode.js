"use strict";


/**
 * this uses the gwt dependency service to find out which libraries are used by a sscript
 * from reverse engineering gwt rfc protocol https://docs.google.com/a/mcpher.com/document/d/1eG0YocsYYbNAtivkLtcaiEE5IOF5u4LUol8-LL0TIKU/edit
 * @return {DependencyService} self
 */
function DependencyServiceDefunct() {
  
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
        payload:'7|1|4|' + self.getGwtUrl() + prop.tail, //'|2EEC4241878AE31B209922BFA0F159A1|_|getDependencies|1|2|3|4|0|',
        headers: {
          'X-GWT-Permutation':prop.permutation    //'9C8055A1FEB9C7A543C47D445909DC53'
        },
        contentType:'text/x-gwt-rpc;charset=UTF-8'
      }, self.accessToken);

   }
   
   
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
