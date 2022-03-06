//--project:1EbLSESpiGkI3PYmJqWh3-rmLkYKAtCNPi1L2YCtMgo2Ut8xMThfJ41Ex (cUseful) version:130
//  imported by bmImportLibraries at Sun, 06 Mar 2022 16:14:19 GMT
function __cUseful_v130 () {
  
  //--script file:Code
  /** useful functions
   * cUseful
   **/
  
  /**
   * test for a date objec
   * @param {*} ob the on to test
   * @return {boolean} t/f
   */
  function isDateObject (ob) {
    return isObject(ob) && ob.constructor && ob.constructor.name === "Date";
  }
  
  /**
   * test a string is an email address
   * from http://www.regular-expressions.info/email.html
   * @param {string} emailAddress the address to be tested
   * @return {boolean} whether it is and email address
   */
  function isEmail (emailAddress) {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailAddress);
  }
  /**
   * used to create a random 2 dim set of values for a sheet
   * @param {number} [rows=10] number of rows to generate
   * @param {number} [columns=8] number of columns to generate
   * @param {number} [min=0] minimum number of characeters per cell
   * @param {number} [max=20] maximum number of characters per cell
   * @return {String[][]} values for sheet or docs tabe
   */
  function getRandomSheetStrings (rows,columns,min,max) {
    min = typeof min == typeof undefined ?  2 : min;
    max = typeof max == typeof undefined ?  20 : max;
    rows = typeof rows == typeof undefined ?  2 : rows;
    columns = typeof columns == typeof undefined ?  20 : columns;
    
    return new Array(rows).join(',').split(',').map (function() {
      return new Array (columns).join(',').split(',').map(function() {
        var size = Math.floor(Math.random() * (max- min + 1)) + min;
        return size ? new Array(size).join(',').split(',').map(function() {
          var s = String.fromCharCode(Math.floor(Math.random() * (0x7E - 0x30 + 1)) + 0x30); 
          // don't allow = as 1st character
          if (s.slice(0,1) === '=') s = 'x' + s.slice(1);
          return s;
        }).join('') : '';
      });
    });
  }
  /** 
   * generateUniqueString
   * get a unique string
   * @param {number} optAbcLength the length of the alphabetic prefix
   * @return {string} a unique string
   **/
  function generateUniqueString (optAbcLength) {
    return Utils.generateUniqueString (optAbcLength);
  }
  
  /** 
   * check if item is undefined
   * @param {*} item the item to check
   * @return {boolean} whether it is undefined
   **/
  function isUndefined (item) {
    return typeof item === 'undefined';
  }
  
  /** 
   * check if item is undefined
   * @param {*} item the item to check
   * @param {*} defaultValue the default value if undefined
   * @return {*} the value with the default applied
   **/
  function applyDefault (item,defaultValue) {
    return isUndefined(item) ? defaultValue : item;
  } 
  
  
  /** 
   * get an arbitrary alpha string
   * @param {number} length of the string to generate
   * @return {string} an alpha string
   **/
  function arbitraryString (length) {
    return Utils.arbitraryString (length);
  }
  
  /** 
   * randBetween
   * get an random number between x and y
   * @param {number} min the lower bound
   * @param {number} max the upper bound
   * @return {number} the random number
   **/
  function randBetween(min, max) {
    return Utils.randBetween(min, max);
  }
  
  /** 
   * checksum
   * create a checksum on some string or object
   * @param {*} o the thing to generate a checksum for
   * @return {number} the checksum
   **/
  function checksum(o) {
    // just some random start number
    var c = 23;
    if (!isUndefined(o)){
      var s =  (isObject(o) || Array.isArray(o)) ? JSON.stringify(o) : o.toString();
      for (var i = 0; i < s.length; i++) {
        c += (s.charCodeAt(i) * (i + 1));
      }
    }
    
    return c;
  }
    
  /** 
   * isObject
   * check if an item is an object
   * @memberof DbAbstraction
   * @param {object} obj an item to be tested
   * @return {boolean} whether its an object
   **/
  function isObject (obj) {
    return obj === Object(obj);
  }
  
  /** 
   * clone
   * clone an object by parsing/stringifyig
   * @param {object} o object to be cloned
   * @return {object} the clone
   **/
  function clone (o) {
    return o ? JSON.parse(JSON.stringify(o)) : null;
  };
  
  /**
   * recursive rateLimitExpBackoff()
   * @param {function} callBack some function to call that might return rate limit exception
   * @param {number} [sleepFor=750] optional amount of time to sleep for on the first failure in missliseconds
   * @param {number} [maxAttempts=5] optional maximum number of amounts to try
   * @param {number} [attempts=1] optional the attempt number of this instance - usually only used recursively and not user supplied
   * @param {boolean} [optLogAttempts=false] log re-attempts to Logger
   * @param {function} [optchecker] function should throw an error "force backoff" if you want to force a retry
   * @return {*} results of the callback 
   */
  var TRYAGAIN = "force backoff anyway";
  function rateLimitExpBackoff ( callBack, sleepFor ,  maxAttempts, attempts , optLogAttempts , optChecker) {
  
    // can handle multiple error conditions by expanding this list
    function errorQualifies (errorText) {
      
      return ["Exception: Service invoked too many times",
              "Exception: Rate Limit Exceeded",
              "Exception: Quota Error: User Rate Limit Exceeded",
              "Service error:",
              "Exception: Service error:", 
              "Exception: User rate limit exceeded",
              "Exception: Internal error. Please try again.",
              "Exception: Cannot execute AddColumn because another task",
              "Service invoked too many times in a short time:",
              "Exception: Internal error.",
              "Exception: ???????? ?????: DriveApp.",
              "User Rate Limit Exceeded",
              TRYAGAIN
  
             ]
              .some(function(e){
                return  errorText.toString().slice(0,e.length) == e  ;
              });
    }
    
    
    // sleep start default is  .75 seconds
    sleepFor = Math.abs(sleepFor || 750);
    
    // attempt number
    attempts = Math.abs(attempts || 1);
    
    // maximum tries before giving up
    maxAttempts = Math.abs(maxAttempts || 5);
    
    // make sure that the checker is really a function
    if (optChecker && typeof(callBack) !== "function") {
      throw errorStack("if you specify a checker it must be a function");
    }
    
    // check properly constructed
    if (!callBack || typeof(callBack) !== "function") {
      throw ("you need to specify a function for rateLimitBackoff to execute");
    }
    
    // try to execute it
    else {
      
      try {
  
        var r = callBack();
        
        // this is to find content based errors that might benefit from a retry
        return optChecker ? optChecker(r) : r;
        
      }
      catch(err) {
      
        if(optLogAttempts)Logger.log("backoff " + attempts + ":" +err);
        // failed due to rate limiting?
        if (errorQualifies(err)) {
          
          //give up?
          if (attempts > maxAttempts) {
            throw errorStack(err + " (tried backing off " + (attempts-1) + " times");
          }
          else {
            
            // wait for some amount of time based on how many times we've tried plus a small random bit to avoid races
            Utilities.sleep (Math.pow(2,attempts)*sleepFor + (Math.round(Math.random() * sleepFor)));
            
            // try again
            return rateLimitExpBackoff ( callBack, sleepFor ,  maxAttempts , attempts+1,optLogAttempts);
          }
        }
        else {
          // some other error
          throw errorStack(err);
        }
      }
    }
  }
  
  /**
   * get the stack
   * @return {string} the stack trace
   */
  function errorStack(e) {
    try {
      // throw a fake error
      throw new Error();  //x is undefined and will fail under use struct- ths will provoke an error so i can get the call stack
    }
    catch(err) {
      return 'Error:' + e + '\n' + err.stack.split('\n').slice(1).join('\n');
    }
  }
  /**
   * append array b to array a
   * @param {Array.*} a array to be appended to 
   * @param {Array.*} b array to append
   * @return {Array.*} the combined array
   **/
  function arrayAppend (a,b) {
    // append b to a
    if (b && b.length)Array.prototype.push.apply(a,b);
    return a;
  }
  
  /**
   * escapeQuotes()
   * @param {string} s string to be escaped
   * @return {string} escaped string
   **/
  function escapeQuotes( s ) {
    return (s + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  }
  
  /** get an array of objects from sheetvalues and unflatten them
   * @parameter {Array.object} values a 2 dim array of values return by spreadsheet.getValues()
   * @return {object} an object
   **/
  function getObjectsFromValues  (values) {
    var obs = [];
    for (var i=1 ; i < values.length ; i++){
      var k = 0;
      obs.push(values[i].reduce (function (p,c) {
        p[values[0][k++]] = c;
        return p;
      } , {}));
    }
    return obs;
    
  }
  
  /* ranking an array of objects
   * @param {Array.object} array the array to be ranked
   * @param {function} funcCompare the comparison function f(a,b)
   * @param {function} funcStoreRank how to store rank f ( object , rank (starting at zero) , arr (the sorted array) )
   * @param {function} funcGetRank how to get rank f ( object)
   * @param {boolean} optOriginalOrder =false retin the original order
   * @return {Array.object} the array, sorted and with rank
   */
  function arrayRank (array,funcCompare,funcStoreRank,funcGetRank,optOriginalOrder) {
    
    // default compare/getter/setters
    funcCompare = funcCompare ||   function (a,b) {
          return a.value - b.value;
        };
    funcStoreRank = funcStoreRank || function (d,r) {
          d.rank = r; 
          return d;
        };
    funcGetRank = funcGetRank || function (d) {
          return d.rank;
        } ;
        
    var sortable =  optOriginalOrder ? array.map(function (d,i) { d._xlOrder = i; return d; }) : array; 
        
    sortable.sort (function (a,b) {
      return funcCompare (a,b);
    })
    .forEach (function (d,i,arr) {
      funcStoreRank (d, i ? ( funcCompare(d, arr[i-1]) ?  i: funcGetRank (arr[i-1]) ) : i, arr );
    });
    
    if (optOriginalOrder) { 
      sortable.forEach (function (d,i,a) {
        funcStoreRank ( array[d._xlOrder], funcGetRank(d) , a );
      });
    }
    
    return array;
  }
  
  /**
   * format catch error
   * @param {Error} err the array to be ranked
   * @return {string} formatted error
   */
  function showError (err) {
  
    try {
      if (isObject(err)) {
        if (err.message) {
          return "Error message returned from Apps Script\n" + "message: " + err.message + "\n" + "fileName: " + err.fileName + "\n" + "line: " + err.lineNumber + "\n";
        }
        else {
          return JSON.stringify(err);
        }
      }
      else {
        return err.toString();
      }
    }
    catch (e) {
      return err;
    }
  }
  
  
   /**
   * identify the call stack
   * @param {Number} level level of call stack to report at (1 = the caller, 2 the callers caller etc..., 0 .. the whole stack
   * @return {object || array.object} location info - eg {caller:function,line:string,file:string};
   */
  function whereAmI(level) {
    
    // by default this is 1 (meaning identify the line number that called this function) 2 would mean call the function 1 higher etc.
    level = typeof level === 'undefined' ? 1 : Math.abs(level);
  
    
    try {
      // throw a fake error
      throw new Error();  //x is undefined and will fail under use struct- ths will provoke an error so i can get the call stack
    }
    catch (err) {
      // return the error object so we know where we are
      var stack = err.stack.split('\n');
  
      if (!level) {
        // return an array of the entire stack
        return stack.slice(0,stack.length-1).map (function(d) {
          return deComposeMatch(d);
        });
      }
      else {
      
        // return the requested stack level 
        return deComposeMatch(stack[Math.min(level,stack.length-1)]);
      }
  
    }
    
    function deComposeMatch (where) {
      var file, line, caller;
  
      /*
      // approach 1
      file = /at\s(.*):/.exec(where);
      line =/:(\d*)/.exec(where);
      caller =/:.*\((.*)\)/.exec(where);
      */
      // at some point apps script changed format
      // actually this doesnt work at all anymore when part of a library
      // it always returns Object.whoAmI
      if(!caller) {
        caller = where.replace(/\s*?at\s*([^\s]*).*/,'$1');
        file = where.replace(/.*\(([^:]*).*/,'$1');
        line = where.replace(/[^:]*:(\d+).*/,'$1');
      }
    
      return {
        caller:caller ? caller :  'unknown',
        line: line ? line : 'unknown',
        file: file ? file : 'unknown'
      };
    }
  }
  
  /**
   * return an object describing what was passed
   * @param {*} ob the thing to analyze
   * @return {object} object information
   */
  function whatAmI (ob) {
  
    try {
      // test for an object
      if (ob !== Object(ob)) {
          return {
            type:typeof ob,
            value: ob,
            length:typeof ob === 'string' ? ob.length : null 
          } ;
      }
      else {
        try {
          var stringify = JSON.stringify(ob);
        }
        catch (err) {
          var stringify = '{"result":"unable to stringify"}';
        }
        return {
          type:typeof ob ,
          value : stringify,
          name:ob.constructor ? ob.constructor.name : null,
          nargs:ob.constructor ? ob.constructor.arity : null,
          length:Array.isArray(ob) ? ob.length:null
        };       
      }
    }
    catch (err) {
      return {
        type:'unable to figure out what I am'
      } ;
    }
  }
  
  /**
   * a little like the jquery.extend() function
   * the first object is extended by the 2nd and subsequent objects - its always deep
   * @param {object} ob to be extended
   * @param {object...} repeated for as many objects as there are
   * @return {object} the first object extended
   */
  function extend () {
    
      // we have a variable number of arguments
      if (!arguments.length) {
        // default with no arguments is to return undefined 
        return undefined;
      }
      
      // validate we have all objects
      var extenders = [],targetOb;
      for (var i = 0; i < arguments.length; i++) {
        if(arguments[i]) {
          if (!isObject(arguments[i])) {
            throw 'extend arguments must be objects not ' + arguments[i];
          }
          if (i ===0 ) {
            targetOb = arguments[i];
          } 
          else {
            extenders.push (arguments[i]);
          }
        }
      }
      
      // set defaults from extender objects
      extenders.forEach(function(d) {
          recurse(targetOb, d);
      });
      
      return targetOb;
     
      // run do a deep check
      function recurse(tob,sob) {
        Object.keys(sob).forEach(function (k) {
        
          // if target ob is completely undefined, then copy the whole thing
          if (isUndefined(tob[k])) {
            tob[k] = sob[k];
          }
          
          // if source ob is an object then we need to recurse to find any missing items in the target ob
          else if (isObject(sob[k])) {
            recurse (tob[k] , sob[k]);
          }
          
        });
      }
  }
  
  /**
   * @param {string} inThisString string to replace in
   * @param {string} replaceThis substring to be be replaced
   * @param {string} withThis substring to replace it with
   * @return {string} the updated string
   */
  function replaceAll(inThisString, replaceThis, withThis) {
    return inThisString.replace (new RegExp(replaceThis,"g"), withThis);
  }
  
  /** 
   * make a hex sha1 string
   * @param {string} content some content
   * @return {string} the hex result
   */
  function makeSha1Hex (content) {
    return byteToHexString(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, content));
  }
  /**
   * convert an array of bytes to a hex string
   * @param {Array.byte} bytes the byte array to convert
   * @return {string} the hex encoded string
   */
  function byteToHexString (bytes) {
    return bytes.reduce(function (p,c) {
      return p += padLeading ((c < 0 ? c+256 : c).toString(16), 2 );
    },'');
  }
  /**
   * pad leading part of string
   * @param {string} stringtoPad the source string
   * @param {number} targetLength what the final string length should be
   * @param {string} padWith optional what to pad with - default "0"
   * @return {string} the padded string
   */
  function padLeading (stringtoPad , targetLength , padWith) {
    return (stringtoPad.length <  targetLength ? Array(1+targetLength-stringtoPad.length).join(padWith | "0") : "" ) + stringtoPad ;
  }
  /**
   * get base64 encoded data as a string
   * @param {string} b64 as a string
   * @return {string} decoded as as string
   */
  function b64ToString ( b64) {
    return Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString();
  }
  
  /**
   * checks that args are what they should be
   * you can convert a functions arguments to an array and call like this
   * you can use the special type any to allow undefined as a valid argument
   * validateArgs (Array.prototype.slice.call(arguments), [... expected types ...]);
   * @param {Array} args the arguments to check
   * @param {Array.string} types what to check them against
   * @param {boolean} optFail whether to throw an error if no match [default=true]
   * @return {object} whether args are okay. - test for .ok.. will throw and error if optFail is true
   */
  function validateArgs (funcArgs , funcTypes , optFail) {
  
    // just clean & clone the args arrays
    var args = Array.isArray(funcArgs) ? funcArgs.slice(0) : (funcArgs ? [funcArgs] : []) ;
    var types = Array.isArray(funcTypes) ? funcTypes.slice(0) : (funcTypes ? [funcTypes] : []);
    var fail = applyDefault(optFail, true);
    
    // we'll allow for any args
    if (args.length < types.length) {
      args = arrayAppend(args, new Array(types.length - args.length));
    }
    
    // should be same length now
    if (args.length !== types.length) {
      throw "validateArgs failed-number of args and number of types must match("+args.length+":"+types.length+")" + JSON.stringify(whereAmI(0));
      
    }
    
    // now we need to check every type of the array
    for (var i=0,c = {ok:true}; i<types.length && c.ok;i++) {
      c = check ( types[i] , args[i], i);
    }
    return c;
    
    // this does the checking
    function check(expect,  item , index) {
      
      var isOb = isObject(item);
      var got = typeof item;
      
      // if its just any old object we can let it go
      if ((isOb && expect === "object") || (got === expect)) {
        return {ok:true};
      }
      
      // for more complicated objects we can check for constructor names
      var cName = (isOb && item.constructor && item.constructor.name) ?  item.constructor.name : "" ;
      
      if (cName === "Array") {
        //what should be expected is Array.type
        if (expect.slice(0,cName.length) !== cName  && expect.slice(0,3) !== "any") {
          return report (expect, got, index, cName);
        }
        
        // this is the type of items in this array
        var match = new RegExp("\\.(\\w*)").exec(expect);
        var arrayType = match && match.length > 1 ? match[1] : "";
        
        // any kind of array will do?
        if (!arrayType) {
          return {ok:true};
        }
        // now we need to check every element of the array
        for (var i=0,c = {ok:true}; i<item.length && c.ok;i++) {
          c = check ( arrayType , item[i] , index,i);
        }
        return c;
        
      }
      
      // these all match
      else if (cName === expect || expect === "any") {
        return {ok:true};
      }
      
      // this is a fail
      else {
        return report (expect, got , index,cName);
      }
      
    }
    
    function report (expect,got,index,name,elem) {
      var state =  {
        ok:false,
        location:whereAmI(0),
        detail: {
          index: index ,
          arrayElement: applyDefault(elem, -1),
          type: types[index],
          expected: expect,
          got: got
        }
      };
      
      if (fail) {
        throw JSON.stringify(state); 
      }
      return state;
    }
  }
  /**
   * create a column label for sheet address, starting at 1 = A, 27 = AA etc..
   * @param {number} columnNumber the column number
   * @return {string} the address label 
   */
  function columnLabelMaker (columnNumber,s) {
    s = String.fromCharCode(((columnNumber-1) % 26) + 'A'.charCodeAt(0)) + ( s || '' );
    return columnNumber > 26 ? columnLabelMaker ( Math.floor( (columnNumber-1) /26 ) , s ) : s;
  }
  /**
  * general function to walk through a branch
  * @param {object} parent the head of the branch
  * @param {function} nodeFunction what to do with the node
  * @param {function} getChildrenFunctiontion how to get the children
  * @param {number} depth optional depth of node
  * @return {object} the parent for chaining
  */
  function traverseTree (parent, nodeFunction, getChildrenFunction, depth) {
    
    depth = depth || 0;
    // if still some to do
    if (parent) {
      
      // do something with the header
      nodeFunction (parent, depth++);
      
      // process the children
      (getChildrenFunction(parent) || []).forEach ( function (d) {
        traverseTree (d , nodeFunction , getChildrenFunction, depth);
      });
      
    }
    return parent;
  }
  /**
   * takes a function and its arguments, runs it and times it
   * @param {func} the function
   * @param {...} the rest of the arguments
   * @return {object} the timing information and the function results
   */
  function timeFunction () {
  
      var timedResult = {
        start: new Date().getTime(),
        finish: undefined,
        result: undefined,
        elapsed:undefined
      }
      // turn args into a proper array
      var args = Array.prototype.slice.call(arguments);
      
      // the function name will be the first argument
      var func = args.splice(0,1)[0];
      
      // the rest are the arguments to fn - execute it
      timedResult.result = func.apply(func, args); 
      
      // record finish time
      timedResult.finish = new Date().getTime();
      timedResult.elapsed = timedResult.finish - timedResult.start;
      
      return timedResult;
  }
  
  /**
  * remove padding from base 64 as per JWT spec
  * @param {string} b64 the encoded string
  * @return {string} padding removed
  */
  function unPadB64 (b64) {
    return b64 ?  b64.split ("=")[0] : b64;
  }
  
  /**
  * b64 and unpad an item suitable for jwt consumptions
  * @param {string} itemString the item to be encoded
  * @return {string}  the encoded
  */
  function encodeB64 (itemString) {
    return unPadB64 (Utilities.base64EncodeWebSafe( itemString));
  }
//--end:Code

//--script file:Utils
  
  /**
  * libary for use with Going Gas Videos
  * Utils contains useful functions 
  * @namespace
  */
  var Utils = (function (ns) {
    /**
    * recursive rateLimitExpBackoff()
    * @param {function} callBack some function to call that might return rate limit exception
    * @param {object} options properties as below
    * @param {number} [attempts=1] optional the attempt number of this instance - usually only used recursively and not user supplied
    * @param {number} [options.sleepFor=750] optional amount of time to sleep for on the first failure in missliseconds
    * @param {number} [options.maxAttempts=5] optional maximum number of amounts to try
    * @param {boolean} [options.logAttempts=true] log re-attempts to Logger
    * @param {function} [options.checker] function to check whether error is retryable
    * @param {function} [options.lookahead] function to check response and force retry (passes response,attemprs)
    * @return {*} results of the callback 
    */
    
    ns.expBackoff = function ( callBack,options,attempts) {
      
      //sleepFor = Math.abs(options.sleepFor ||
      
      options = options || {};
      var optionsDefault = { 
        sleepFor:  750,
        maxAttempts:5,                  
        checker:errorQualifies,
        logAttempts:true
      }
      
      // mixin
      Object.keys(optionsDefault).forEach(function(k) {
        if (!options.hasOwnProperty(k)) {
          options[k] = optionsDefault[k];
        }
      });
      
      
      // for recursion
      attempts = attempts || 1;
      
      // make sure that the checker is really a function
      if (typeof(options.checker) !== "function") {
        throw ns.errorStack("if you specify a checker it must be a function");
      }
      
      // check properly constructed
      if (!callBack || typeof(callBack) !== "function") {
        throw ns.errorStack("you need to specify a function for rateLimitBackoff to execute");
      }
      
      function waitABit (theErr) {
        
        //give up?
        if (attempts > options.maxAttempts) {
          throw errorStack(theErr + " (tried backing off " + (attempts-1) + " times");
        }
        else {
          // wait for some amount of time based on how many times we've tried plus a small random bit to avoid races
          Utilities.sleep (
            Math.pow(2,attempts)*options.sleepFor + 
            Math.round(Math.random() * options.sleepFor)
          );
          
        }
      }
      
      // try to execute it
      try {
        var response = callBack(options, attempts);
        
        // maybe not throw an error but is problem nevertheless
        if (options.lookahead && options.lookahead(response,attempts)) {
          if(options.logAttempts) { 
            Logger.log("backoff lookahead:" + attempts);
          }
          waitABit('lookahead:');
          return ns.expBackoff ( callBack, options, attempts+1) ;
          
        }
        return response;
      }
      
      // there was an error
      catch(err) {
        
        if(options.logAttempts) { 
          Logger.log("backoff " + attempts + ":" +err);
        }
        
        // failed due to rate limiting?
        if (options.checker(err)) {
          waitABit(err);
          return ns.expBackoff ( callBack, options, attempts+1) ;
        }
        else {
          // some other error
          throw ns.errorStack(err);
        }
      }
      
      
    }
    
    /**
    * get the stack
    * @param {Error} e the error
    * @return {string} the stack trace
    */
    ns.errorStack = function  (e) {
      try {
        // throw a fake error
        throw new Error();  //x is undefined and will fail under use struct- ths will provoke an error so i can get the call stack
      }
      catch(err) {
        return 'Error:' + e + '\n' + err.stack.split('\n').slice(1).join('\n');
      }
    }
    
    
    // default checker
    function errorQualifies (errorText) {
      
      return ["Exception: Service invoked too many times",
              "Exception: Rate Limit Exceeded",
              "Exception: Quota Error: User Rate Limit Exceeded",
              "Service error:",
              "Exception: Service error:", 
              "Exception: User rate limit exceeded",
              "Exception: Internal error. Please try again.",
              "Exception: Cannot execute AddColumn because another task",
              "Service invoked too many times in a short time:",
              "Exception: Internal error.",
              "User Rate Limit Exceeded",
              "Exception: ???????? ?????: DriveApp.",
              "Exception: Address unavailable",
              "Exception: Timeout",
              "GoogleJsonResponseException: Rate Limit Exceeded" 
             ]
      .some(function(e){
        return  errorText.toString().slice(0,e.length) == e  ;
      }) ;
      
    }
    
    
    
    /**
    * convert a data into a suitable format for API
    * @param {Date} dt the date
    * @return {string} converted data
    */
    ns.gaDate = function  (dt) {
      return Utilities.formatDate(
        dt, Session.getScriptTimeZone(), 'yyyy-MM-dd'
      );
    }
    
    /** 
    * execute a regex and return the single match
    * @param {Regexp} rx the regexp
    * @param {string} source the source string
    * @param {string} def the default value
    * @return {string} the match
    */
    ns.getMatchPiece = function (rx, source, def) {
      var f = rx.exec(source);
      
      var result = f && f.length >1 ? f[1] : def;
      
      // special hack for boolean
      if (typeof def === typeof true) {
        result = ns.yesish ( result );
      }
      
      return result;
    };
    
    /** 
    * generateUniqueString
    * get a unique string
    * @param {number} optAbcLength the length of the alphabetic prefix
    * @return {string} a unique string
    **/
    ns.generateUniqueString = function (optAbcLength) {
      var abcLength = ns.isUndefined(optAbcLength) ? 3 : optAbcLength;
      return  (new Date().getTime()).toString(36)  + ns.arbitraryString(abcLength) ;
    };
    
    /** 
    * get an arbitrary alpha string
    * @param {number} length of the string to generate
    * @return {string} an alpha string
    **/
    ns.arbitraryString = function (length) {
      var s = '';
      for (var i = 0; i < length; i++) {
        s += String.fromCharCode(ns.randBetween ( 97,122));
      }
      return s;
    };
    
    /**
     * check something is a blob
     * not a comprehensive test
     */
    ns.isBlob = function (blob) {
      
      // apps script tends to return the name as blob
      if (ns.isObject(blob) && blob.toString() === 'Blob') return true
      // pre v8 test
      return blob && typeof blob === "object" && 
          typeof blob.setContentTypeFromExtension === "function" && 
          typeof blob.getBytes === "function";
    };
    /** 
    * randBetween
    * get an random number between x and y
    * @param {number} min the lower bound
    * @param {number} max the upper bound
    * @return {number} the random number
    **/
    ns.randBetween = function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    ns.yesish = function(s) {
      var t = s.toString().toLowerCase();
      return t === "yes" || "y" || "true" || "1";
    };
    
    /** 
    * check if item is undefined
    * @param {*} item the item to check
    * @return {boolean} whether it is undefined
    **/
    ns.isUndefined = function (item) {
      return typeof item === 'undefined';
    };
    
    /** 
    * isObject
    * check if an item is an object
    * @param {object} obj an item to be tested
    * @return {boolean} whether its an object
    **/
    ns.isObject = function (obj) {
      return obj === Object(obj);
    };
    
    /** 
    * checksum
    * create a checksum on some string or object
    * @param {*} o the thing to generate a checksum for
    * @return {number} the checksum
    **/
    ns.checksum = function (o) {
      // just some random start number
      var c = 23;
      if (!ns.isUndefined(o)){
        var s =  (ns.isObject(o) || Array.isArray(o)) ? JSON.stringify(o) : o.toString();
        for (var i = 0; i < s.length; i++) {
          c += (s.charCodeAt(i) * (i + 1));
        }
      }
      
      return c;
    };
    
    /**
    * @param {[*]} arguments unspecified number and type of args
    * @return {string} a digest of the arguments to use as a key
    */
    ns.keyDigest = function () {
      
      // conver args to an array and digest them
      return  Utilities.base64EncodeWebSafe (
        Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1,Array.prototype.slice.call(arguments).map(function (d) {
          return (Object(d) === d) ? JSON.stringify(d) : d.toString();
        }).join("-"),Utilities.Charset.UTF_8));
    };
    
    /**
    * creates a  closure function to categorize values
    * @param {...var_arg} arguments takes any number of arguments
    * @return {function} a closure function
    */
    ns.categorize = function (var_arg) {
      
      //convert the arguments to an array after sorting
      var domain_ = Array.prototype.slice.call(arguments);
      
      // prepare some default labels
      var labels_ = domain_.map (function (d,i,a) {
        return (i ? '>= ' + a[i-1] + ' ' : '' ) + '< ' + d ;
      });
      
      // last category
      labels_.push (domain_.length ? ('>= ' + domain_[domain_.length-1]) : 'all');
      
      /**
      * gets the category given a domain
      * @param {*} value the value to categorize
      * @return {number} the index in the domain
      */
      function getCategory (value) {
        var index = 0;
        while (domain_[index] <= value) {
          index++;
        }
        return index;
      }
      
      
      // closure function
      return function (value) { 
        
        return Object.create(null, {
          index:{
            get:function () {
              return getCategory(value);
            }
          },
          label:{
            get:function () {
              return labels_[getCategory(value)];
            }
          },
          labels:{
            get:function () {
              return labels_;
            },
            set:function (newLabels) {
              if (domain_.length !== newLabels.length-1) {
                throw 'labels should be an array of length ' + (domain_.length+1);
              }
              labels_ = newLabels;
            }
          },
          domain:{
            get:function () {
              return domain_;
            }
          },
          toString:{
            value:function (){
              return this.label;
            }
          }
        }); 
      };
    }
    
    /**
    * digest a blob
    * @param {Blob} blob the blob
    * @return {string} the sha1 of the blob
    */
    ns.blobDigest = function(blob) {
      return ns.keyDigest(Utilities.base64Encode(blob.getBytes()));
    };
    
    /**
    * this is clone that will really be an extend
    * @param {object} cloneThis
    * @return {object} a clone
    */
    ns.clone = function (cloneThis) {
      return ns.vanExtend ({} , cloneThis);
    };
    
    /**
     * a short cut to add nested properties to a an object
     * @param {object} [base] the base object
     * @param {string} propertyScheme something like "a.b.c" will extend as necessary
     * @return {object} base updated
     */
     ns.propify = function (propertyScheme ,base) {
      
      // if base not specified, create it
      if (typeof base === typeof undefined) base = {};
      
      // make sure its an object
      if (typeof base !== typeof {} ) throw 'propify:base needs to be an object';
      
      // work through the scheme
      (propertyScheme || "").split (".")
        .reduce (function (p,c) {
        
          // add a branch if not already existing
          if (typeof p[c] === typeof undefined) p[c] = {};
          
          // make sure we're not overwriting anything
          if (typeof p[c] !== typeof {}) throw 'propify:branch ' + c + ' not an object in ' + propertyScheme;
          
          // move down the branch
          return p[c];
    
        } , base);
      
      // now should have the required shape
      return base;
    
    };
  
    /**
    * recursively extend an object with other objects
    * @param {[object]} obs the array of objects to be merged
    * @return {object} the extended object
    */
    ns.vanMerge = function(obs) {
      return (obs || []).reduce(function(p, c) {
        return ns.vanExtend(p, c);
      }, {});
    };
    /**
    * recursively extend a single obbject with another 
    * @param {object} result the object to be extended
    * @param {object} opt the object to extend by
    * @return {object} the extended object
    */
    ns.vanExtend = function(result, opt) {
      result = result || {};
      opt = opt || {};
      return Object.keys(opt).reduce(function(p, c) {
        // if its an object
        if (ns.isVanObject(opt[c])) {
          p[c] = ns.vanExtend(p[c], opt[c]);
        } else {
          p[c] = opt[c];
        }
        return p;
      }, result);
    };
    /**
    * use a default value if undefined
    * @param {*} value the value to test
    * @param {*} defValue use this one if undefined
    * @return {*} the new value
    */
    ns.fixDef = function(value, defValue) {
      return typeof value === typeof undefined ? defValue : value;
    };
    /**
    * see if something is undefined
    * @param {*} value the value to check
    * @return {bool} whether it was undefined
    */
    ns.isUndefined = function(value) {
      return typeof value === typeof undefined;
    };
    /**
    * simple test for an object type
    * @param {*} value the thing to test
    * @return {bool} whether it was an object
    */
    ns.isVanObject = function(value) {
      return typeof value === "object" && !Array.isArray(value);
    }
    
    /**
    * crush for writing to cache.props
    * @param {string} crushThis the string to crush
    * @return {string} the b64 zipped version
    */
    ns.crush = function (crushThis) {
      return Utilities.base64Encode(Utilities.zip ([Utilities.newBlob(JSON.stringify(crushThis))]).getBytes());
    };
    
    /**
    * uncrush for writing to cache.props
    * @param {string} crushed the crushed string
    * @return {string} the uncrushed string
    */
    ns.uncrush = function (crushed) {
      return Utilities.unzip(Utilities.newBlob(Utilities.base64Decode(crushed),'application/zip'))[0].getDataAsString();
    };
    
    /**
     * find the index of an item in an array
     * @param {[*]} arr the array
     * @param {function} func the compare func ( received item, index, arr)
     * @return {number} the index
     */
    ns.findIndex = function ( arr ,func) {
      var k = 0;
      
      if (!Array.isArray (arr)) throw 'findIndex arg should be an array';
      if (typeof func !== "function") throw 'findindex predictate should be a function';
      while (k < arr.length) {
        if (func (arr[k] , k , arr)) {
          return k;
        }
        k++;
      }
      return -1;
    };
    
    /**
     * find the item in an array
     * @param {[*]} arr the array
     * @param {function} func the compare func ( received item, index, arr)
     * @return {number} the index
     */
    ns.find = function ( arr ,func) {
      
      var k = ns.findIndex (arr , func );
      return k === -1 ? undefined : arr[k];
    };
    
    /**
    * find disconnected tables in a range of values
    * @nameSpace FindTableRange
    */
    ns.findTableBlocks = function (values, options) {
      
      var MODES = {
        cells:"cells",
        position:"position"
      };
      
      // set default options
      options = ns.vanExtend ({
        mode:MODES.cells,    // how to select the best block
        rank:0,               // if position 1 .. n, 0 (0 is the biggest), if size 1..n, (0 is the biggest)
        rowTolerance:0,      // allow  blank row & column to be part of the data
        columnTolerance:0    
      }, options);
      
      // check the options are good
      options.mode = options.mode.toLowerCase();
      if (!MODES[options.mode]) {
        throw 'invalid mode ' + options.mode + ':mode needs to be one of ' + Object.keys (MODES).map(function(k) { return MODES[k];}).join(",");
      }
      
      if (!values || !Array.isArray(values) || !Array.isArray(values[0])) {
        throw 'values must be an array of arrays as returned by getValues'
      }
      // use a fiddler for reviewing the data
      var fiddler = new Fiddler()
      .setHasHeaders(false)
      .setValues (values.slice())
      
      var headers = fiddler.getHeaders();
      var data = fiddler.getData();
      
      // get all the blank rows and columns, but get rid of any that are sequential
      var blankRows = getBlankRows_ ();
      
      
      //there's an implied blank row & col at the end of the data
      blankRows.push (fiddler.getNumRows());
      
      //
      // find the blocks of non blank data
      var blocks = blankRows.reduce (function (p,c) {
        // the block im working on
        var current = p[p.length-1];
        
        // the number of rows will be the difference between the last start point and the blank row
        current.size.rows = c - current.start.row;
        
        // a row might generate several column chunks
        if (current.size.rows) {
  
          var columnFiddler = new Fiddler()
          .setHasHeaders(false)
          .setValues(values.slice (current.start.row, current.size.rows + current.start.row));
          
          // get blank columns in this chunk           
          var blankColumns = getBlankColumns_ (columnFiddler);
          blankColumns.push (columnFiddler.getNumColumns());
        }
        else {
          blankColumns = [0];
        }
        
        blankColumns.forEach (function (d,i,a) {
          current.size.columns = d - current.start.column;
          
          if (i<a.length) {
            current = {start:{row:current.start.row ,column:d+1}, size: {rows:current.size.rows , columns:0}};
            p.push(current);
          }
        });
        
        // get ready for next chunk
        var up = {start:{row:c + 1 ,column:0}, size: {rows:0 , columns:0}};
        p.push(up);
        
        return p;
      } , [{start: {row:0,column:0},size:{rows:0,columns:0}}])
      .filter(function (d) {
        // get rid of the ones with no actual size
        return d.size.rows >0 && d.size.columns >0;
      })
      .map (function (d,i) {
        // add some useful things
        d.a1Notation = ns.columnLabelMaker(d.start.column + 1) + (d.start.row +1) + ":" 
        + ns.columnLabelMaker(d.start.column + d.size.columns ) + (d.start.row + d.size.rows);
        d[MODES.cells] = d.size.columns * d.size.rows;
        d[MODES.position] = i;
        return d;
      })
      .sort (function (a,b) {
        return a[options.mode] - b[options.mode];
      });
      
      // this is the preferred one
      var selected = blocks[options.rank ? options.rank -1 : blocks.length -1];
      
      // remove any data we don't need
  
      fiddler
      .filterRows(function (d, props) {
        return props.rowOffset >= selected.start.row && props.rowOffset < selected.start.row + selected.size.rows;
      })
      .filterColumns(function (d,props) {
        return props.columnOffset >= selected.start.column && props.columnOffset < selected.start.column + selected.size.columns;
      });
     
      return {
        blankRows:blankRows,
        blocks:blocks,
        selected:{
          block:selected,
          values:fiddler.createValues()
        }
      };
      
      // get all the blank rows - will be an array of row indexes
      function getBlankRows_ () {
        return fiddler.getData()
        .map(function (d,i) {
          return i;
        })
        .filter (function (p) {
          return Object.keys(data[p]).every (function (d) {
            return data[p][d] === "";
          });
        })
        .filter (function (d,i,a) {
          // if they are all blank for the row tolerance
          // the the filtered index will be equal to 
          // the current value + rowTolerace
          // but we dont want to tolerate blank leading rows, so they are always blank.
          return a[i+options.rowTolerance] === d+options.rowTolerance || 
            a.slice(0,i+1).every(function(p,j) { return j === p; });
        });
  
      }
      
      
      //get all the blank columns in each row - will be an array of column indexes
      function getBlankColumns_ (fid) {
        
        var h = fid.getHeaders();
        return h.map(function (d,i) {
          return i;
        })
        .filter(function (p) {
          var uniqueValues = fid.getUniqueValues(headers[p]);
          return !uniqueValues.length || uniqueValues.length === 1 && uniqueValues[0] === "";
        })
        .filter (function (d,i,a) {
          return a[i+options.columnTolerance] === d+options.columnTolerance || 
            a.slice(0,i+1).every(function(p,j) { return j === p; });
        });
       
      }
      
      
    };
    
    function curry (func) {
      
      // get the arguments and stop the first
      var args = Array.prototype.slice.call (arguments,1);
      
      // if there's no more, the call the func and we're done
      // otherwise we need to create a new curry function with the latest verstion
      // of the arguments
      return args.length === func.length ? 
        func.apply (undefined , args) :
      curry.bind.apply ( curry , [this , func].concat (args));  
      
    };
    
    ns.curry = function () {
      return curry.apply ( null , Array.prototype.slice.call (arguments));
    }
  
    // These byte fiddlers were extracted and modified from 
    // https://github.com/tanaikech/ImgApp
  
    // The MIT License (MIT)
    // Copyright (c) 2017 Kanshi TANAIKE
    ns.byte2hex_num = function(data) {
      var conv;
      conv = (data < 0 ? data + 256 : data).toString(16);
      return conv.length == 1 ? "0" + conv : conv;
    };
  
    ns.byte2hex = function(data) {
  
  
      var conv = data.map(function(f) { 
        return (f < 0 ? f + 256 : f).toString(16)
      })
      return conv.map(function(f){
         return f.length == 1 ? "0" + f : f
      })
    };
  
    ns.byte2num = function(data, byteorder) {
      var conv, datlen, j;
      if (byteorder) {
        datlen = data.length;
        conv = new Array(datlen);
        j = 0;
        for (var i=datlen-1; i>=0; i-=1){
          var temp = (data[i] < 0 ? data[i] + 256 : data[i]).toString(16);
          if (temp.length == 1) {
            temp = "0" + temp;
          }
          conv[j] = temp;
          j += 1;
        };
      } else {
        conv = ns.byte2hex(data);
      }
      return ns.hex2num( conv);
    };
  
    ns.hex2num = function(data) {
      return parseInt(data.join(""), 16);
    };
  
    
    // json n/l delimited
    ns.ndjson = function (arr) {
      if (!Array.isArray(arr)) arr =[arr];
      return arr.map (function (r) {
        return JSON.stringify(r) 
      }).join ("\n");
    };
   
   /**
   * append array b to array a
   * @param {Array.*} a array to be appended to 
   * @param {Array.*} b array to append
   * @return {Array.*} the combined array
   */
    ns.arrayAppend  = function (a,b) {
      // append b to a
      if (b && b.length)Array.prototype.push.apply(a,b);
      return a;
    }
  
    /**
    * add query to path
    * @param {object} query
    * @param {string} startPath
    * @return string the path
    */
    ns.addQueryToPath = function  (query, startPath) {
      query = ns.isUndefined (query) || query === null ? {} : query;
      if (typeof query !== "object" ) throw 'query must be an object';
      var qString = Object.keys (query)
      .map (function (k) {
        return k+ "=" + encodeURI (query[k]);
      })
      .join ("&");
      return startPath + (qString ? ((startPath.indexOf("?") === -1 ? "?" : "&" ) + qString) : "");
    };
  
    return ns;
  }) (Utils || {});
  
//--end:Utils

//--script file:DriveUtils
  /**
  * Utils contains useful functions for working with drive
  * you must provide run DriveUtils.setService(yourdriveapp) before using
  * @namespace
  */
  var DriveUtils = (function (ns) {
    
    
    var ENUMS =  { 
      MIMES: {
        SOURCE:"application/vnd.google-apps.script+json",
        SCRIPT:"application/vnd.google-apps.script",
        FOLDER:"application/vnd.google-apps.folder",
        AUDIO:"application/vnd.google-apps.audio",
        DOCUMENT:"application/vnd.google-apps.document",
        DRAWING:"application/vnd.google-apps.drawing",
        FILE:"application/vnd.google-apps.file",
        FORM:"application/vnd.google-apps.form",
        PHOTO:"application/vnd.google-apps.photo",
        PRESENTATION:"application/vnd.google-apps.presentation",
        SITES:"application/vnd.google-apps.sites",
        FUSIONTABLE:"application/vnd.google-apps.fusiontable",
        SPREADSHEET:"application/vnd.google-apps.spreadsheet",
        UNKNOWN:"application/vnd.google-apps.unknown",
        VIDEO:"application/vnd.google-apps.video",
        gadget:"application/xml",
        xml:"text/xml",
        json:"application/json"
      }
    };
    
    ns.getShortMime = function (mimeType) {
      var f = Object.keys(ENUMS.MIMES).filter(function(k) {
        return ENUMS.MIMES[k] === mimeType;
      });
      return f.length ? f[0].toLowerCase() : mimeType.toLowerCase();
    };
    // for handling advanced services
    ns.ads = (function (ads) {
      
      /**
      * get files by name
      * @param {string} parentId the parentId
      * @param {string} name the name
      * @param {string} optMime the mime type
      * @param {string} optFields the fields to return
      */
      ads.getFilesByName = function (parentId, name , optMime, optFields) {
        return ads.getChildItems (parentId, optMime , optFields || "items/id" , "title='" + name + "'" + " and mimeType!='" + ENUMS.MIMES.FOLDER + "'" );
      }; 
      
      ads.getFoldersByName = function (parentId, name , optFields) {
        return ads.getChildFolders (parentId, optFields || "items/id" , "title='" + name + "'");
      }; 
      
      ads.getChildFiles = function (parentId, optMime, optFields , optExtraQueries) {
        return ads.getChildItems (parentId, optMime , optFields || "items/id" , "mimeType!='" + ENUMS.MIMES.FOLDER + "'" );
      }; 
      
      /**
      * get child folders
      * @param {string} parentId the id of the parent
      * @param {string} optFields the fields to return
      * @param {Array.string} optExtraQueries
      */
      ads.getChildFolders = function (parentId,  optFields, optExtraQueries) {
        return ads.getChildItems(parentId , ENUMS.MIMES.FOLDER , optFields || "items/id", optExtraQueries) ;
      }; 
      /**
      * get child items
      * @param {string} parentId the id of the parent
      * @param {ENUM.MIMES} optMime the mime type
      * @param {string} optFields the fields to return
      * @param {Array.string} optExtraQueries
      */
      ads.getChildItems = function (parentId,mime,optFields,optExtraQueries) {
        
        // add the folder filter
        var q= mime ? ["mimeType='" + mime + "'"] : [];
        
        // dont include anything deleted
        q.push("trashed=false");
        
        //plus any extra queries
        if(optExtraQueries) {
          var e = Array.isArray(optExtraQueries) ? optExtraQueries : [optExtraQueries];
          Array.prototype.push.apply (q,e);
        } 
        
        var options= {};
        if (optFields) {
          options.fields = optFields;
        }
        if(options.fields && options.fields.indexOf("nextPageToken") === -1) options.fields = (options.fields ? options.fields + "," : "") + "nextPageToken";
        
        options.q = q.join(" and ");  
        
        var items =[] , pageToken;
  
        do {
          
          var result = Utils.expBackoff(function() {
            return ns.service.Children.list(parentId,options);
  
          },{ logAttempts:false});
  
          
          pageToken = result.nextPageToken;
          Array.prototype.push.apply(items , result.items);
          options.pageToken = pageToken;
          
          
        } while (pageToken);
        
        return items;
        
      };
        
      /**
      * return a folder id from a path like /abc/def/ghi
      * @param {string} path the path
      * @param {boolean} [create=false] create it
      * @return {object} {id:'xxxx'} or null
      */
      ads.getFolderFromPath = function (path)  {
        
        return (path || "/").split("/").reduce ( function(prev,current) {
          if (prev && current) {
            // this gets the folder with the name of the current fragment
            var fldrs = ads.getFoldersByName(prev.id,current);
            return fldrs.length ? fldrs[0] : null;
          }
          else { 
            return current ? null : prev; 
          }
        },ns.rootFolder); 
      };
      return ads;
    })({});
    
    /**
    * to keep this namespace dependency free
    * this must be run to set the driveappservice before it can be used
    * @param {driveapp} dap the driveapp
    * @return {DriveUtils} self
    */
    ns.setService = function (dap) {
      ns.service = dap;
      if (ns.isDriveApp()) {
        ns.rootFolder = Utils.expBackoff ( function () {
          return ns.service.getRootFolder();
        });
        ns.rootFolderId = ns.rootFolder.getId();
      }
      else {
        ns.rootFolder = ns.getFolderById ('root');
        ns.rootFolderId = ns.rootFolder.id;
      }
      return ns;
    };
    
    /**
    * whether we are using driveapp
    * @return {bool} whether we are using driveapp
    */
    ns.isDriveApp = function () {
      ns.checkService();
      return typeof ns.service.continueFolderIterator === 'function';
    };
    
    ns.checkService = function () {
      if(!ns.service) {
        throw 'please do a DriveUtils.setService (yourdriveapp) to inialie namespace';
      }
    };
    
    ns.getFolders = function (parent) {
      if (ns.isDriveApp()) {
        return parent.getFolders();
      }
      else {
        return ns.ads.getChildFolders (parent.id);
      }
    };
    
    ns.getFiles = function (parent,mime) {
      
      if (ns.isDriveApp()) {
      
        return mime ? ns.service.getFilesByType (mime) : parent.getFiles();
      }
      else {
  
        return ns.ads.getChildFiles (parent.id, mime);
      }
    };
    
    ns.getFileById = function (id) {
     try {
        return Utils.expBackoff ( function () {
  
          if (!ns.isDriveApp()) {
            return ns.service.Files.get(id,{fields:"id,title"});  
          }
          else {
            return ns.service.getFileById(id);
          }
        },{logAttempts:false});
      }
      catch (err) {
        return null;
      }
    
    }
    ns.getFolderById = function (path) {
      
      try {
        return Utils.expBackoff ( function () {
          if (!ns.isDriveApp()) {
            return ns.service.Files.get(path,{fields:"id,title"});  
          }
          else {
            return ns.service.getFolderById (path);
          }
        },{logAttempts:false});
      }
      catch (err) {
        return null;
      }
    }
    /**
    * get all the files as an array from a folder path
    * @param {string} path the path to the start folder
    * @param {string} [mime] the mime type
    * @param {boolean} [recurse=false] whether to recurse
    * @return {[files]} an array of files
    */
    ns.getPileOfFiles = function ( path , mime , recurse ) {
      
      var pile, startFolder;
      
      // first check if the path is an id or a path
      startFolder = ns.getFolderById (path) || ns.getFolderFromPath (path) ;
      
      if (!startFolder) {
        throw 'folder path/id ' + path + ' not found';
      }
  
      // if opened successfully, then get all the files 
      if (startFolder) {
        pile = (recurse ? recurseFolders ( startFolder,mime ) : pileFiles (startFolder,mime));
      }
      return pile;
      
      /**
      * get all the files in this and child folders
      * @param {folder} folder where to start
      * @param {string} [mime] the mime type
      * @param {[files]} [pile] the growing pike of files
      * @return {[files]}  the growing pike of files
      */
      function recurseFolders (folder, mime, pile) {
        
        
        // get the folders from the next level
        var it = ns.getFolders(folder);
        if (ns.isDriveApp () ) {
          while (it.hasNext()) {
            pile = recurseFolders (it.next() , mime , pile);
          }
        }
        else {
          it.forEach(function(d) {
            pile = recurseFolders (d , mime , pile)
          });
        }
        
        // collect from this folder
        return pileFiles(folder, mime, pile);
        
      }
      
      /**
      * get all the files in this folder
      * @param {folder} folder where to start
      * @param {string} [mime] the mime type
      * @param {[files]} [pile] the growing pike of files
      * @return {[files]}  the growing pike of files
      */    
      function pileFiles (folder, mime , pile) {
        
        var pile = pile || [];
        Array.prototype.push.apply (pile, getFiles(folder,mime));
        return pile;
      }
      
      /**
      * get all the files in a gven folder
      * @param {folder} folder where to start
      * @param {string} [mime] the mime type
      * @return {[files]}  the files
      */
      function getFiles (folder,mime) {
        var files= [];
        var it = ns.getFiles (folder , mime) ;
        folderPath = ns.getPathFromFolder (folder);
        
        if (ns.isDriveApp()) {
          while (it.hasNext()) {
            var file = it.next();
            var fileName = file.getName();
            files.push({
              file:file,
              folder:folder,
              path:folderPath  + fileName,
              fileName:fileName,
              id:file.getId()
            });
          }
        }
        else {
  
          it.forEach(function(d) {
            
            // need to get the file name
            var fileName = ns.getFileById(d.id).title;
            files.push({
              file:d,
              folder:folder,
              path:folderPath + fileName,
              fileName:fileName,
              id:d.id
            });
          })
        }
        return files;
      }
      
      
    };
    /**
    * get the files from a path like /abc/def/hgh/filename
    * @param {string} path the path
    * @return {FileIterator} a fileiterator
    */
    ns.getFilesFromPath = function (path) {
      
      // get the filename and the path seperately
      var s = path.split("/");
      if (!s.length) { 
        return null;
      }
      var filename = s[s.length-1];
      
      // the folder
      var folder = ns.getFolderFromPath (
        "/" + (s.length > 1 ? s.slice(0,s.length-1).join("/") : "")
      );
      
      if (ns.isDriveApp() ) {
        return Utils.expBackoff ( function () {
          return folder.getFilesByName (filename);
        });
      }
      else {
        return ns.ads.getFilesByName (folder.id , filename);
      }
      
    };
    
    
    /**
    * get a folder from a path like /abc/def/hgh
    * @param {string} path the path
    * @return {Folder} a folder
    */
    ns.getFolderFromPath = function (path) {
      
      // the drivapp way
      if (ns.isDriveApp()) {
        return (path || "/").split("/").reduce ( 
          function(prev,current) {
            if (prev && current) {
              var fldrs = Utils.expBackoff ( function () {
                return prev.getFoldersByName(current);
              });
              return fldrs.hasNext() ? fldrs.next() : null;
            }
            else { 
              return current ? null : prev; 
            }
          },ns.rootFolder); 
      }
      
      
      // the advanced service way
      else {
        return ns.ads.getFolderFromPath (path);
      }
      
    };
    
    /**
    * get a path like /abc/def/hgh from a folder
    * @param {Folder} folder the folder
    * @return {string} a path
    */
    ns.getPathFromFolder = function ( folder ,optPath) {
      
      ns.checkService();
      if (!folder) return '';
      var path = optPath || '/';
      
      // we're done if we hit the root folder
      return folder.getId() === ns.rootFolderId ? path : ns.getPathFromFolder (
        folder.getParents().next() , '/' + folder.getName() + path
      );
      
    };
    
    
    return ns;
  }) (DriveUtils || {});
  
  
  
//--end:DriveUtils

//--script file:SheetUtils
  /**
  * Utils contains useful functions for working with sheets
  * @namespace
  */
  var SheetUtils = (function (ns) { 
    
    /**
    * given a range and a property name, fill it with a value
    * @param {Range} range the range
    * @param {string} propertyName the property name
    * @param {*|function} fillValue the value to fill with, or function to create a value
    * @param {Range} [headerRange=] an optional range for the headers, default is first data row
    * @return {range} for chaining
    */
    ns.rangeFill = function (range , propertyName, fillValue, headerRange) {
      
      // camel case up property name
      var name = propertyName.slice(0,1).toUpperCase() + propertyName.slice(1);
      if (typeof range['get'+name] !== typeof range['set'+name] || 
          typeof range['set'+name] !== 'function') {
        throw new Error (name + ' should be a property of a range with a getter and setter');
      }
      
      // we'll always need the values to pass to a function, and also get the current properties
      var values = range.getValues();
      
      // set up default headers
      columnNames = headerRange ? headerRange.getValues()[0] : values[0]; 
      if (columnNames.length != values[0].length) {
        throw new Error ('headers are length ' + columnNames.length + 
                         ' but should be ' + values[0].length);
      }
      // these are the properties that will be set                 
      var properties =  name === 'Values' ? values : range['get'+name]();
      
      // iterate
      return range['set'+name](
        values.map(function(row,rowIndex) {
          return row.map(function(cell,colIndex) {
            return typeof fillValue === 'function' ? 
              fillValue ({
                value:cell,
                propertyValue:properties[rowIndex][colIndex],
                columnIndex:colIndex, 
                rowValues:row,
                rowIndex:rowIndex,
                propertyValues:properties,
                values:values,
                range:range,
                propertyName:propertyName,
                columnNames:columnNames,
                columnName:columnNames[colIndex],
                is:function(n) { return columnNames[colIndex] === n; }
              }) : fillValue;
          });
        })
      );
    };
    
    return ns;
  }) (SheetUtils || {});
  
//--end:SheetUtils

//--script file:FetchUtils
  /**
  * Utils contains useful functions for working with urlfetchapp
  * @namespace FetchUtils
  */
  var FetchUtils = (function (ns) {
  
    /**
    * to keep this namespace dependency free
    * this must be run to set the driveappservice before it can be used
    * @param {fetchapp} dap the fetchapp
    * @return {FetchUtils} self
    */
    ns.setService = function (dap) {
      ns.service = dap;
      return ns;
    };
    
    ns.checkService = function () {
      if(!ns.service) {
        throw 'please do a FetchUtils.setService (yoururlfetchapp) to inialise namespace';
      }
    };
    
    /**
    * restart a resumable upload
    * @param {string} accessToken the token
    * @param {blob} contblobent the content
    * @param {string} location the location url
    * @param {string} start the start position
    * @param {function} [func] a func to call after each chunk
    * @return {object} the status from the last request
    */
    ns.resumeUpload = function (accessToken,blob,location,start,func) {
      
      var MAXPOSTSIZE = 1024*1024*8;
      
      ns.checkService();
      
      
      //get the content and make the resource
      var content = blob.getBytes();
      var file = {
        title: blob.getName(),
        mimeType:blob.getContentType()
      };
      
      var chunkFunction = func || function ( status) {
        // you can replace this function with your own.
        // it gets called after each chunk
        
        // do something on completion
        if (status.done) {
          Logger.log (
            status.resource.title + '(' + status.resource.id + ')' + '\n' +
            ' is finished uploading ' + 
            status.content.length + 
            ' bytes in ' + (status.index+1) + ' chunks ' +
            ' (overall transfer rate ' + Math.round(content.length*1000/(new Date().getTime() - status.startTime)) + ' bytes per second)'
            );
        }
        
        // do something on successful completion of a chunk
        else if (status.success) {
          Logger.log (
            status.resource.title + 
            ' is ' + Math.round(status.ratio*100) + '% complete ' +
            ' (chunk transfer rate ' + Math.round(status.size*1000/(new Date().getTime() - status.startChunkTime))  + ' bytes per second)' +
              ' for chunk ' + (status.index+1)
              );
        }
        
        // decide what to do on an error
        else if (response.getResponseCode() === 503 ) {
          throw 'error 503 - you can try restarting using ' + status.location;
        }
        
        
        // its some real error
        else {
          throw response.getContentText() + ' you might be able to restart using ' + location;
        }
        
        // if you want to cancel return true
        return false;
      };
      
      var startTime = new Date().getTime();
      // now do the chunks
      var pos = 0, index = 0 ;
      do {
        
        // do it in bits
        var startChunkTime = new Date().getTime();
        var chunk = content.slice (pos , Math.min(pos+MAXPOSTSIZE, content.length));
        var options = {
          contentType:blob.getContentType(),
          method:"PUT",
          muteHttpExceptions:true,
          headers: {
            "Authorization":"Bearer " + accessToken,
            "Content-Range": "bytes "+pos+"-"+(pos+chunk.length-1)+"/"+content.length
          }
        };
        
        
        // load this chunk of data
        options.payload = chunk;
        
        // now we can send the file
        // but .... UrlFetch failed because too much upload bandwidth was used
        var response = Utils.expBackoff (function () {
          return ns.service.fetch (location, options) ;
        });
        
        // the actual data size transferred
        var size = chunk.length;
  
        if (response.getResponseCode() === 308 ) {
          var ranges = response.getHeaders().Range.split('=')[1].split('-');
          var size = parseInt (ranges[1],10) - pos + 1;
          if (size !== chunk.length ) {
            Logger.log ('chunk length mismatch - sent:' + chunk.length + ' but confirmed:' + size + ':recovering by resending the difference');
          }
        };
        
        // catch the file id 
        if (!file.id) {
          try {
            file.id = JSON.parse(response.getContentText()).id;
          }
          catch (err) {
            // this is just in case the contenttext is not a proper object
          }
        }
        
        var status = {
          start:pos,
          size:size,
          index:index,
          location:location,
          response:response,
          content:content,
          success:response.getResponseCode() === 200 || response.getResponseCode() === 308,
          done:response.getResponseCode() === 200,
          ratio:(size + pos) / content.length,
          resource:file,
          startTime:startTime,
          startChunkTime:startChunkTime
        };
        
        index++;
        pos += size;
        
        // now call the chunk completefunction
        var cancel = chunkFunction ( status );
        
      } while ( !cancel && status.success && !status.done);
      
      return status;  
    };
    
    /**
    * resumable upload
    * @param {string} accessToken an accesstoken with Drive scope
    * @param {blob} blob containg the data, type and name
    * @param {string} [folderId] the folderId to be the parent
    * @param {function} func a func to call after each chunk
    * @return {object} the status from the last request
    */
    ns.resumableUpload = function (accessToken,blob,folderId,func) {
      
      ns.checkService();
      /**
      * @param {object} status the status of the transfer
      *        status.start the start position in the content just processed
      *        status.size the size of the chunk
      *        status.index the index number (0 base) of the chunk
      *        status.location the restartable url
      *        status.content the total content
      *        status.response the httr response of this attempt
      *        status.success whether this worked (see response.getResponseCode() for more
      *        status.done whether its all done successfully
      *        status.ratio ratio complete
      *        status.resource the file resource
      *        status.startTime timestamp of when it all started
      *        status.startChunkTime timestamp of when this chunk started
      * @return {boolean} whether to cancel (true means cancel the upload)
      */
      
      
      //get the content and make the resource
      var content = blob.getBytes();
      var file = {
        title: blob.getName(),
        mimeType:blob.getContentType()
      };
      
      // assign to a folder if given
      if (folderId) {
        file.parents = [{id:folderId}];
      }
      
      // this sends the metadata and gets back a url
      
      var resourceBody = JSON.stringify(file);
      var headers =  {
        "X-Upload-Content-Type":blob.getContentType(),
        "X-Upload-Content-Length":content.length ,
        "Authorization":"Bearer " + accessToken,
      };
      
      var response = Utils.expBackoff( function () {
        return ns.service.fetch ("https://www.googleapis.com/upload/drive/v2/files?uploadType=resumable", {
          headers:headers,
          method:"POST",
          muteHttpExceptions:true,
          payload:resourceBody,
          contentType: "application/json; charset=UTF-8",
          contentLengthxx:resourceBody.length
        });
      });
      
      if (response.getResponseCode() !== 200) {
        throw 'failed on initial upload ' + response.getResponseCode();
      }
      
      
      // get the resume location
      var location = getLocation (response);
      
      return ns.resumeUpload (accessToken,blob,location,0,func);
      
      
      function getLocation (resp) {
        if(resp.getResponseCode()!== 200) {
          throw 'failed in setting up resumable upload ' + resp.getContentText();
        }
        
        // the location we need comes back as a header
        var location = resp.getHeaders().Location;
        if (!location) {
          throw 'failed to get location for resumable uploade';
        }
        return location;
      }
      
    };
    
    
    return ns;
  })(FetchUtils || {});
//--end:FetchUtils

//--script file:Include
  /**
   *used to include code in htmloutput
   *@nameSpace Include
   */
  var Include = (function (ns) {
    
    /**
    * given an array of .gs file names, it will get the source and return them concatenated for insertion into htmlservice
    * like this you can share the same code between client and server side, and use the Apps Script IDE to manage your js code
    * @param {string[]} scripts the names of all the scripts needed
    * @return {string} the code inside script tags
    */
    ns.gs =  function (scripts) {
      return '<script>\n' + scripts.map (function (d) {
        // getResource returns a blob
        return ScriptApp.getResource(d).getDataAsString();
      })
      .join('\n\n') + '</script>\n';
    };
  
    /**
    * given an array of .html file names, it will get the source and return them concatenated for insertion into htmlservice
    * @param {string[]} scripts the names of all the scripts needed
    * @param {string} ext file extendion
    * @return {string} the code inside script tags
    */
    ns.html = function (scripts, ext) {
      return  scripts.map (function (d) {
        return HtmlService.createHtmlOutputFromFile(d+(ext||'')).getContent();
      })
      .join('\n\n');
    };
    
    /**
    * given an array of .html file names, it will get the source and return them concatenated for insertion into htmlservice
    * inserts css style
    * @param {string[]} scripts the names of all the scripts needed
    * @return {string} the code inside script tags
    */
    ns.js = function (scripts) {
      return '<script>\n' + ns.html(scripts,'.js') + '</script>\n';
    };
    
    /**
    * given an array of .html file names, it will get the source and return them concatenated for insertion into htmlservice
    * like this you can share the same code between client and server side, and use the Apps Script IDE to manage your js code
    * @param {string[]} scripts the names of all the scripts needed
    * @return {string} the code inside script tags
    */
    ns.css = function (scripts) {
      return '<style>\n' + ns.html(scripts,'.css') + '</style>\n';
    };
    
  
    return ns;
  })(Include || {});
  
  
//--end:Include

//--script file:Squeeze
  /**
  * utils for squeezing more out of Apps Script quotas
  * @namespace Squeeze
  */
  var Squeeze = (function (ns) {
    
    /**
    * utilities for zipping and chunking data for property stores and cache
    * @constructor ChunkingUtils
    */
    ns.Chunking = function () {
      
      // the default maximum chunksize
      var chunkSize_ = 9*1024, 
        self = this, 
        store_, 
        prefix_ = "chunking_", 
        overhead_ = 12, 
        digestOverhead_ = 40 + 10,
        respectDigest_ = true,
        compressMin_ = 300;
      
  
      
      //--default functions for these operations
      
      // how to get an object
      var getObject_ = function (store , key) {
        var result = readFromStore_ (store, key );
        return result ? JSON.parse (result) : null;
      };
      
      // how to set an object
      var setObject_ = function (store,  key , ob , expire) {
        var s = JSON.stringify(ob || {});
        writeToStore_ ( store , key, s , expire );
        return s.length;
      };
      
      // how to write a string
      var writeToStore_ = function ( store, key, str) {
        return Utils.expBackoff(function () { 
          return store.setProperty (key , str); 
        });
      };
      
      // how to read a string
      var readFromStore_ = function (store, key) {
        return Utils.expBackoff(function () { 
          return store.getProperty (key); 
        });
      };
      
      // how to remove an object
      var removeObject_ = function (store, key) {
        return Utils.expBackoff(function () { 
          return store.deleteProperty (key);
        });
      };
      
      /**
      * set the max chunksize
      * @param {number} chunkSize the max size
      * @return {Chunking} self
      */
      self.setChunkSize = function (chunkSize) {
        chunkSize_ = chunkSize;
        return self;
      };
      
      /**
      * minimum size over which to compress
      * @return {boolean} respectDigest the max size
      */
      self.getCompressMin = function () {
        return compressMin_;
      };
      
      /**
      * whether to respect digest to avoid rewriting unchanged records
      * @param {boolean} compressMin the min size
      * @return {Chunking} self
      */
      self.setCompressMin = function (compressMin) {
        if (!Utils.isUndefined(compressMin))compressMin_ = compressMin;
        return self;
      };
      
      /**
      * whether to respect digest to avoid rewriting unchanged records
      * @return {boolean} respectDigest 
      */
      self.getRespectDigest = function () {
        return respectDigest_;
      };
      
      /**
      * whether to respect digest to avoid rewriting unchanged records
      * @param {boolean} respectDigest the max size
      * @return {Chunking} self
      */
      self.setRespectDigest = function (respectDigest) {
        if (!Utils.isUndefined(respectDigest_))respectDigest_ = respectDigest;
        return self;
      };
      
      /**
      * get the max chunksize
      * @return {number} chunkSize the max size
      */
      self.getChunkSize = function () {
        return chunkSize_;
      };
      
      /**
      * set the key prefix
      * @param {string} prefix the key prefix
      * @return {Chunking} self
      */
      self.setPrefix = function (prefix) {
        if (!Utils.isUndefined(prefix))prefix_ = prefix.toString() ;
        return self;
      };
      
      /**
      * get the prefix
      * @return {string} prefix the prefix
      */
      self.getPrefix = function () {
        return prefix_;
      };
      /**
      * set the store
      * @param {object} store the store
      * @return {Chunking} self
      */
      self.setStore = function (store) {
        store_ = store;
        return self;
      };
      
      /**
      * get the store
      * @return {object} the store
      */
      self.getStore = function () {
        return store_;
      };
      
      /**
      * set how to get an object
      * @param {function} func how to get an object
      * @return {Chunking} self
      */
      self.funcGetObject = function (func) {
        // func should take a store, key and return an object
        getObject_ = checkAFunc(func);
        return self;
      };
      
      /**
      * set how to get an object
      * @param {function} func how to set an object
      * @return {Chunking} self
      */
      self.funcSetObject = function (func) {
        // func should take a store, key and an object, and return the size of the stringified object
        setObject_ = checkAFunc(func);
        return self;
      };
      
     /**
      * set how to read from store
      * @param {function} func how to read from store 
      * @return {Chunking} self
      */
      self.funcReadFromStore = function (func) {
        // func should take a store key, and return a string
        readFromStore_ = checkAFunc(func);
        return self;
      };
      
     /**
      * set how to write to store
      * @param {function} func how to set an object
      * @return {Chunking} self
      */
      self.funcWriteToStore = function (func) {
        // func should take a store key and a string to write
        writeToStore_ = checkAFunc(func);
        return self;
      };
      
      /**
      * set how to remove an object
      * @param {function} func how to remove an object
      * @return {Chunking} self
      */
      self.funcRemoveObject = function (func) {
        // func should take a store, key
        removeObject_ = checkAFunc(func);
        return self;
      };
      
      /**
      * check that a variable is a function and throw if not
      * @param {function} [func] optional function to check
      * @return {function} the func
      */
      function checkAFunc (func) {
        if (func && typeof func !== 'function') {
          throw new Error('argument should be a function');
        }
        return func;
      }
      
      function payloadSize_ () {
        if (chunkSize_ <= overhead_) {
          throw 'chunksize must be at least '+ ( overhead_ +1);
        }
        return chunkSize_ - overhead_;
      }
      
      function digest_ (what) {
        return Utils.keyDigest (what);
      }
      
      function uid_ () {
        return Utils.generateUniqueString();
      }
      
      function getChunkKey_ (key) {
        return key + "_" + uid_ ();
      }
      
      function fudgeKey_ (key) {
        if (Utils.isUndefined(key) || key === null)throw 'property key must have a value';
        return typeof key === "object" ? digest_ (key) : key;
        
      }
  
      /** 
      * get the keys of multiple entries if it was too big
      * @param {PropertiesService} props the service to use
      * @param {object} propKey the key
      * @return {object} the result {chunks:[],data:{}} - an array of keys, or some actual data
      */
      self.getChunkKeys = function (propKey) {
        
        // in case the key is an object
        propKey = fudgeKey_(propKey);
        
        var data , 
            crushed = getObject_ (self.getStore(), propKey);
  
        // at this point, crushed is an object with either
        // a .chunk property with a zipped version of the data, or
        // a .chunks property with an array of other entries to get
        // a .digest property with the digest of all the data which identifies it as a master
        
        // its a non split item
        if (crushed && crushed.chunk && crushed.digest) {
          // uncrush the data and parse it back to an object if there are no associated records
          data = crushed.chunk ? JSON.parse ( crushed.skipZip ? crushed.chunk : self.unzip(crushed.chunk)) : null;
         
        }
        
        // return either the data or where to find the data
        return {
          chunks: crushed && crushed.chunks ? crushed.chunks: null,
          data: data,
          digest:crushed ? crushed.digest : "",
          skipZip: crushed && crushed.skipZip
        }
        
      };
      
      /** 
      * remove an entry and its associated stuff
      * @param {object} propKey the key
      * @return {Props} self
      */
      self.removeBigProperty = function (propKey) {
        
        // in case the key is an object
        propKey = fudgeKey_(propKey);
        var removed = 0;
        
        // always big properties are always crushed
        var chunky = self.getChunkKeys (prefix_ + propKey);
  
        // now remove the properties entries
        if (chunky && chunky.chunks) {
          chunky.chunks.forEach(function (d) {
            removeObject_ (self.getStore(), d);
            removed++;
          });
        }
        // now remove the master property
        if (chunky.digest) {
          removeObject_ (self.getStore() , prefix_ + propKey);
          removed++;
        }
        
        return removed;
        
      };
      
     
      
      /** 
      * updates a property using multiple entries if its going to be too big
      * @param {object} propKey the key
      * @param {object} ob the thing to write
      * @param {number} expire secs to expire
      * @return {size} of data written - if nothing done, size is 0
      */
      self.setBigProperty  = function (propKey,ob,expire) {
        
        // in case the key is an object
        propKey = fudgeKey_(propKey);
        
        // donbt allow undefined
        if (Utils.isUndefined (ob) ) {
          throw 'cant write undefined to store';
        }
       
        // blob pulls it out
        if (Utils.isBlob (ob) ) {
          var slob = {
            contentType:ob.getContentType(),
            name:ob.getName(),
            content:Utilities.base64Encode(ob.getBytes()),
            blob:true
          }
        }
        
        // convery to timestamp
        else if ( isDateObject (ob)) {
          var slob = {
            date: true,
            content: ob.getTime()
          }
        }
        
        // strinfigy
        else if (typeof (ob) === "object") {
          var slob = {
            content:JSON.stringify(ob),
            parse: true
          }
        }
        
        else {
          var slob = {
            content: ob
          }
        }
        
        // pack all that up to write to the store
        const sob = JSON.stringify (slob);
        
        // get the digest
        var digest = Utils.keyDigest (sob);
        
        // now get the master if there is one
        var master = getObject_ (self.getStore(), prefix_ + propKey);
        
        if (master && master.digest && master.digest === digest && respectDigest_ && !expire) {
          // nothing to do
          return 0;
        }
        else {
          // need to remove the previous entries and add this new one
          self.removeBigProperty (propKey);
          return setBigProperty_ (prefix_ + propKey,sob, expire);
        }
        
      };
      
      /** 
      * gets a property using multiple entries if its going to be too big
      * @param {object} propKey the key
      * @return {object} what was retrieved
      */
      self.getBigProperty = function (propKey) {
        
        // in case the key is an object
        propKey = fudgeKey_(propKey);
        
        // always big properties are always crushed
        var chunky = self.getChunkKeys ( prefix_ + propKey);
        
        // that'll return either some data, or a list of keys
        if (chunky && chunky.chunks) {
          var p = chunky.chunks.reduce (function (p,c) {
            var r = getObject_ ( self.getStore() , c);
            
            // should always be available
            if (!r) {
              throw 'missing chunked property ' + c + ' for key ' + propKey;
            }
            
            // rebuild the crushed string
            return p + r.chunk;
          },"");
          
          // now uncrush the result
          var package = JSON.parse(chunky.skipZip ? p : self.unzip (p));
        }
        else {
          // it was just some data
          var package =  chunky ? chunky.data : null;
        }
  
        // now need to unpack;
        if (package) {
          if (package.parse) {
            return JSON.parse (package.content);
          }
          else if(package.date) {
            return new Date (package.content);
          }
          else if (package.blob) {
            return Utilities.newBlob(Utilities.base64Decode(package.content), package.contentType, package.name);
          }
          else {
            return package.content;
          }
        }
        else {
          return null;
        }
      };
      
      /** 
      * sets a property using multiple entries if its going to be too big
      *  use self.setBigProperty() from outside, which first deletes existing stuff 
      *  as well as checking the digest
      * @param {object} propKey the key
      * @param {string} sob the thing to write
      * @return {number} total length of everything written
      */
      function setBigProperty_ (propKey,sob, expire) {
  
        // always crush big properties
        var size=0;
        
        // crush the object
        var skipZip = sob.length < compressMin_;
        var chunks, crushed = skipZip ?  sob : self.zip (sob) ;
  
        // get the digest 
        // the digest is used to avoid updates when theres no change
        var digest = digest_ (sob);
        
        // if we have an overflow, then need to write multiple properties
        if (crushed.length > payloadSize_() - digestOverhead_) {
          chunks = [];
        }
        
        // now split up the big thing if needed
        // expire should be a little bigger for the chunks to make sure they dont go away
        
        do {
          
          // peel off a piece
          var chunk = crushed.slice(0,payloadSize_());
          crushed = crushed.slice (chunk.length);
          
          if (chunks) {
            
            // make a new entry for the key
            var key = getChunkKey_ (propKey);
            size += setObject_ (self.getStore(), key , {
              chunk:chunk
            },expire ? expire + 1: expire);
            
            // remember the key
            chunks.push (key);
            
          }
          else {
            size += setObject_ (self.getStore(), propKey , {
              chunk:chunk,
              digest:digest,
              skipZip:skipZip
            },expire);
          }
          
        } while (crushed.length);
        
        // now write the index if there were chunks
        if (chunks) {
          size += setObject_ (self.getStore(), propKey,{
            chunks:chunks,
            digest:digest,
            skipZip: skipZip
          },expire );
        }
        
        return size;
      };
      
      /**
      * crush for writing to cache.props
      * @param {string} crushThis the string to crush
      * @return {string} the b64 zipped version
      */
      self.zip = function (crushThis) {
        return Utilities.base64Encode(Utilities.zip ([Utilities.newBlob(crushThis)]).getBytes());
      };
      
      /**
      * uncrush for writing to cache.props
      * @param {string} crushed the crushed string
      * @return {string} the uncrushed string
      */
      self.unzip = function (crushed) {
        return Utilities.unzip(Utilities.newBlob(Utilities.base64Decode(crushed),'application/zip'))[0].getDataAsString();
      };
  
    }
    return ns;
  })(Squeeze || {});
//--end:Squeeze

//--script file:UserRegistration
  /**
   * @namespace UserRegistration
   * uses the property service to track anonymous users
   */
  var UserRegistration = (function(ns) {
    
    ns.version = "0.0";
    
    /**
     * register a visit
     * if new user, then create a reg record
     * @param {PropertiesService} props the one to use
     * @param {string} registrationKey the key to use
     * @return {object} the registration object
     */
    ns.register = function (props,registrationKey) {
      
      // get the existing registration or make one
      return ns.get(props, registrationKey) || makeob();
  
      
      function makeob () { 
        
        var now = new Date().getTime();
        var ob = { 
          id:Utils.generateUniqueString(),
          visits:-1,
          created:now
        };
        return ns.set (props, registrationKey , ob);
      }
      
  
    };
    
    /**
     * get the registration item for this user
     * @param {PropertiesService} props the prop service to use
     * @param {string} registrationKey the key to use
     * @return {object} the registration object
     */
    ns.get = function (props,registrationKey) {
      return closure_ (props, registrationKey , getProp_ (props, registrationKey));
    };
    
    /**
     * set the registration item for this user
     * @param {PropertiesService} props the prop service to use
     * @param {string} registrationKey the key to use
     * @param {object} ob the registration object
     * @return {object} the registration object
     */
    ns.set = function (props,registrationKey,ob) {
      // increment visits etc.
      ob.visits++;
      ob.version = ns.version;
      ob.lastVisit = new Date().getTime();
      setProp_ (props, registrationKey , ob);
      return closure_ (props, registrationKey , ob);
    };
    
    function getProp_ (props,propKey) {
      return Utils.expBackoff (function () {
        var r = props.getProperty(propKey);
        return r ? JSON.parse(r) : null;
      });
    }
    
    function setProp_ (props,propKey,ob) {
      return Utils.expBackoff (function () {
        return props.setProperty(propKey,JSON.stringify(ob));
      });
    }
    
    function closure_ (props , registrationKey, ob) {
      // make a closure so its easy to update
      if (ob) {
        ob.update = function () {
          return ns.set (props , registrationKey , ob);
        };
        ob.remove = function () {
          return props.deleteProperty (registrationKey);
        };
      }
      return ob;
  
    }
    return ns;
  }) (UserRegistration || {});
  
//--end:UserRegistration

//--script file:DriveProper
  var DriveProper = function (service) {
    
    var service_ = service;
    var self = this;
  
    self.setService = function (service) {
      service_ = service;
      return ns;
    };
    
    /*
    * add properties to a a file
    * @param {string} fileId 
    * @param {object} ob an object with all the properties to set
    * @param {boolean} [public=false] whether to make this public to all apps
    * @return {object []} the resources that were set
    */
    self.update = function (fileId , ob, public) {
      
      // arratify
      var o = Object.keys (ob).map (function (d) {
        return {
          key:d,
          value:ob[d],
          visibility: public ? "PUBLIC": "PRIVATE"
        }
      });
  
      // insert property
      o.forEach(function (d) {
        service_.Properties.insert ( d , fileId);
      });
      
      return o;
    };
    
   /*
    * get properties from a file
    * @param {string} fileId 
    * @param {boolean} [all=false] whether to read only this app or public as well
    * @return {object} the resources that were set
    */
    self.get = function (fileId , all) {
      
      return service_.Files.get(fileId)
      .properties.filter (function (d) {
        return all || d.visibility === "PRIVATE";
      })
      .map (function (d) {
        
        return {
          key:d.key,
          value:d.value,
          visibility:d.visibility
        }
      });
  
    };
    
    /*
     * search for a files wih given properties
    * @param {object} ob an object with all the properties to search for
    * @param {boolean} [all=false] whether to include all or just for this app
    * @return {string []} the fileids that matched
    */
    self.search = function ( ob , all )  {
      
      var pageToken, consolidated = [];
      var searcher =  Object.keys (ob)
      .map (function (d) {
        return "(" + ("(properties has { key='" + d + "' and value ='" + ob[d] + "' and visibility = 'PRIVATE' })") + 
          (all ? " or (properties has { key='" + d + "' and value ='" + ob[d] + "' and visibility = 'PUBLIC' })" : "") + ")";
      }).join (" and ");
      
      // consolidate chunks
      do  {
        var result = service_.Files.list({q:searcher,pageToken:pageToken});
        pageToken = result.nextPageToken;
        Array.prototype.push.apply (consolidated ,result.items.map (function (d) {
          return d.id;
        }));
                                    
      } while (pageToken && result.items.length);
      return consolidated;
    };
    
    /*
     * remove all or some properties
     * @param {string} fileId the file id
     * @param {ob[]} properties to remove
     * @param {boolean} [public=false] whether to remove private or public
     * @return {object} the resources that are still set
     */
    self.remove = function (fileId , ob , public) {
    
      ob.forEach (function (d) {
        service_.Properties.remove ( fileId , d, {visibility: public ? "PUBLIC" : "PRIVATE"});
      });
      
      return self.get (fileId, true);
    };
  
  };
  
  
//--end:DriveProper

//--script file:RemoveAccents
  var RemoveAccents = (function (ns) {
    
    /**
    * MIT license
    * https://github.com/tyxla/remove-accents
    */
    
    var chars, allAccents , firstAccent, characterMap;
    
    // init only happens if these functions are actually used
    const init =  function () {
      characterMap = {
        "?": "A",
        "?": "A",
        "?": "A",
        "?": "A",
        "?": "A",
        "?": "A",
        "?": "A",
        "?": "A",
        "?": "A",
        "?": "A",
        "?": "A",
        "?": "AE",
        "?": "A",
        "?": "A",
        "?": "A",
        "?": "C",
        "?": "C",
        "?": "E",
        "?": "E",
        "?": "E",
        "?": "E",
        "?": "E",
        "?": "E",
        "?": "E",
        "?": "E",
        "?": "E",
        "?": "E",
        "?": "I",
        "?": "I",
        "?": "I",
        "?": "I",
        "?": "I",
        "?": "I",
        "?": "D",
        "?": "N",
        "?": "O",
        "?": "O",
        "?": "O",
        "?": "O",
        "?": "O",
        "?": "O",
        "?": "O",
        "?": "O",
        "?": "O",
        "?": "O",
        "?": "U",
        "?": "U",
        "?": "U",
        "?": "U",
        "?": "Y",
        "?": "a",
        "?": "a",
        "?": "a",
        "?": "a",
        "?": "a",
        "?": "a",
        "?": "a",
        "?": "a",
        "?": "a",
        "?": "a",
        "?": "a",
        "?": "ae",
        "?": "a",
        "?": "a",
        "?": "a",
        "?": "c",
        "?": "c",
        "?": "e",
        "?": "e",
        "?": "e",
        "?": "e",
        "?": "e",
        "?": "e",
        "?": "e",
        "?": "e",
        "?": "e",
        "?": "e",
        "?": "i",
        "?": "i",
        "?": "i",
        "?": "i",
        "?": "i",
        "?": "i",
        "?": "d",
        "?": "n",
        "?": "o",
        "?": "o",
        "?": "o",
        "?": "o",
        "?": "o",
        "?": "o",
        "?": "o",
        "?": "o",
        "?": "o",
        "?": "o",
        "?": "u",
        "?": "u",
        "?": "u",
        "?": "u",
        "?": "y",
        "?": "y",
        "?": "A",
        "?": "a",
        "?": "A",
        "?": "a",
        "?": "A",
        "?": "a",
        "?": "C",
        "?": "c",
        "?": "C",
        "?": "c",
        "?": "C",
        "?": "c",
        "?": "C",
        "?": "c",
        "C?": "C",
        "c?": "c",
        "?": "D",
        "?": "d",
        "?": "D",
        "?": "d",
        "?": "E",
        "?": "e",
        "?": "E",
        "?": "e",
        "?": "E",
        "?": "e",
        "?": "E",
        "?": "e",
        "?": "E",
        "?": "e",
        "?": "G",
        "?": "G",
        "?": "g",
        "?": "g",
        "?": "G",
        "?": "g",
        "?": "G",
        "?": "g",
        "?": "G",
        "?": "g",
        "?": "H",
        "?": "h",
        "?": "H",
        "?": "h",
        "?": "H",
        "?": "h",
        "?": "I",
        "?": "i",
        "?": "I",
        "?": "i",
        "?": "I",
        "?": "i",
        "?": "I",
        "?": "i",
        "?": "I",
        "?": "i",
        "?": "IJ",
        "?": "ij",
        "?": "J",
        "?": "j",
        "?": "K",
        "?": "k",
        "?": "K",
        "?": "k",
        "K?": "K",
        "k?": "k",
        "?": "L",
        "?": "l",
        "?": "L",
        "?": "l",
        "?": "L",
        "?": "l",
        "?": "L",
        "?": "l",
        "?": "l",
        "?": "l",
        "?": "M",
        "?": "m",
        "M?": "M",
        "m?": "m",
        "?": "N",
        "?": "n",
        "?": "N",
        "?": "n",
        "?": "N",
        "?": "n",
        "?": "n",
        "N?": "N",
        "n?": "n",
        "?": "O",
        "?": "o",
        "?": "O",
        "?": "o",
        "?": "O",
        "?": "o",
        "?": "OE",
        "?": "oe",
        "P?": "P",
        "p?": "p",
        "?": "R",
        "?": "r",
        "?": "R",
        "?": "r",
        "?": "R",
        "?": "r",
        "R?": "R",
        "r?": "r",
        "?": "R",
        "?": "r",
        "?": "S",
        "?": "s",
        "?": "S",
        "?": "s",
        "?": "S",
        "?": "S",
        "?": "s",
        "?": "s",
        "?": "S",
        "?": "s",
        "?": "T",
        "?": "t",
        "?": "t",
        "?": "T",
        "?": "T",
        "?": "t",
        "?": "T",
        "?": "t",
        "T?": "T",
        "t?": "t",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "V?": "V",
        "v?": "v",
        "?": "W",
        "?": "w",
        "?": "W",
        "?": "w",
        "X?": "X",
        "x?": "x",
        "?": "Y",
        "?": "y",
        "?": "Y",
        "Y?": "Y",
        "y?": "y",
        "?": "Z",
        "?": "z",
        "?": "Z",
        "?": "z",
        "?": "Z",
        "?": "z",
        "?": "s",
        "?": "f",
        "?": "O",
        "?": "o",
        "?": "U",
        "?": "u",
        "?": "A",
        "?": "a",
        "?": "I",
        "?": "i",
        "?": "O",
        "?": "o",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "U",
        "?": "u",
        "?": "A",
        "?": "a",
        "?": "AE",
        "?": "ae",
        "?": "O",
        "?": "o",
        "?": "TH",
        "?": "th",
        "?": "P",
        "?": "p",
        "?": "S",
        "?": "s",
        "X?": "X",
        "x?": "x",
        "?": "?",
        "?": "?",
        "?": "?",
        "?": "?",
        "A?": "A",
        "a?": "a",
        "E?": "E",
        "e?": "e",
        "I?": "I",
        "i?": "i",
        "?": "N",
        "?": "n",
        "?": "O",
        "?": "o",
        "?": "O",
        "?": "o",
        "?": "U",
        "?": "u",
        "?": "W",
        "?": "w",
        "?": "Y",
        "?": "y",
        "?": "A",
        "?": "a",
        "?": "E",
        "?": "e",
        "?": "I",
        "?": "i",
        "?": "O",
        "?": "o",
        "?": "R",
        "?": "r",
        "?": "U",
        "?": "u",
        "B?": "B",
        "b?": "b",
        "??": "C",
        "??": "c",
        "??": "E",
        "??": "e",
        "F?": "F",
        "f?": "f",
        "?": "G",
        "?": "g",
        "?": "H",
        "?": "h",
        "J?": "J",
        "?": "j",
        "?": "K",
        "?": "k",
        "M?": "M",
        "m?": "m",
        "P?": "P",
        "p?": "p",
        "Q?": "Q",
        "q?": "q",
        "??": "R",
        "??": "r",
        "?": "S",
        "?": "s",
        "V?": "V",
        "v?": "v",
        "W?": "W",
        "w?": "w",
        "X?": "X",
        "x?": "x",
        "Y?": "Y",
        "y?": "y",
        "A?": "A",
        "a?": "a",
        "B?": "B",
        "b?": "b",
        "?": "D",
        "?": "d",
        "?": "E",
        "?": "e",
        "??": "E",
        "??": "e",
        "?": "H",
        "?": "h",
        "I?": "I",
        "i?": "i",
        "??": "I",
        "??": "i",
        "M?": "M",
        "m?": "m",
        "O?": "O",
        "o?": "o",
        "Q?": "Q",
        "q?": "q",
        "U?": "U",
        "u?": "u",
        "X?": "X",
        "x?": "x",
        "Z?": "Z",
        "z?": "z",
      };
      
      chars = Object.keys(characterMap).join('|');
      allAccents = new RegExp(chars, 'g');
      firstAccent = new RegExp(chars, '');
      
    };
    
    const matcher = function(match) {
      if (!chars) init();
      return characterMap[match];
    };
    
    ns.remove = function(string) {
      if (!chars) init();
      return string.replace(allAccents, matcher);
    };
    
    ns.hasAccents = function(string) {
      if (!chars) init();
      return !!string.match(firstAccent);
    };
    
    return ns;
  }) ({});
  
//--end:RemoveAccents

//--script file:Stopwords
  
  /**
  * MIT license
  * https://github.com/fergiemcdowall/stopword/blob/master/LICENSE
  */
  var Stopwords = (function (ns) {
    var stopwords,lng = "en", options  ={} ,words;
    
    const init = function () {
      ns.setOptions ( {
        language:"en",
        unAccent: true
      });
      return ns;
    };
    
    const prepareWord = function (word) {
      // removes accent and stems if required
      var x = word.toLowerCase();
      x = options.unAccent ? RemoveAccents.remove (x) : x;
      x = options.stem ? Stemmer.getStem (x) : x ;
      return x;
    };
    
    ns.setOptions = function (opts) {
      // only do this if the options have changed
      if (opts.language !== options.language || opts.unAccent !== options.unAccent) {
        options = opts;
        const w = getWords(options.language || lng);
        if (!w) {
          throw new Error ("supported languages are " + Object.keys(words));
        }
        lng = options.language || lng;
        
        // take a copy of stopwords as an object so it will be quicker to index
        stopwords =  w.reduce (function (p,c) {
          const x = prepareWord(c);
          p[x] = c;
          return p;
        },{});
        
        return ns;
      }
      
      return ns;
    };
    
    ns.add = function (tokens) {
      if (!stopwords) init();
      if (!Array.isArray(tokens)   ){
        throw new Error ('expected Stopwords.add(Array)')
      }
      tokens.forEach (function (d) {
        const x = prepareWord(d);
        stopwords[x] = d;
      });
     
      return ns;
    };
    
    ns.clean = function(tokens) {
      if (!stopwords) init();
      if (!Array.isArray(tokens)   ){
        throw new Error ('expected Stopwords.clean(Array)')
      }
      return tokens.filter(function (value) {
        return !stopwords.hasOwnProperty (value);
      })
      
    };
    
    
    function getWords  (lng) {
      return { 
        
        en:  [
          'about', 'after', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'are', 'as', 'at', 'be',
          'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'can',
          'come', 'could', 'did', 'do', 'each', 'for', 'from', 'get', 'got', 'has', 'had',
          'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'how', 'if', 'in', 'into',
          'is', 'it', 'like', 'make', 'many', 'me', 'might', 'more', 'most', 'much', 'must',
          'my', 'never', 'now', 'of', 'on', 'only', 'or', 'other', 'our', 'out', 'over',
          'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than',
          'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
          'through', 'to', 'too', 'under', 'up', 'very', 'was', 'way', 'we', 'well', 'were',
          'what', 'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your', 'a', 'i'
        ],
        
        fr: ['?tre', 'avoir', 'faire',
             'a',
             'au',
             'aux',
             'avec',
             'ce',
             'ces',
             'dans',
             'de',
             'des',
             'du',
             'elle',
             'en',
             'et',
             'eux',
             'il',
             'je',
             'la',
             'le',
             'leur',
             'lui',
             'ma',
             'mais',
             'me',
             'm?me',
             'mes',
             'moi',
             'mon',
             'ne',
             'nos',
             'notre',
             'nous',
             'on',
             'ou',
             'o?',
             'par',
             'pas',
             'pour',
             'qu',
             'que',
             'qui',
             'sa',
             'se',
             'ses',
             'son',
             'sur',
             'ta',
             'te',
             'tes',
             'toi',
             'ton',
             'tu',
             'un',
             'une',
             'vos',
             'votre',
             'vous',
             'c',
             'd',
             'j',
             'l',
             '?',
             'm',
             'n',
             's',
             't',
             'y',
             '?t?',
             '?t?e',
             '?t?es',
             '?t?s',
             '?tant',
             'suis',
             'es',
             'est',
             'sommes',
             '?tes',
             'sont',
             'serai',
             'seras',
             'sera',
             'serons',
             'serez',
             'seront',
             'serais',
             'serait',
             'serions',
             'seriez',
             'seraient',
             '?tais',
             '?tait',
             '?tions',
             '?tiez',
             '?taient',
             'fus',
             'fut',
             'f?mes',
             'f?tes',
             'furent',
             'sois',
             'soit',
             'soyons',
             'soyez',
             'soient',
             'fusse',
             'fusses',
             'f?t',
             'fussions',
             'fussiez',
             'fussent',
             'ayant',
             'eu',
             'eue',
             'eues',
             'eus',
             'ai',
             'as',
             'avons',
             'avez',
             'ont',
             'aurai',
             'auras',
             'aura',
             'aurons',
             'aurez',
             'auront',
             'aurais',
             'aurait',
             'aurions',
             'auriez',
             'auraient',
             'avais',
             'avait',
             'avions',
             'aviez',
             'avaient',
             'eut',
             'e?mes',
             'e?tes',
             'eurent',
             'aie',
             'aies',
             'ait',
             'ayons',
             'ayez',
             'aient',
             'eusse',
             'eusses',
             'e?t',
             'eussions',
             'eussiez',
             'eussent',
             'ceci',
             'cela',
             'cet',
             'cette',
             'ici',
             'ils',
             'les',
             'leurs',
             'quel',
             'quels',
             'quelle',
             'quelles',
             'sans',
             'soi'
            ]
      }[lng];
    }
    
    
    
    return ns;
    
  })({});
  
  
  
  
//--end:Stopwords

//--script file:Stemmer
  /**
  * MIT
  * https://github.com/words/lancaster-stemmer/blob/master/LICENSE
  */
  var Stemmer = (function (ns) {
    
    var STOP = -1;
    var INTACT = 0;
    var CONTINUE = 1;
    var PROTECT = 2;
    var VOWELS = /[aeiouy]/;
    var rules;
    
    const init = function () {
      
      rules = {
        a: [
          {match: 'ia', replacement: '', type: INTACT},
          {match: 'a', replacement: '', type: INTACT}
        ],
        b: [{match: 'bb', replacement: 'b', type: STOP}],
        c: [
          {match: 'ytic', replacement: 'ys', type: STOP},
          {match: 'ic', replacement: '', type: CONTINUE},
          {match: 'nc', replacement: 'nt', type: CONTINUE}
        ],
        d: [
          {match: 'dd', replacement: 'd', type: STOP},
          {match: 'ied', replacement: 'y', type: CONTINUE},
          {match: 'ceed', replacement: 'cess', type: STOP},
          {match: 'eed', replacement: 'ee', type: STOP},
          {match: 'ed', replacement: '', type: CONTINUE},
          {match: 'hood', replacement: '', type: CONTINUE}
        ],
        e: [{match: 'e', replacement: '', type: CONTINUE}],
        f: [
          {match: 'lief', replacement: 'liev', type: STOP},
          {match: 'if', replacement: '', type: CONTINUE}
        ],
        g: [
          {match: 'ing', replacement: '', type: CONTINUE},
          {match: 'iag', replacement: 'y', type: STOP},
          {match: 'ag', replacement: '', type: CONTINUE},
          {match: 'gg', replacement: 'g', type: STOP}
        ],
        h: [
          {match: 'th', replacement: '', type: INTACT},
          {match: 'guish', replacement: 'ct', type: STOP},
          {match: 'ish', replacement: '', type: CONTINUE}
        ],
        i: [
          {match: 'i', replacement: '', type: INTACT},
          {match: 'i', replacement: 'y', type: CONTINUE}
        ],
        j: [
          {match: 'ij', replacement: 'id', type: STOP},
          {match: 'fuj', replacement: 'fus', type: STOP},
          {match: 'uj', replacement: 'ud', type: STOP},
          {match: 'oj', replacement: 'od', type: STOP},
          {match: 'hej', replacement: 'her', type: STOP},
          {match: 'verj', replacement: 'vert', type: STOP},
          {match: 'misj', replacement: 'mit', type: STOP},
          {match: 'nj', replacement: 'nd', type: STOP},
          {match: 'j', replacement: 's', type: STOP}
        ],
        l: [
          {match: 'ifiabl', replacement: '', type: STOP},
          {match: 'iabl', replacement: 'y', type: STOP},
          {match: 'abl', replacement: '', type: CONTINUE},
          {match: 'ibl', replacement: '', type: STOP},
          {match: 'bil', replacement: 'bl', type: CONTINUE},
          {match: 'cl', replacement: 'c', type: STOP},
          {match: 'iful', replacement: 'y', type: STOP},
          {match: 'ful', replacement: '', type: CONTINUE},
          {match: 'ul', replacement: '', type: STOP},
          {match: 'ial', replacement: '', type: CONTINUE},
          {match: 'ual', replacement: '', type: CONTINUE},
          {match: 'al', replacement: '', type: CONTINUE},
          {match: 'll', replacement: 'l', type: STOP}
        ],
        m: [
          {match: 'ium', replacement: '', type: STOP},
          {match: 'um', replacement: '', type: INTACT},
          {match: 'ism', replacement: '', type: CONTINUE},
          {match: 'mm', replacement: 'm', type: STOP}
        ],
        n: [
          {match: 'sion', replacement: 'j', type: CONTINUE},
          {match: 'xion', replacement: 'ct', type: STOP},
          {match: 'ion', replacement: '', type: CONTINUE},
          {match: 'ian', replacement: '', type: CONTINUE},
          {match: 'an', replacement: '', type: CONTINUE},
          {match: 'een', replacement: '', type: PROTECT},
          {match: 'en', replacement: '', type: CONTINUE},
          {match: 'nn', replacement: 'n', type: STOP}
        ],
        p: [
          {match: 'ship', replacement: '', type: CONTINUE},
          {match: 'pp', replacement: 'p', type: STOP}
        ],
        r: [
          {match: 'er', replacement: '', type: CONTINUE},
          {match: 'ear', replacement: '', type: PROTECT},
          {match: 'ar', replacement: '', type: STOP},
          {match: 'ior', replacement: '', type: CONTINUE},
          {match: 'or', replacement: '', type: CONTINUE},
          {match: 'ur', replacement: '', type: CONTINUE},
          {match: 'rr', replacement: 'r', type: STOP},
          {match: 'tr', replacement: 't', type: CONTINUE},
          {match: 'ier', replacement: 'y', type: CONTINUE}
        ],
        s: [
          {match: 'ies', replacement: 'y', type: CONTINUE},
          {match: 'sis', replacement: 's', type: STOP},
          {match: 'is', replacement: '', type: CONTINUE},
          {match: 'ness', replacement: '', type: CONTINUE},
          {match: 'ss', replacement: '', type: PROTECT},
          {match: 'ous', replacement: '', type: CONTINUE},
          {match: 'us', replacement: '', type: INTACT},
          {match: 's', replacement: '', type: CONTINUE},
          {match: 's', replacement: '', type: STOP}
        ],
        t: [
          {match: 'plicat', replacement: 'ply', type: STOP},
          {match: 'at', replacement: '', type: CONTINUE},
          {match: 'ment', replacement: '', type: CONTINUE},
          {match: 'ent', replacement: '', type: CONTINUE},
          {match: 'ant', replacement: '', type: CONTINUE},
          {match: 'ript', replacement: 'rib', type: STOP},
          {match: 'orpt', replacement: 'orb', type: STOP},
          {match: 'duct', replacement: 'duc', type: STOP},
          {match: 'sumpt', replacement: 'sum', type: STOP},
          {match: 'cept', replacement: 'ceiv', type: STOP},
          {match: 'olut', replacement: 'olv', type: STOP},
          {match: 'sist', replacement: '', type: PROTECT},
          {match: 'ist', replacement: '', type: CONTINUE},
          {match: 'tt', replacement: 't', type: STOP}
        ],
        u: [
          {match: 'iqu', replacement: '', type: STOP},
          {match: 'ogu', replacement: 'og', type: STOP}
        ],
        v: [
          {match: 'siv', replacement: 'j', type: CONTINUE},
          {match: 'eiv', replacement: '', type: PROTECT},
          {match: 'iv', replacement: '', type: CONTINUE}
        ],
        y: [
          {match: 'bly', replacement: 'bl', type: CONTINUE},
          {match: 'ily', replacement: 'y', type: CONTINUE},
          {match: 'ply', replacement: '', type: PROTECT},
          {match: 'ly', replacement: '', type: CONTINUE},
          {match: 'ogy', replacement: 'og', type: STOP},
          {match: 'phy', replacement: 'ph', type: STOP},
          {match: 'omy', replacement: 'om', type: STOP},
          {match: 'opy', replacement: 'op', type: STOP},
          {match: 'ity', replacement: '', type: CONTINUE},
          {match: 'ety', replacement: '', type: CONTINUE},
          {match: 'lty', replacement: 'l', type: STOP},
          {match: 'istry', replacement: '', type: STOP},
          {match: 'ary', replacement: '', type: CONTINUE},
          {match: 'ory', replacement: '', type: CONTINUE},
          {match: 'ify', replacement: '', type: STOP},
          {match: 'ncy', replacement: 'nt', type: CONTINUE},
          {match: 'acy', replacement: '', type: CONTINUE}
        ],
        z: [
          {match: 'iz', replacement: '', type: CONTINUE},
          {match: 'yz', replacement: 'ys', type: STOP}
        ]
      };
    };
    
    ns.getStem = function (value) {
      return applyRules(String(value).toLowerCase(), true);
    }
    
    function applyRules(value, isIntact) {
      // first time used
      if (!rules) init();
      var ruleset = rules[value.charAt(value.length - 1)];
      var breakpoint;
      var index;
      var length;
      var rule;
      var next;
      
      if (!ruleset) {
        return value;
      }
      
      index = -1;
      length = ruleset.length;
      
      while (++index < length) {
        rule = ruleset[index];
        
        if (!isIntact && rule.type === INTACT) {
          continue;
        }
        
        breakpoint = value.length - rule.match.length;
        
        if (breakpoint < 0 || value.substr(breakpoint) !== rule.match) {
          continue;
        }
        
        if (rule.type === PROTECT) {
          return value;
        }
        
        next = value.substr(0, breakpoint) + rule.replacement;
        
        if (!acceptable(next)) {
          continue;
        }
        
        if (rule.type === CONTINUE) {
          return applyRules(next, false);
        }
        
        return next;
      }
      
      return value;
    }
    
    /* Detect if a value is acceptable to return, or should
    * be stemmed further. */
    function acceptable(value) {
      return VOWELS.test(value.charAt(0)) ?
        value.length > 1 : value.length > 2 && VOWELS.test(value);
    }
    return ns;
  })({});
//--end:Stemmer

//--script file:Stubber
  var Stubber = ( function (ns) {
  
    ns.make = function (text) {
      return text.slice(0, 1) + text.slice(1).replace(/s/g, 'z').replace(/mp/g, 'm').replace(/[yhaeiou]|(.)(?=\1)|(c)(?=k)/g, "");
    };
    
    return ns;
  }) ({});
  
  
  
  
//--end:Stubber

//--script file:Rough
  /**
   * for rough matching
   */
  var Rough = function () {
    const self = this;
    
    // default options
    const CLEANER_OPTIONS = {
      stem: true,
      stub: true ,
      unAccent: true,
      stopwords: true,
      language: "en",
      extraStops:[],
      min:0.6,
      scores: {
        stubMatch: 10,
        stubPenalty: -1,
        stemMatch: 12,
        stemPenalty: -1,
        wordMatch: 20 ,
        wordPenalty: -1,
        orderMatch: 1,
        stubPartialMatch: 40,
        stubPartialPenalty: -7,
        initialMatch: 3,
        initialPenalty: -4,
        reverseMatch: 2,
        reversePenalty: -4
      }
    };
    
    var cleanerOpts, referenceList;
    /**
     * set options
     * @param {object} options set options
     */
    self.init =  function (options) {
    
      // extend out the default options
      cleanerOpts = Utils.vanExtend (  CLEANER_OPTIONS , options);
  
      // init && add award as a useless word to the normal lot
      Stopwords.setOptions (cleanerOpts).add (cleanerOpts.extraStops);
      return self;
    };
    
    /**
     * sets a reference list for this instance
     * @param {[object]} data array of obs
     * @param {function} how to get a row
     * @return self
     */
    self.setReferenceList = function ( data , getRow ) {
      referenceList = data.map (function (d) {
        return self.cleaner( getRow ? getRow (d) : d) ;
      });
      return self;
    };
    
    self.getReferenceList = function () {
      if (!referenceList) throw 'use setReference list to make one';
      return referenceList;
    };
    /**
     * roughly find
     * @param {[[string]]}  [refList] a cleaned reference list {phrase:string, words:[string], tokens: [string]}
     * @param {string} inputPhrase the phrase to find
     * @return ([object]) matches {phrase:{score:number, }
     */
    self.matcher = function ( inputPhrase , refList) {
    
      // clean the phrase
      var cleanedList = refList || self.getReferenceList();
      
      cleanedPhrase = self.cleaner (inputPhrase);
      const stubs = cleanedPhrase.stubs || [];
      const phrase = cleanedPhrase.phrase || "";
      const words = cleanedPhrase.words || [];
      const stems = cleanedPhrase.stems || [];
      const scores = cleanerOpts.scores;
      const initials = words.map (function (d) {
        return d.slice(0,1);
      });
      
      // get a score for each item in the list
      return cleanedList.map (function (row, index) {
  
        const scoreDetails = {
          wordMatch:scorer ( scores,words, row.words , "wordMatch" , "wordPenalty"),
          stubMatch:scorer ( scores,stubs, row.stubs , "stubMatch" , "stubPenalty"),
          stemMatch:scorer ( scores,stems, row.stems , "stemMatch" , "stemPenalty"),
          initialMatch:scorer ( scores, initials, row.initials , "initialMatch" , "initialPenalty"),
          reverseMatch:scorer ( scores, row.stubs, stubs , "reverseMatch" , "reversePenalty"),
          stubPartial: scorer ( scores, stubs, row.stubs , "stubPartialMatch" , "stubPartialPenalty", function (inp, str) {
            return inp.some(function(d) {
              return d.indexOf (str) !== -1;
            }) ? 0 : -1;
          })
        };
        const score = Object.keys(scoreDetails).reduce (function (p,c) {
          return p + scoreDetails[c];
        },0);
        
  
        // normalize higher scores a little..
        const maxScore = (row.words.length * scores.wordMatch) + 
          (stubs.length * scores.stubMatch) + 
          (stems.length * scores.stemMatch) + 
          (stems.length * scores.orderMatch) + 
          (stubs.length * scores.orderMatch * 2) + 
          (words.length * scores.orderMatch * 2) + 
          (words.length * scores.initialMatch) + 
          (row.stubs.length * scores.reverseMatch) + 
          (stubs.length * scores.stubPartialMatch) ;    
        
        return {
          score: maxScore ? score/maxScore : 0,
          row: row ,
          input: cleanedPhrase,
          index: index,
          row: row,
          maxScore: maxScore,
          rawScore: score,
          scoreDetails: scoreDetails
        }
      })
      .filter (function (d) {
        return d.score >= cleanerOpts.min;
      })
      .sort (function (a,b) {
        return b.score - a.score;
      });
    };
    
    // generic scorer
    function scorer( scores, input , rowInput , match, penalty , indexMethod) {
      //  a score  word matching
      var score = 0;
      indexMethod = indexMethod || function (inp,str) {
        return inp.indexOf(str);
      };
      
      if (input.length) {
        // stubs in the row
        const mover = -1;
        input.forEach (function (s) {
          // find the word/stem/stub in the reference row
          const ix = indexMethod ( rowInput, s);
          if (ix === -1) {
            score += scores[penalty];
          }
          else {
            score += scores[match];
            if (ix > mover) score += scores.orderMatch;
            mover = ix;
          }
        });
      }
      return score;
    }
  
    
     /**
     * @param {string} phrase the phrase to clean
     * @param {function} [synonyms] a function to replace words with synonyms of required
     * @return {[object]} the cleaned phrase as tokens
     */
    self.cleaner = function (phrase,synonyms) {
      
      // remove accents
      if (cleanerOpts.unAccent) {
        phrase = RemoveAccents.remove (phrase);
      }
      
  
      // spilt and remove unworthy separators
      phrase = phrase.toLowerCase().replace (/[\W_]/g," ").replace (/\s+/g," ").replace(/^\s/,"").replace(/\s$/,"");
      var words = phrase.split(" ");
      if (synonyms) words = synonyms(words);
      
      //remove stopwords
      if (cleanerOpts.stopwords) {
        //  but we need to have at leaset one word
         var r = Stopwords.clean (words);
         words = r.length ? r : [words[0]];
      };
      
      
      // next do any stemming (note that stemming that results in a stop word will mean it's kept
      var stems = [];
      if (cleanerOpts.stem) {
        stems = words.map ( function (d) {
          return Stemmer.getStem (d);
        });
      }
      
      
      // next get rid of stop words
      // note that the words may be different from the stems because unstemmed words may not match a stemmed list
      /*
      if (cleanerOpts.stopwords) {
        //  but we need to have at lease one word
         var r = Stopwords.clean (words);
         words = r.length ? r : [r[0]];
         r = Stopwords.clean (stems);
         stems = stems.length ? stems : [r[0]];
      };
      */
      // finally make a stub
      if (cleanerOpts.stub) {
        var stubs = (cleanerOpts.stem ? stems : words).map (function (d) { 
          return Stubber.make(d);
        });
      }
  
      return {
        phrase:phrase,
        words:words,
        stubs:stubs,
        stems:stems,
        initials:words.map (function (d) {
          return d.slice(0,1);
        })
      };
    };
  
  }
  
//--end:Rough

//--script file:Images
  /*
  
  This namespace was extracted and modified from 
  https://github.com/tanaikech/ImgApp
  
  The MIT License (MIT)
  Copyright (c) 2017 Kanshi TANAIKE
  
  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */
  var Images = (function (ns) {
  
  
    ns.sizer = {
    
      bmp: function (buff) {
        return {
          width: Utils.byte2num(buff.slice(18, 22), true),
          height: Utils.byte2num(buff.slice(22, 26), true),
        };
      
      },
      
      gif: function (buff) {
        return {
          width: Utils.byte2num(buff.slice(6, 8), true),
          height: Utils.byte2num(buff.slice(8, 10), true),
        }
      },
      
      jpg: function (buff) {
        var i, ma;
        i = 0;
        while (i < buff.length) {
          i += 1;
          if ((Utils.byte2hex_num(buff[i])) === "ff") {
            i += 1;
            ma = Utils.byte2hex_num(buff[i]);
            if (ma === "c0" || ma === "c1" || ma === "c2") {
              break;
            } else {
              i += Utils.hex2num(Utils.byte2hex(buff.slice(i + 1, i + 3)));
            }
          }
        }
        return {
          width: Utils.hex2num(Utils.byte2hex(buff.slice(i + 6, i + 8))),
          height: Utils.hex2num(Utils.byte2hex(buff.slice(i + 4, i + 6))),
        };
      },
      
      png: function (buff) {
        return {
          width: Utils.byte2num(buff.slice(16, 20), false),
          height: Utils.byte2num(buff.slice(20, 24), false),
        }
      }
    };
    
    
    const types = {
      png:["image/png"],
      bmp:["image/bmp"],
      jpg:["image/jpeg", "image/jpg"],
      gif:["image/gif"]
    };
    
    /** 
     * @param {blob} a blob
     * @return {object} various dimensions
     */
    ns.getInfo = function (blob) {
      var res;
      
      // function to extract 
      const buff = blob.getBytes();
      const contentType = blob.getContentType();
      
      // map to type
      const type = Object.keys(types).filter (function (d) {
        return types[d].indexOf(contentType) !== -1;
      })[0];
      
      if (!type) throw "unable to process content type " + contentType;
      if (!ns.sizer[type]) throw 'missing method for converting type ' + type;
      
      // do the work
      const info = ns.sizer[type] (buff);
      
      // add some more stuff
      info.blob = blob;
      info.type = type;
      info.contentType = contentType;
      info.size = buff.length;
      info.name = decodeURIComponent(blob.getName());
      const match = info.name.match (/\w+(?:\.\w+)*$/);
      info.fileName = match && match[0].toString();
      return info;
  
    };
    
  
  
    return ns;
  })({});
  
  
  
  
  
//--end:Images

//--script file:Flattener
  /**
   * @param {string} optObKeep if specified,objects of this key wont be flattened
   * @return {Flattener} self
   */
  
  var Flattener = function(optObKeep) {
    var self = this;
    self.obKeep = optObKeep || null;
    self.sep = ".";
    self.keepDates = false;
      self.setKeepDates = function (keep) {
      self.keepDates = keep;
      return self;
    };
    self.setSep = function (sep) {
      self.sep = sep;
      return self;
    };
    
    return self;          
  };
  
    
  /** get an array of objects from sheetvalues and unflatten them
   * @parameter {Array.object} values a 2 dim array of values return by spreadsheet.getValues()
   * @return {object} an unflatten object
   **/
  Flattener.prototype.getObjectsFromValues = function (values) {
    var self = this;
    var obs = [];
    for (var i=1 ; i < values.length ; i++){
      var k = 0;
      obs.push(self.unFlatten(values[i].reduce (function (p,c) {
        p[values[0][k++]] = c;
        return p;
      } , {})));
    }
    return obs;
    
  };
  
  /** get values from an array of objects by flattening and sorting all the keys found
   * @parameter {Array.object} obs an array of objects
   * @return {Array.object} a two dim array of values
   **/ 
  Flattener.prototype.getValues = function(obs) {
    var self = this;
    var headings = self.getHeadingMap(obs);
    var headingValues = Object.keys(headings);
    var width = headingValues.length;
    
    return [headingValues].concat(obs.map ( function (row) {
      var v =[];
      for (var i=0;i<width;i++)v.push('');
      var o = self.flatten(row);
      Object.keys(o).forEach( function (k) {
        v[headings[k]] = o[k];
      });
      return v;
    }));
    
  };
    
  /** get headings from an array of objects by flattening and sorting all the keys found
   * @parameter {Array.object} obs an array of objects
   * @return {object} a flattened object with a property for each key and its position
   **/ 
  Flattener.prototype.getHeadingMap = function(obs) {
    var self = this;
    var headings = {},n=0;
    obs.forEach ( function (row) {
      headings = Object.keys(self.flatten(row)).reduce(function(p,c) {
        if (!p.hasOwnProperty(c)) {
          p[c] = 0;
        }
        return p;
      },headings );
    });
    // sort the keys
    return Object.keys(headings).sort ( function (a,b) {
      return a > b ? 1 : ( a===b ? 0 : -1);
    })
    .reduce(function (p,c) {
      p[c] = n++;
      return p;
    },{});
  };
    
  /** unFlatten an ob
   * creates this {a:1,b:2,c:{d:3,e:{f:25}},g:[1,2,3]}
   * from this {a:1,b:2,"c.d":3,"c.e.f":25,"g.0":1,"g.1":2,"g.2":3}
   * @parameter {object} ob the object to be unflattened
   * @return {object} the unflattened object
   **/
  Flattener.prototype.unFlatten = function (ob) {
    var self = this;
    return Object.keys(ob).reduce(function (p,c) {
      var pk=p, keys = c.split(self.sep);
      for (var i=0; i < keys.length-1 ;i++) {
        if (!pk.hasOwnProperty(keys[i])) { 
          pk[keys[i]] = self.isNumber(keys[i+1]) ? [] : {};
        }
        pk = pk[keys[i]];
      }
      var k = keys[keys.length-1];
      pk[k] = ob[c];
      return p;
    },Array.isArray(ob) ? [] : {});
    
  };
  
  /** flatten an ob
   * turns this {a:1,b:2,c:{d:3,e:{f:25}},g:[1,2,3]}
   * into this {a:1,b:2,"c.d":3,"c.e.f":25,"g.0":1,"g.1":2,"g.2":3}
   * @parameter {object} ob the object to be flattened
   * @return {object} the flattened object
   **/
  Flattener.prototype.flatten = function(ob) {
    var self = this;
    return  self.objectDot (ob).reduce(function(p,c){
      p[c.key] = c.value;
      return p;
    },{});
  };
  
  Flattener.prototype.objectSplitKeys  = function (ob,obArray,keyArray) {
    obArray = obArray || [];
    var self = this;
    //turns this {a:1,b:2,c:{d:3,e:{f:25}}}
    // into this, so that the keys can be joined to make dot syntax
    //[{key:[a], value:1},{key:[b], value:2} , {key:[c,d], value:3}, {key:[c,e,f], value:25}]
    
    if (self.isObject(ob)) {
  
      Object.keys(ob).forEach ( function (k) {
        var ka = keyArray ? keyArray.slice(0) : [];
        ka.push(k);
  
        if(self.isObject(ob[k])  && (!self.obKeep || !ob[k][self.obKeep]) && ( !self.keepDates || !self.isDateObject(ob[k]))) {
          self.objectSplitKeys (ob[k],obArray,ka);
        }
        else {
          obArray.push ( {key:ka, value:ob[k]} );
        }
        
      });
    }
    else {
      obArray.push(ob);
    }
    
    return obArray;
  };
  
    
  Flattener.prototype.objectDot = function (ob) {
    var self = this;
    return self.objectSplitKeys (ob).map ( function (o) {
      return {key:o.key.join(self.sep), value:o.value};
    });
  };
  
  Flattener.prototype.isObject  = function (obj) {
    return obj === Object(obj);
  }; 
  
  Flattener.prototype.isNumber = function (s) {
    return !isNaN(parseInt(s,10)) ;
  };
  
  Flattener.prototype.isDateObject = function (ob) {
    return this.isObject(ob) && ob.constructor && ob.constructor.name === "Date";
  };
  
  /** get headings from an array of objects by flattening and sorting all the keys found
   * @parameter {Array.object} obs an array of objects
   * @return {Array.object} an array of heading values
   **/ 
  Flattener.prototype.getHeadings = function(obs) {
    return Object.keys(this.getHeadingMap(obs));
  };
    
  
//--end:Flattener

//--script file:Crusher
  
  // plugins for Squeeze service 
  function CrusherPluginDriveService () {
  
    // writing a plugin for the Squeeze service is pretty straighforward. 
    // you need to provide an init function which sets up how to init/write/read/remove objects from the store
    // this example is for the Apps Script Advanced Drive service
    const self = this;
    
    // these will be specific to your plugin
    var settings_;
    var folder_ = null;
    
    
    // standard function to check store is present and of the correct type
    function checkStore () {
       if (!settings_.store) throw "You must provide the Drive App as the store";
       if (!settings_.chunkSize) throw "You must provide the maximum chunksize supported";
       if (!settings_.store.getRootFolder) throw 'The store must be the Drive App object';
       if (!settings_.prefix) throw 'The prefix must be the path of a folder eg /crusher/store';
       
       // set up the folder
      if (!folder_) {
        folder_ =  DriveUtils.setService (settings_.store).getFolderFromPath (settings_.prefix);
        if (!folder_) throw 'The prefix '+settings_.prefix+' refers to a folder that doesnt exist'; 
      }
      return self;
    }
    
    // start plugin by passing settings yiou'll need for operations
    /**
     * @param {object} settings these will vary according to the type of store
     */
    self.init = function (settings) {
      settings_ = settings || {};
      
      // set default chunkzise for cacheservice (5mb)
      settings_.chunkSize = settings_.chunkSize || 5000000;
      
      // respect digest can reduce the number of chunks read, but may return stale
      settings_.respectDigest = Utils.isUndefined (settings_.respectDigest) ? false : settings_.respectDigest;
      
      // must have a cache service and a chunksize, and the store must be valid
      checkStore();
  
      // now initialize the squeezer
      self.squeezer = new Squeeze.Chunking ()
        .setStore (folder_)  // note that the store becomes the folder at this stage
        .setChunkSize(settings_.chunkSize)   
        .funcWriteToStore(write)
        .funcReadFromStore(read)
        .funcRemoveObject(remove)
        .setRespectDigest (settings_.respectDigest)
        .setCompressMin (settings_.compressMin)
        .setPrefix (settings_.prefix);
      
      // export the verbs
      self.put = self.squeezer.setBigProperty;
      self.get = self.squeezer.getBigProperty;
      self.remove = self.squeezer.removeBigProperty;
      return self;
    };
  
    // return your own settings
    function getSettings () {
      return settings_;
    }
    
    function getTheFile (store, key) {
      var fs = store.getFilesByName(key);
      return fs.hasNext() ? fs.next() : null;
    }
    
    /**
     * remove an item
     * @param {string} key the key to remove
     * @return {object} whatever you  like
     */
    function remove (store, key) {
      checkStore();
      return Utils.expBackoff(function () { 
        const f = getTheFile(store,key);
        return f ? store.removeFile (f) : null; 
      });
    }
    
    /**
     * write an item
     * @param {object} store whatever you initialized store with
     * @param {string} key the key to write
     * @param {string} str the string to write
     * @param {number} expiry time in secs .. ignored in drive
     * @return {object} whatever you like
     */
    function write (store,key,str,expiry) {
      checkStore();
      return Utils.expBackoff(function () { 
        // Drive doesnt support auto expiry
        // this could be improved with a prune method - but for another day
        // if it's an existing file, overwrite, otherwise create
        var f = getTheFile (store, key);
        return f ? f.setContent (str) : store.createFile (key,str); 
      });
      
    }
    
    /**
     * read an item
     * @param {object} store whatever you initialized store with   
     * @param {string} key the key to write
     * @return {object} whatever you like
     */
    function read (store,key) {
      checkStore();
      return Utils.expBackoff(function () { 
        var f = getTheFile (store, key);
        return f ?  f.getBlob().getDataAsString() : null;
      });
    }
    
  
  
  }
  function CrusherPluginCacheService () {
  
    // writing a plugin for the Squeeze service is pretty straighforward. 
    // you need to provide an init function which sets up how to init/write/read/remove objects from the store
    // this example is for the Apps Script cache service
    const self = this;
    
    // these will be specific to your plugin
    var settings_;
    
    // standard function to check store is present and of the correct type
    function checkStore () {
       if (!settings_.store) throw "You must provide a cache service to use";
       if (!settings_.chunkSize) throw "You must provide the maximum chunksize supported";
       return self;
    }
    
    // start plugin by passing settings yiou'll need for operations
    /**
     * @param {object} settings these will vary according to the type of store
     */
    self.init = function (settings) {
      settings_ = settings || {};
      
      // set default chunkzise for cacheservice
      settings_.chunkSize = settings_.chunkSize || 100000;
      
      // respect digest can reduce the number of chunks read, but may return stale
      settings_.respectDigest = Utils.isUndefined (settings_.respectDigest) ? false : settings_.respectDigest;
      
      // must have a cache service and a chunksize
      checkStore();
  
      // now initialize the squeezer
      self.squeezer = new Squeeze.Chunking ()
        .setStore (settings_.store)
        .setChunkSize(settings_.chunkSize)   
        .funcWriteToStore(write)
        .funcReadFromStore(read)
        .funcRemoveObject(remove)
        .setRespectDigest (settings_.respectDigest)
        .setCompressMin (settings_.compressMin)
        .setPrefix (settings_.prefix);
      
      // export the verbs
      self.put = self.squeezer.setBigProperty;
      self.get = self.squeezer.getBigProperty;
      self.remove = self.squeezer.removeBigProperty;
      return self;
    };
  
    // return your own settings
    function getSettings () {
      return settings_;
    }
    
    /**
     * remove an item
     * @param {string} key the key to remove
     * @return {object} whatever you  like
     */
    function remove (store, key) {
      checkStore();
      return Utils.expBackoff(function () { 
        return store.remove (key); 
      });
    }
    
    /**
     * write an item
     * @param {object} store whatever you initialized store with
     * @param {string} key the key to write
     * @param {string} str the string to write
     * @param {number} expiry time in secs
     * @return {object} whatever you like
     */
    function write (store,key,str,expiry) {
      checkStore();
      return Utils.expBackoff(function () { 
        return expiry ? store.put (key , str ,expiry ) : store.put (key,str); 
      });
      
    }
    
    /**
     * read an item
     * @param {object} store whatever you initialized store with   
     * @param {string} key the key to write
     * @return {object} whatever you like
     */
    function read (store,key) {
      checkStore();
      return Utils.expBackoff(function () { 
        return store.get (key); 
      });
    }
    
  
  
  }
  
  function CrusherPluginPropertyService () {
  
    // writing a plugin for the Squeeze service is pretty straighforward. 
    // you need to provide an init function which sets up how to init/write/read/remove objects from the store
    // this example is for the Apps Script cache service
    const self = this;
    
    // these will be specific to your plugin
    var settings_;
    
    // standard function to check store is present and of the correct type
    function checkStore () {
       if (!settings_.store) throw "You must provide a cache service to use";
       if (!settings_.chunkSize) throw "You must provide the maximum chunksize supported";
       return self;
    }
    
    // start plugin by passing settings yiou'll need for operations
    /**
     * @param {object} settings these will vary according to the type of store
     */
    self.init = function (settings) {
      settings_ = settings || {};
      
      // set default chunkzise for cacheservice
      settings_.chunkSize = settings_.chunkSize || 9000;
      
      // respect digest can reduce the number of chunks read, but may return stale
      settings_.respectDigest = Utils.isUndefined (settings_.respectDigest) ? false : settings_.respectDigest;
      
      // must have a cache service and a chunksize
      checkStore();
  
      // now initialize the squeezer
      self.squeezer = new Squeeze.Chunking ()
        .setStore (settings_.store)
        .setChunkSize(settings_.chunkSize)   
        .funcWriteToStore(write)
        .funcReadFromStore(read)
        .funcRemoveObject(remove)
        .setRespectDigest (settings_.respectDigest)
        .setCompressMin (settings_.compressMin);
      
      // export the verbs
      self.put = self.squeezer.setBigProperty;
      self.get = self.squeezer.getBigProperty;
      self.remove = self.squeezer.removeBigProperty;
      return self;
    };
  
    // return your own settings
    function getSettings () {
      return settings_;
    }
    
    /**
     * remove an item
     * @param {string} key the key to remove
     * @return {object} whatever you  like
     */
    function remove (store, key) {
      checkStore();
      return Utils.expBackoff(function () { 
        return store.deleteProperty (key); 
      });
    }
    
    /**
     * write an item
     * @param {object} store whatever you initialized store with
     * @param {string} key the key to write
     * @param {string} str the string to write
     * @return {object} whatever you like
     */
    function write (store,key,str) {
      checkStore();
      return Utils.expBackoff(function () { 
        return store.setProperty (key , str  ); 
      });
      
    }
    
    /**
     * read an item
     * @param {object} store whatever you initialized store with   
     * @param {string} key the key to write
     * @return {object} whatever you like
     */
    function read (store,key) {
      checkStore();
      return Utils.expBackoff(function () { 
        return store.getProperty (key); 
      });
    }
    
  
  
  }
  
  
//--end:Crusher

//--script file:Fetcheroo
  /**
   * a general purpose fetcher 
   * supports caching (including oversize and zipping) and paging
   */ 
  var Fetcheroo = function () {
    const self = this;
    const utils = Utils;
    const expb = utils.expBackoff;
    const keyDigest = utils.keyDigest;
   
    
    var tokenService = function () {};
    
    // default settings
    // default settings are for a google style api
    self.settings =  {
      request: {
        protocol: 'https:',
        hostName: 'api.example.com',
        path: "",
        port: 443,
        method: 'GET',
        version:'',
        query: {},
        contentType:'application/json',
        headers: {
          Accept: 'application/json'
        }
      },
      fetcheroo: {
        enableCaching: true,
        pathRequired: true,
        tokenRequired: false,
        cacheCrusher:null,
        defaultPageSize: 50,
        logUrl: false,
        cleanData: function (result) {
          return result;
        },
        setNextPageToken: function (result,query) {
          if (result.data && result.data.nextPageToken) {
            query.pageToken =  result.data.nextPageToken;
          }
          else if (query.hasOwnProperty("pageToken")) {
            delete query.pageToken;
          }
          return query.pageToken;
        },
        setPageSize : function (allData , request , query ) {
          if (typeof request !== "object") throw "setpagesize request must be an object";
          if (typeof query !== "object") throw "setpagesize query must be an object";
          if (!Array.isArray(allData)) throw "allData query must be an array";
          var ds =  self.settings.fetcheroo.defaultPageSize;
          if (request.limit) {
            if (allData.length <= request.limit) {
              query.pageSize = Math.min (ds , request.limit - allData.length);
            }
            else {
              throw 'attempt to retrieve more than the limit of '+ request.limit + ' already did ' + allData.length;
            }
            return query.pageSize;
          }
          else if (!utils.isUndefined(request.limit) ){
            query.pageSize = ds;
            return ds;
          }
          else {
            return undefined;
          }
  
        },
        cacheSeconds: 60 * 60 * 4    // 4 hours
      }
    };
  
    /**
     * get caching 
     * whether its enabled or not
     * @return {boolean}
     */
    self.getCaching = function () {
      return self.settings.fetcheroo.enableCaching;
    };
    
    /**
     * set caching
     * @param {boolean} enable whether to enable or disable caching
     * @return self
     */
    self.setCaching = function (enable) {
      if (Utils.isUndefined(enable)) throw 'must specify true or false to enable caching';
      self.settings.fetcheroo.enableCaching = enable ? true : false;
      return self;
    };  
    
    /**
     * init takes settings updates
     * @param {function}  this will be url fetch app probably 
     * @param {object} options to merge with default fetch options
     * @param {object} settings to merge with default settings
     * @return self
     */
    self.init = function (fetchApp, options,settings) {
      self.fetchApp = fetchApp;
      self.settings = utils.vanExtend ( self.settings , {
        request: options || {},
        fetcheroo: settings || {}
      });
  
      self.cc =  self.settings.fetcheroo.cacheCrusher;
      return self;
    };
    
    /** 
    * set access token
    * @param {function} accessTokenService token
    * @return self
    */
    self.setTokenService = function (accessTokenService) {
      tokenService = accessTokenService;
      return self;
    };
  
    /**
    * convert urlfetch response into result
    * .error will contain the text if there weas one
    * .data the parsed result
    *. code the response code
    */
    self.makeResult = function (result) {
      const rob = {};
      
      const text = result.getContentText();
      rob.code = result.getResponseCode();
      rob.responseHeaders = result.getAllHeaders();
     
      // standard good/bad errors
      if (rob.code < 200 || rob.code >= 300) {
        rob.error = text;
      }
      
      // assume we'll always get JSON
      else {
        try {
          rob.data = JSON.parse(text);
          rob.text = text;
        }
        //that didnt work, so get the blob.
        catch (err) {
          rob.blob =  result.getBlob();
        }
      }
      
      return rob;
    };
    
    /**
     * these are just shortcuts for basic requests
     */
    self.get = function (path) {
      return self.request (path , {method:"GET"} );
    };
    
    self.post = function (body, path) {
      return self.request (path , {method:"POST"} , null ,body );
    };
    
    /**
    * construct a request 
    *@param {string} path the specific path to be appended to the host
    *@param {object} options any additional options for the request
    *@param {object} query and parameteres to construct for the url
    *@param {object} body the post body
    *@param {function} cleandata a function to disentangle the api response if required
    *@param {number} limit max to get
    *@return {object} a result {error:,code:,data:[]}
    */
    self.request = function (request) {
  
      request = request || {};
                              
      // short cuts
      const fs = self.settings.fetcheroo;
      const dft = self.settings.request;
      const token = fs.tokenRequired && tokenService();
      if (fs.tokenRequired && !token) throw 'token required - use set token';
  
      // add options
      var options = utils.vanExtend ({
        method: dft.method,
        headers: dft.headers,
        muteHttpExceptions: true
      }, request);
      
      
      // normalize                     
      options.method = options.method.toUpperCase();
      if (token)options.headers.Authorization = "Bearer " + token;
      
      // always need a path?
      var path = request.path || dft.path;
      if (fs.pathRequired && !path) throw 'path required';
      if (path && path.charAt(0) !== '/') path = '/' + path;
  
      // sort out the payload
      if (['POST', 'PATCH', 'PUT', 'DELETE'].indexOf(options.method) !== -1) {
        if (dft.contentType) options.contentType = dft.contentType;
        
        // if there's a body
        var body  = request.body;
        if (!utils.isUndefined(body) && dft.contentType === "application/json") {
          options.payload = JSON.stringify (body);
        }
        else {
          options.payload = body;
        }
  
      }
      // do the request and page it if required
      const url = dft.protocol + "//" + dft.hostName+ ":" + dft.port + dft.version;
  
      return self.paging ( {
        url: url,
        startPath: path,
        options: options, 
        query: request.query,
        cleanData: request.cleanData,
        limit: request.limit,
        setPageSize: request.setPageSize
      });
  
    };
    
    
    /**
     * do a fetch and deal with paging
     * @param {object} request 
     * @return a result
     */
    self.paging = function (request) {
      
      // short cuts
      const fs = self.settings.fetcheroo;
      const fo = self.settings.request;
      
      // pile up results here
      var allData = [];
      var allErrors = [];
      
      // deconstruct params
      var url = request.url;
      var startPath = request.startPath;
      var options = request.options; 
      var query = utils.clone (request.query);
      var cleanData = request.cleanData || fs.cleanData ;
      var setPageSize = request.setPageSize || fs.setPageSize;
      var limit = request.limit ;
     
      // get a digest for caching GET and see if its in cache
      const digest = options.method === "GET" && self.cc  ? keyDigest (url , startPath , options, query , limit + "") : "";
      var cached = digest && self.getCaching() && self.cc.get (digest);
      if (digest && !self.getCaching()) {
        // delete previous as it'll potentially be stale compared to this fetch
        self.cc.remove (digest);
      }
  
      // paging request final result
      var final={data:[], text: "" , code:200, responseHeaders: null , wasCached:cached ? true : false};
      
      // if it wasn't in cache
      if (!cached) {
        
       
        // loop and do paging
        do {
          // add any url params
          var more = false;
          var pageSize = setPageSize (allData , request , query);
          if (pageSize || utils.isUndefined (pageSize)) {
            var path = utils.addQueryToPath (query , startPath);
            if (fs.logUrl) {
              Logger.log (path);
            }
            // do the fetch
            var result = expb (function () {
              return self.makeResult(self.fetchApp.fetch(url + path, options));
            });
            
            if (result.error) {
              // TODO do something about the headers for error 429
              allErrors.push ({ code: result.code ,error:result.error});
            }
            else {
              
              // paging if necessary
              var more = fs.setNextPageToken(result , query ) ;
              
              // clean up the data for this kind of result
              result = cleanData (result);
  
              // clean data is supposed to maintain an array of results in result.data
              if (result.data) {
                if (!Array.isArray (result.data)) throw 'cleandata should have created an array of results in result.data';
                // append to final result
                utils.arrayAppend (allData , result.data );
              }
            }
          }
          // while still getting data 
        } while ( more ) ;
        
        // all data to cache
        if (!allErrors.length) { 
          if (digest && self.getCaching()) {
              self.cc.put ( digest , allData , self.settings.fetcheroo.cacheSeconds );
          }
          final.data = allData;
        }
        else {
          // what will we do when there's been an error ?
          // probably best to scratch all the results, and take the first error code
          final.code = allErrors[0].code;
          final.error = allErrors.map (function (d) { return d.error;}).join (",");
        }
      }
      else {
        // we have it in cache already
        final.data = cached;
  
      }
      return final;
    };
  };
  
  
  
//--end:Fetcheroo

//--script file:Tester
  function Tester () {
  
      var self = this;
      var indent = 0; 
      var good ;
      var flogger = function (mess) {
        Logger.log (mess);
      };
      
      function spaces () {
        return new Array(indent+1).slice().join ("-");
      }
      
      self.assure = function (valid) {
        if (!valid) good = false;
        if (!valid) {
          self.logger (Array.prototype.slice.call(arguments,1));
        }
        return valid;
      };
      
      self.assureThrow = function (valid) {
        if (!valid) good = false;
        if (!valid) {
          self.thrower (Array.prototype.slice.call(arguments,1));
        }
        return valid;
      };
      self.logger = function () {
        var args = Array.prototype.slice.apply(arguments);
        var mess = (args || []).map (function (d) {
          if (typeof d === "object") return JSON.stringify(d);
          return d.toString ? d.toString() : d;
        }).join ("\n" + spaces());
        flogger (spaces() + mess);
        return self;
      };
    
      self.thrower = function () {
        var args = Array.prototype.slice.apply(arguments);
        var mess = (args || []).map (function (d) {
          if (typeof d === "object") return JSON.stringify(d);
          return d.toString ? d.toString() : d;
        }).join ("\n" + spaces());
        throw mess;
        return self;
      };
    
      self.it = function (test , func) {
        good = true;
        self.logger ("starting test " + test);
        var result = func();
        self.logger ("ending test " + test + (good ? "-OK" :"-FAILED"));
        return result;
      };
      
      self.describe = function (section , func ) {
        self.logger  ("starting section " + section) ;
        indent += 2;
        var result = func();
        indent -=2;
        self.logger  ("ending section " + section) ;
        return result;
      };
  }
//--end:Tester

//--script file:Unnest
  var Unnest = (function (ns){
  
    /**
    * converts blowup into table
    *
    * @param {object[]} {blownup} the array from blowup
    * @param {function} {sorter} a function to sort the headers
    * @return {*[][]} the 2 dimensional array of values with the headers in the first row
    */
    ns.blownupToTable = function (options) {
      var blownup = options.blownup;
      var sorter = options.sorter || function(mentions) {
        return Object.keys(mentions).sort(function (a, b) { return a - b; });
      };
      
      // collect all the property names
      var mentions = blownup.reduce(function (p, c) {
        Object.keys(c).forEach(function (k, i) {
          p[k] = i;
        });
        return p;
      }, {});
      
      // make that into a header row
      var headerRow = sorter(mentions);
      // now add the rows after the header
      // & we dont really like undefined in sheets, so replace with null.
      return [headerRow].concat(blownup.map(function(row) {
        return headerRow.map(function (h) {
          return typeof row[h] === typeof undefined ? null : row[h]
        });
      }));
    };
    
    /**
    * an array of object(or an object of arrays) gets blown up into rows one row per array element
    * nested arrays are handled too so an array of 5 with 10 nested array would create 50 rows and so on
    * array members dont need to have the same properties, and can each contain separate nested arrays
    * each flattened property is given a property name reflecting the object tree preceding, so
    * {a:{b:{c:{name:'rambo'}}}} 
    * would be expressed as
    * {a_b_c_name: 'rambo'}
    * {a:{b:[{c:{name:'rambo'}}, {c:{name:'terminator'}}]}}
    * would be expressed as 
    * [{a_b_c_name: 'rambo'},[{a_b_c_name: 'terminator'}]
    * @param {object|object[]} {ob} the object to be blown up
    * @param {string} [{sep}] the separator to use betwenn propertyu name sections
    * @param {function} [{cloner}] a function to deep clone an obje
    */
    ns.blowup = function (options) {
      var ob = options.ob;
      var sep = options.sep || '_';
      var cloner = options.cloner || function(item) { return JSON.parse(JSON.stringify(item))};
      
      var isObject = function (sob) {
        return typeof (sob) === 'object' && !(sob instanceof Date);
      };
      
      // recursive piece
      var makeRows = function (sob, rows, currentKey, cob) {
        rows = rows || [];
        currentKey = currentKey || '';
        cob = cob || {};
        
        // ignore undefined or null items
        if (typeof sob === typeof undefined || sob === null) {
          return rows;
        } else if (Array.isArray(sob)) {
          // going to work through an array creating 1 row for each element
          // but without adding to the current key
          // make deep clone of current object
          sob.forEach(function(f, i) {
            // make clone of what we have so far to replicate across
            var clob = cloner(cob);
            // the first element updates an existing row
            // subsequent elements add to the number of rows
            if (i) {
              rows.push(clob);
            } else {
              rows[rows.length ? rows.length - 1 : 0] = clob;
            }
            // recurse for each element
            makeRows(f, rows, currentKey, clob);
          });
        } else if (isObject(sob)) {
        // deal with the non object children first so they get cloned too   
          Object.keys(sob).sort(function(a,b) { 
           return isObject(sob[a]) && isObject(sob[b]) ? 0 : (isObject(sob[b]) ? -1: 1);
          }).forEach(function (k, i) {
            // add to the key, but nothing to the accumulating object
            makeRows(sob[k], rows, currentKey ? currentKey + sep + k : k, cob);
          });
        } else {
          // its a natural value
          if (cob.hasOwnProperty(currentKey)) {
            // something has gone wrong here - show should probably be a throw
            Logger.log('attempt to to overwrite property', cob, currentKey, 'row', rows.length);
          } else {
            cob[currentKey] = sob;
          }
        }
        return rows;
      };
      
      // do the work - the input data should be an array of objects
      if(!Array.isArray(ob)) ob = [ob];
      return makeRows(ob);
    };
    
    ns.table = function (options) {
      var blownup = ns.blowup(options);
      return ns.blownupToTable ({ blownup: blownup, sorter: options.sorter });                       
    };
    return ns;
  }) ({});
  
  
//--end:Unnest

//--script file:Maths
  /**
   * this namespace will have various stats and maths functions
   */
  var Maths = (function (ns) {
    /**
     * create a skewed distribution
     * src - https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
     * @param {number} min min value
     * @param {number} max max value
     * @param {number} skew a value of 1 will give a normal distribution < 1 bias to the right, > 1 bias to the left
     */
  
    ns.skewedDistribution = function  (min, max, skew) {
  
      var u = 0;
      var v = 0;
      while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
      while(v === 0) v = Math.random();
      var num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  
      num = num / 10.0 + 0.5; // Translate to 0 -> 1
      if (num > 1 || num < 0) num = ns.skewedDistribution(min, max, skew); // resample between 0 and 1 if out of range
      num = Math.pow(num, skew); // Skew
      num *= max - min; // Stretch to fill range
      num += min; // offset to min
      return num;
    };
  
  
    return ns
  })({})
  
//--end:Maths

//--script file:Fiddler
  /**
  * this is the V8 version
  * if you need the legacy version use cUseful.Fiddler
  * this is a utility for messing around with 
  * values obtained from setValues method 
  * of a spreadsheet
  * @contructor Fiddler
  * @param {Sheet} [sheet=null] populate the fiddler 
  */
  function Fiddler(sheet) {
  
    var self = this;
    var _values,
      _headerOb = null,
      _dataOb = [],
      _empty = true,
      _hasHeaders = true,
      _functions,
      _renameDups = true,
      _renameBlanks = true,
      _blankOffset = 0,
      _sheet = null,
      _headerFormat = {},
      _columnFormats = null,
      _tidyFormats = false,
      _flatOptions = null,
      _formulaOb = null,
      _formulas,
      _custom = null,
      _defaultFlat = {
        flatten: true,
        objectSeparator: ".",
        itemSeparator: ",",
        expandArray: true,
        columns: []
      };
  
      const _isUndef = (value) => {
        return typeof value === typeof undefined
      }
      const _isNull = (value) => {
        return value === null
      }
  
      const _isNundef = (value) => _isUndef(value) || _isNull(value)
      const _isObject = (value) => Object(value) === value
      const _isDate = (value) => (value instanceof Date)
      const _forceArray = (item) => Array.isArray(item) ? item : [item]
  
    /**
     * TODO .. its a long story because of formatting 
     * work out details for next major version
     *
     * flattener works like this
     * when writting to a sheet
     * any objects get flattened 
     *  {a:1,b:2,c:{d:3,e:{f:25}},g:[1,2,3]}
     *  becomes  
     *  header of a,b c.d c.e.f g.o g.1 g.2
     *  values of 1 2 3 25 1 2 3
     *  objectseparator(".") is used in headers as in "c.d" and "g.1" 
     *  and itemSeparator is used in arrays where expandArray is true as in 1 2 3 versus 1,2,3 in a single column
     * when reading from a sheet
     *  headers are investigated for patterns like above and get shrunk back into objects/arrays
     **/
  
    /**
    * these are the default iteration functions
    * for the moment the do nothing
    * just here for illustration
    * properties take this format
    * not all are relevant for each type of function
    * .name the name of the column
    * .data all the data in the fiddle
    * .headers the header texts
    * .rowOffset the row number starting at 0
    * .columnOffset the column number starting at 0
    * .fiddler this object
    * .values an array of values for this row or column
    * .row an object with all the properties/values for the current row
    * .fiddler the fiddler obkect
    */
    var _defaultFunctions = {
  
      /**
       * used to compare two values
       * @param {*} a itema
       * @param {*} b item b
       * @return {boolean} whether the same
       */
      compareFunc: function (a, b) {
        return a === b;
      },
  
      /**
      * used to filter rows
      * @param {object} row the row object
      * @param {object} properties properties of this  row
      * @return {boolean} whether to include
      */
      filterRows: function (row, properties) {
        return true;
      },
  
      /**
      * used to filter columns
      * @param {string} heading the heading text 
      * @param {object} properties properties of this  column
      * @return {boolean} whether to include
      */
      filterColumns: function (heading, properties) {
        return true;
      },
  
      /**
      * used to change objects rowwise
      * @param {object} row object 
      * @param {object} properties properties of this row
      * @return {object} modified or left as is row 
      */
      mapRows: function (row, properties) {
        return row;
      },
  
      /**
      * used to change values columnwise
      * @param {[*]} values the values for each row of the column
      * @param {object} properties properties of this column
      * @return {[*]|undefined} values - modified or left as is 
      */
      mapColumns: function (values, properties) {
        return values;
      },
  
      /**
      * used to change values columnwise in a single column
      * @param {*} value the values for this column/row
      * @param {object} properties properties of this column
      * @return {[*]|undefined} values - modified or left as is 
      */
      mapColumn: function (value, properties) {
        return value;
      },
  
      /**
      * used to change header values
      * @param {string} name the name of the column
      * @param {object} [properties] properties of this column
      * @return {*} values - modified or left as is 
      */
      mapHeaders: function (name, properties) {
        return name;
      },
  
      /**
      * returns the indices of matching values in a column
      * @param {*} value the values for this column/row
      * @param {object} properties properties of this columnrang
      * @return {boolean} whether it matches 
      */
      selectRows: function (value, properties) {
        return true;
      }
  
    };
  
    // maybe a later version we'll allow changing of default functions
    _functions = _defaultFunctions;
  
  
  
    /**
     * RangeValuePair - an object that contains the range and values
     * @typedef {Object} RangeValuePair
     * @property {string} name - any name for identification(usually a column name)
     * @property {*[[]} values - The  values - ready for use with setValues
     * @property {Range} range - The range it applies to
     */
  
    /**
     * set a custom value in the fiddler - can be anything
     * @param {*} value value to set
     * @return {Fiddler} self
     */
    self.setCustom = (value) => {
      _custom = value;
      return self;
    }
    /**
     * get a custom value in the fiddler - can be anything
     * @return {*} custom value
     */
    self.getCustom = () => _custom
  
    /**
     * convert columns to values
     * @param {string|string[]} [columnName] 0 or more column names to process -null is them all
     * @return {RangeValuePair[]} all you need to dump the columns
     */
    self.getDumper = (columnNames) => {
      // first get the rangeList for these columns
      columnNames = _patchColumnNames(columnNames)
      return self.getRangeList(columnNames).getRanges()
        .map((range, i) => {
          const name = columnNames[i]
          return {
            values: _dataOb.map(row => [row[name]]),
            range,
            name
          }
        })
    }
    /**
     * dump columns
     * @param {string|string[]} [columnName] 0 or more column names to process
     * @return {RangeValuePair[]} all you need to dump the columns
     */
    self.dumpColumns = (columnNames, sheet) => self.getDumper(columnNames).map(rp => {
      // first clear the existing data from that column
      const targetSheet = sheet || rp.range.getSheet()
      const rows = targetSheet.getDataRange().getNumRows()
      const range = sheet
        ? targetSheet.getRange(rp.range.getRow(), rp.range.getColumn()).offset(0, 0, rp.range.getNumRows(), rp.range.getNumColumns())
        : rp.range
      if (rows) range.offset(0, 0, rows, range.getNumColumns()).clearContent()
  
      // the data
      range.setValues(rp.values)
      // the header (if there is one)
      if (self.hasHeaders()) range.offset(-1, 0, 1, 1).setValue(rp.name)
      return {
        ...rp,
        range
      }
    })
  
    /**
     * get the formulas from the sheet
     * returns {object} self for chaining
     */
    self.needFormulas = () => {
      _formulas = self.getRange().getFormulas()
      _formulaOb = _makeFormulaOb()
      return self
    }
  
  
    // make a digest out of anything
    self.fingerprinter = (...args) => {
      // dont allow undefined
      if (_isNundef(args)) throw new Error('fingerprinter doesnt allow undefined or null args')
  
      // convert args to an array and digest them
      return Utilities.base64EncodeWebSafe(
        Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, args.map(d => {
          return _isObject(d) ? (_isDate(d) ? d.getTime() : JSON.stringify(d)) : (_isNundef(d) ? '_nundef_' : d.toString());
        }).join("-"), Utilities.Charset.UTF_8));
    };
  
    // all about digests for checking for fiddler dirtiness
  
    const _dirtyList = new Map()
    // this means digest all data
    _dirtyList.set('all', {
      columnNames: null,
      fingerprint: null,
      name: 'all'
    })
  
    const _checkDirtyWatch = (name) => {
      if (!_dirtyList.has(name)) {
        throw new Error(`${name} doesnt exist as a dirtywatch`)
      }
      return _dirtyList.get(name)
    }
  
    /**
     * @param {string} name the name to give this dirty list
     * @param {string[]} columnNames the names of the column it applies to
     * @return {object} self
     */
    self.setDirtyWatch = (name, columnNames) => {
      // replacing is allowed
      _dirtyList.set(name, {
        columnNames: _patchColumnNames(columnNames),
        fingerprint: null,
        name
      })
      // set the current fingerprint
      _dirtyList.get(name).fingerprint = self.getFingerprint(name)
      return self
    }
  
    /**
     * @param {string} name the name to give this dirty list
     * @return {string[]} the columnnames as an array
     */
    self.getDirtyWatch = (name = 'all') => _dirtyList.get(name)
  
    /**
     * gets a fingerprint for a collection of columns
     * @param {string} [name] the dirtywatch name
     * @return
     */
    self.getFingerprint = (name = 'all') => {
      const ob = _checkDirtyWatch(name)
      if (self.isEmpty()) return null
  
      // we need the headerOb as well since column positions may have swapped
      return !ob.columnNames ?
        self.fingerprinter(_dataOb, _headerOb) :
        self.fingerprinter(ob.columnNames.map(f => ({
          values: self.getColumnValues(f),
          header: _headerOb[f]
        })))
    }
  
    /**
     * updates all the fingerprints - should be done when the fiddler data is reset or initialized
     * so the rules are
     * when a fiddler is created it's empty, and its fingerprint is null
     * getFingerprint on an empty will always return null
     * setData && setValues (or resetfingerprints directly) are the only way to reset it to a new value
     * that new value becomes the new initial fingerprint
     * 
     * @return {object} self
     */
    const _resetFingerprints = () => {
      for (let [key, value] of _dirtyList) {
        value.fingerprint = self.getFingerprint(key)
      }
    }
  
    /**
     * gets a initial for a collection of columns from when the fiddler was first populated
     * @param {string} [name] the dirtywatch name
     * @return
     */
    self.getInitialFingerprint = (name) => self.getDirtyWatch(name).fingerprint
  
    /**
     * checks if the fiddler is dirty
     * @param {string} [name] see if the fiddler or certain columns are dirty
     * @return {Boolean} whether its dirty
     */
    self.isDirty = (name = 'all') => {
      const ob = _checkDirtyWatch(name)
      return ob.fingerprint !== self.getFingerprint(name) && !_isNull(ob.fingerprint)
    }
    /**
    * @param {Sheet} sheet
    */
    self.setSheet = function (sheet) {
      _sheet = sheet;
      return self;
    };
  
    /**
    * @return {Sheet} sheet
    */
    self.getSheet = function () {
      return _sheet;
    };
  
  
  
    /// ITERATION FUNCTIONS
    /**
    * iterate through each row - given a specific column
    * @param {string} name the column name
    * @param {function} [func] optional function that shoud true or false if selected
    * @return {number[]} matching row numbers
    */
    self.selectRows = function (name, func) {
  
      var values = self.getColumnValues(name);
      var columnIndex = self.getHeaders().indexOf(name);
      var result = [];
  
      // add index if function returns true
      values.forEach(function (d, i) {
        if ((checkAFunc(func) || _functions.selectRows)(d, {
          name: name,
          data: _dataOb,
          headers: _headerOb,
          rowOffset: i,
          columnOffset: columnIndex,
          values: values,
          row: _dataOb[i],
          fiddler: self
        })) result.push(i);
      });
  
      return result;
    };
  
    /**
    * iterate through each row - nodifies the data in this fiddler instance
    * @param {function} [func] optional function that shoud return a new row if changes made
    * @return {Fiddler} self
    */
    self.mapRows = function (func) {
  
      _dataOb = _dataOb.map(function (row, rowIndex) {
        var rowLength = Object.keys(row).length;
        var result = (checkAFunc(func) || _functions.mapRows)(row, {
          name: rowIndex,
          data: _dataOb,
          headers: _headerOb,
          rowOffset: rowIndex,
          columnOffset: 0,
          values: self.getHeaders().map(function (k) {
            return row[k];
          }),
          row: row,
          rowFormulas: _formulaOb && _formulaOb[rowIndex],
          fiddler: self
        });
  
        if (!result || typeof result !== "object") {
          throw new Error("you need to return the row object - did you forget?");
        }
  
        if (Object.keys(result).length !== rowLength) {
          throw new Error(
            'you cant change the number of columns in a row during map items'
          );
        }
  
  
        return result;
      });
  
      return self;
    };
  
    self.setRenameDups = function (rename) {
      _renameDups = rename;
      return self;
    };
    self.setRenameBlanks = function (rename) {
      _renameBlanks = rename;
      return self;
    };
    self.setBlankOffset = function (off) {
      _blankOffset = off;
      return self;
    };
  
    /**
    * get the unique values in a column
    * @param {string} columnName
    * @param {function} [compareFunc]
    * @return {[*]} array of unique values
    */
    self.getUniqueValues = function (columnName, compareFunc) {
  
      return self.getColumnValues(columnName)
        .filter(function (d, i, a) {
          return axof_(d, a, compareFunc) === i;
        });
  
    };
  
    // like indexof except with custom compare
    function axof_(value, arr, compareFunc) {
      var cf = checkAFunc(compareFunc) || _functions.compareFunc;
      for (var i = 0; i < arr.length; i++) {
        if (cf(value, arr[i])) return i;
      }
      return -1;
    }
  
  
    /**
    * iterate through each row - nodifies the data in this fiddler instance
    * @param {[string]} [columnNames] optional which column names to use (default is all)
    * @param {boolean} [keepLast=false] whether to keep the last row or the first found
    * @param {function} [compareFunc] compare values function
    * @return {Fiddler} self
    */
    self.filterUnique = function (columnNames, keepLast, compareFunc) {
  
      var headers = self.getHeaders();
      cols = _forceArray(columnNames || headers);
  
      // may need to reverse
      var data = _dataOb.slice();
  
      // check params are valid
      if (cols.some(function (d) {
        return headers.indexOf(d) === -1;
      })) {
        throw 'unknown columns in ' + JSON.stringify(cols) + ' compared to ' + JSON.stringify(headers);
      }
  
      // filter out dups
      data = data.filter(function (d, i, a) {
        // if we're keeping the first one, then keep only if there's none before
        // if the last one, then keep only if there are none following
        var soFar = keepLast ? a.slice(i + 1) : a.slice(0, i);
  
        return !soFar.some(function (e) {
          return cols.every(function (f) {
            return (checkAFunc(compareFunc) || _functions.compareFunc)(d[f], e[f]);
          });
        });
  
      });
  
  
  
      // register
      _dataOb = data;
      return self;
  
    };
    /**
     * set header format
     * @param {object} headerFormat {backgrounds:'string',fontColors:'string',wraps:boolean,fontWeights:'string'}
     * @return self
     */
    self.setHeaderFormat = function (headerFormat) {
      _headerFormat = headerFormat;
      return self;
    };
  
    /**
     * sort out a list of column names and throw if any invalid
     * @param {string[]} [columnNames] can be an array, single or undefined for all
     * @return {string[]} an array of column names
     */
    function _patchColumnNames(columnNames) {
      // undefined columnNames means them all
      // names can be a single column or an array
      var headers = self.getHeaders();
      columnNames = _isNundef(columnNames) ? headers : _forceArray(columnNames)
      var bad = columnNames.filter(function (d) {
        return headers.indexOf(d) === -1;
      });
      if (bad.length) throw "these columnNames don't exist " + bad.join(",");
      return columnNames;
    }
  
    /**
     * clear given column formats
     */
    self.clearColumnFormats = function (columnNames) {
      _columnFormats = _columnFormats || {};
      _patchColumnNames(columnNames)
        .forEach(function (d) {
          _columnFormats[d] = null;
        });
      return self;
    };
    /**
     * get all known columnFormats
     */
    self.getColumnFormats = function () {
      return _columnFormats;
    };
  
    /**
     * set tidy formats
     * @param {boolean} tidyFormats whether to tidy formats in space outside the data being written
     * @return self
     */
    self.setTidyFormats = function (tidyFormats) {
      _tidyFormats = tidyFormats;
      return self;
    };
  
    /** 
     * this can be handy for chaining 
     */
    self.getSelf = () => self
  
    /**
     * get tidy formats
     * @return {boolean} tidyFormats whether to tidy formats in space outside the data being written
     */
    self.getTidyFormats = function () {
      return tidyFormats;
    };
    /**
     * set column format 
     * @param {object} columnFormat eg{backgrounds:'string',fontColors:'string',wraps:boolean,fontWeights:'string'}
     * @param {string[]} [columnNames=all] default is it applies to all current columns
     * @return self
     */
    self.setColumnFormat = function (columnFormat, columnNames) {
      // validate them
      columnNames = _patchColumnNames(columnNames);
      // a non-null column format means we actually have an interest in columnformats
      _columnFormats = _columnFormats || {};
      // apply them
      columnNames.forEach(function (d) { _columnFormats[d] = columnFormat });
      return self;
    };
  
    /**
     * set flatting options
     * @param 
     * @return self
     */
    self.setFlattener = function (options) {
      flattenOptions_ = options;
      return self;
    };
  
    /**
     * get flattening options
     * @param 
     * @return self
     */
    self.getFlattener = function (options) {
      return flattenOptions_;
    };
  
    /**
     * applies  formats
     * @param {object} format eg .. {backgrounds:'string',fontColors:'string',wraps:boolean,fontWeights:'string'}
     * @param {Range}
     * @return {range}
     */
    self.setFormats = function (range, format) {
      // if there's anything to do
      var atr = range.getNumRows();
      var atc = range.getNumColumns();
      if (atc && atr) {
        // for every format mentioned
        Object.keys(format).forEach(function (f) {
          // check method exists and apply it
          var method = 'set' + f.slice(0, 1).toUpperCase() + f.slice(1).replace(/s$/, "").replace(/ies$/, "y");
          if (typeof range[method] !== "function") throw 'unknown format ' + method;
          range[method](format[f]);
        });
      }
      return self;
    };
  
    /**
    * applies  formats to a rangelist
    * @param {object} format eg .. {backgrounds:'string',fontColors:'string',wraps:boolean,fontWeights:'string'}
    * @param {Range} rangeList a rangelist
    * @return {range}
    */
    self.setRangelistFormat = function (rangeList, format) {
      // if there's anything to do
      if (rangeList) {
        Object.keys(format).forEach(function (f) {
          var method = 'set' + f.slice(0, 1).toUpperCase() + f.slice(1);
          // patch in case its plural 
          // https://github.com/brucemcpherson/bmFiddler/issues/2 - v29
          method = method.replace(/ies$/, "y").replace(/s$/, "");
          if (typeof rangeList[method] !== "function") throw 'unknown format ' + method;
          rangeList[method](format[f]);
        })
      }
      return self;
    };
  
    /**
     * apply header formats
     * @param {Range} range the start range for the headers
     * @param {object} [format= _headerFormat] the format object
     * @return self;
     */
    self.applyHeaderFormat = function (range, format) {
      if (!self.getNumColumns()) return self;
      format = format || _headerFormat;
      var rangeList = self.makeRangeList([range.offset(0, 0, 1, self.getNumColumns())], { numberOfRows: 1 }, range.getSheet());
      return self.setRangelistFormat(rangeList, _headerFormat);
    };
  
    /**
     * apply column formats
     * @param {Range} range the start range
     * @return self;
     */
    self.applyColumnFormats = function (range) {
      var foCollect = [];
  
      if (_columnFormats) {
        // we'll need this later
        var dr = range.getSheet().getDataRange();
        var atr = dr.getNumRows();
        /// make space for the header
        if (self.hasHeaders() && atr > 1) {
          dr = dr.offset(1, 0, atr - 1);
        }
        if (Object.keys(_columnFormats).length === 0) {
          // this means clear format for entire thing
          dr.clearFormat();
        }
        else {
          // first clear the bottom part of the sheet with no data
          var atr = dr.getNumRows();
          if (atr > self.getNumRows() && self.getNumRows()) {
            dr.offset(self.getNumRows() - atr, 0, atr - self.getNumRows()).clearFormat();
          }
  
          if (self.getNumRows()) {
            Object.keys(_columnFormats)
              .forEach(function (d) {
                var o = _columnFormats[d];
                // validate still exists
                var h = self.getHeaders().indexOf(d);
                if (h !== -1) {
                  // set the range for the data
                  var r = dr.offset(0, h, self.getNumRows(), 1);
                  if (!o) {
                    // its a clear
                    r.clearFormat();
                  }
                  else {
                    //self.setFormats  (r, o);
                    foCollect.push({
                      format: o,
                      range: r
                    });
                  }
                }
                else {
                  // delete it as column is now gone
                  delete _columnFormats[d];
                }
              });
          }
        }
      }
      else {
        // there;'s no formatting to do
      }
      // optimize the formatting
      var foNew = foCollect.reduce(function (p, c) {
        // index by the format being set
        var sht = c.range.getSheet();
        var sid = sht.getSheetId();
        Object.keys(c.format)
          .forEach(function (f) {
            var key = f + "_" + c.format[f] + "_" + sid;
            p[key] = p[key] || {
              value: c.format[f],
              format: f,
              ranges: [],
              sheet: sht
            };
            p[key].ranges.push(c.range);
          })
        return p;
      }, {});
  
      // now make rangelists and apply formats 
      Object.keys(foNew)
        .forEach(function (d) {
          var o = foNew[d];
          // make the range list - they are all ont he same sheet
          var sht = o.sheet;
          var rangeList = sht.getRangeList(o.ranges.map(function (e) { return e.getA1Notation(); }));
          // workout the method (could be pluralized)
          var method = "set" + o.format.slice(0, 1).toUpperCase() + o.format.slice(1).replace(/s$/, "").replace(/ies$/, "y");
          var t = {};
          t[o.format] = o.value;
          if (!rangeList[method]) {
            // fall back to individual ranges
            rangeList.getRanges()
              .forEach(function (e) {
                self.setFormats(e, t);
              });
          }
          else {
            rangeList[method](o.value);
          }
        });
  
      return self;
  
    }
    /**
     * get header format
     * @return self
     */
    self.getHeaderFormat = function () {
      return _headerFormat;
    };
  
    /**
    * iterate through each row - nodifies the data in this fiddler instance
    * @param {function} [func] optional function that shoud return true if the row is to be kept
    * @return {Fiddler} self
    */
    self.filterRows = function (func) {
  
      _dataOb = _dataOb.filter(function (row, rowIndex) {
        return (checkAFunc(func) || _functions.filterRows)(row, {
          name: rowIndex,
          data: _dataOb,
          headers: _headerOb,
          rowOffset: rowIndex,
          columnOffset: 0,
          fiddler: self,
          values: self.getHeaders().map(function (k) {
            return row[k];
          }),
          row: row
        });
      });
      return self;
    };
    /**
    * mapSort
    * @param {string} name column name
    * @param {boolean} [descending=false] sort order 
    * @param {Fiddler} [auxFiddler] another fiddler to drive the sort
    * @return {[object]} fiddler data sorted
    */
    self.sort = function (name, descending, auxFiddler) {
      if (self.getHeaders().indexOf(name) === -1) {
        throw new Error(name + ' is not a valid header name');
      }
      return self.handySort(self.getData(), {
        values: auxFiddler ? auxFiddler.getData() : null,
        descending: descending,
        extractFunction: function (values, a) {
          return values[a][name];
        }
      });
  
    };
    /**
     * sort returns sorted values
     * for chaining , can be handy to return the fiddler
     */
    self.sortFiddler = function (name, descending, auxFiddler) {
      var data = self.sort(name, descending, auxFiddler);
      // the true means we try to preserve the order of the original fiddler columns
      // if possible - as self data would normally recreate them according to insert time
      self.setData(data, true, false);
      return self;
    }
  
    self.handySort = function (displayValues, options) {
      // default comparitor & extractor
      options = options || {};
      var descending = options.descending || false;
      var defaultExtract = function (values, a) {
        return values[a];
      };
      var extractFunc = options.extractFunction || defaultExtract;
      var compareFunc = options.compareFunc || function (a, b) {
        return a > b ? 1 : (a === b ? 0 : -1);
      };
  
      // allow regular sorting too
      var values = options.values || displayValues;
  
      if (displayValues.length !== values.length) {
        throw 'value arrays need to be same length';
      }
  
      return displayValues.map(function (d, i) {
        // make an array of indices
        return i;
      })
        .sort(function (a, b) {
          // sort the according to values the point to
          return compareFunc(
            extractFunc(values, descending ? b : a), extractFunc(values, descending ? a : b)
          );
        })
        .map(function (d) {
          // reorder the tartget array according to index on the values
          return displayValues[d];
        });
  
    }
  
    /**
    * iterate through each column - modifies the data in this fiddler instance
    * @param {string} name the name of the column
    * @param {function} [func] optional function that shoud return new column data
    * @return {Fiddler} self
    */
    self.mapColumn = function (name, func) {
  
      var values = self.getColumnValues(name);
      var columnIndex = self.getHeaders().indexOf(name);
  
      values.forEach(function (value, rowIndex) {
  
        _dataOb[rowIndex][name] = (checkAFunc(func) || _functions.mapColumns)(value, {
          name: name,
          data: _dataOb,
          headers: _headerOb,
          rowOffset: rowIndex,
          columnOffset: columnIndex,
          fiddler: self,
          values: values,
          row: _dataOb[rowIndex],
          fiddler: self
        });
  
      });
  
      return self;
    };
  
    /**
    * iterate through each column - modifies the data in this fiddler instance
    * @param {function} [func] optional function that shoud return new column data
    * @return {Fiddler} self
    */
    self.mapColumns = function (func) {
  
      var columnWise = _columnWise();
      const columnWiseFormula = _columnWiseFormula
      var oKeys = Object.keys(columnWise);
  
      oKeys.forEach(function (key, columnIndex) {
        // so we can check for a change
        var hold = columnWise[key].slice();
        var result = (checkAFunc(func) || _functions.mapColumns)(columnWise[key], {
          name: key,
          data: _dataOb,
          headers: _headerOb,
          rowOffset: 0,
          columnOffset: columnIndex,
          fiddler: self,
          values: columnWise[key],
          formulas: columnWiseFormula && columnWiseFormula[key],
          fiddler: self
        });
  
        // changed no of rows?
        if (!result || result.length !== hold.length) {
          throw new Error(
            'you cant change the number of rows in a column during map items'
          );
        }
        // need to zip through the dataOb and change to new column values
        if (hold.join() !== result.join()) {
          result.forEach(function (r, i) {
            _dataOb[i][key] = r;
          });
        }
      });
  
      return self;
    };
  
    /**
    * iterate through each header
    * @param {function} [func] optional function that shoud return new column data
    * @return {Fiddler} self
    */
    self.mapHeaders = function (func) {
  
      if (!self.hasHeaders()) {
        throw new Error('this fiddler has no headers so you cant change them');
      }
  
      var columnWise = _columnWise();
      var oKeys = Object.keys(columnWise);
      var nKeys = [];
  
      oKeys.forEach(function (key, columnIndex) {
  
        var result = (checkAFunc(func) || _functions.mapHeaders)(key, {
          name: key,
          data: _dataOb,
          headers: _headerOb,
          rowOffset: 0,
          columnOffset: columnIndex,
          fiddler: self,
          values: columnWise[key],
          fiddler: self
        });
  
        // deleted the header
        if (!result) {
          throw new Error(
            'header cant be blank'
          );
        }
  
        nKeys.push(result);
      });
  
      // check for change
      if (nKeys.join() !== oKeys.join()) {
        _headerOb = {};
        _dataOb = _dataOb.map(function (d) {
          return oKeys.reduce(function (p, c) {
            var idx = Object.keys(p).length;
            _headerOb[nKeys[idx]] = idx;
            p[nKeys[idx]] = d[c];
            return p;
          }, {});
        });
      }
      return self;
    };
  
  
    /**
    * iterate through each column - modifies the data in this fiddler instance
    * @param {function} [func] optional function that shoud return true if the column is to be kept
    * @return {Fiddler} self
    */
    self.filterColumns = function (func) {
      checkAFunc(func);
  
      var columnWise = _columnWise();
      var oKeys = Object.keys(columnWise);
  
      // now filter out any columns
      var nKeys = oKeys.filter(function (key, columnIndex) {
        var result = (checkAFunc(func) || _functions.filterColumns)(key, {
          name: key,
          data: _dataOb,
          headers: _headerOb,
          rowOffset: 0,
          columnOffset: columnIndex,
          fiddler: self,
          values: self.getColumnValues(key),
          fiddler: self
        });
        return result;
      });
  
      // anything to be deleted?
      if (nKeys.length !== oKeys.length) {
        _dataOb = dropColumns_(nKeys);
        _headerOb = nKeys.reduce(function (p, c) {
          p[c] = Object.keys(p).length;
          return p;
        }, {});
      }
      return self;
    };
  
    //-----
  
    const _columnate = (ob, columnName) => {
      if (self.getHeaders().indexOf(columnName) === -1) {
        throw new Error(columnName + ' is not a valid header name');
      }
      // transpose the data
      return ob.map(function (d) {
        return d[columnName];
      });
    }
    /**
    * get the values for a given column
    * @param {string} columnName the given column
    * @return {*[]} the column values
    */
    self.getColumnValues = (columnName) => _columnate(_dataOb, columnName);
    self.getColumnFormulaValues = (columnName) => _formulaOb && _columnate(_formulaOb, columnName);
  
    /**
    * get the values for a given row
    * @param {number} rowOffset the rownumber starting at 0
    * @return {[*]} the column values
    */
    self.getRowValues = function (rowOffset) {
      // transpose the data
      return headOb_.map(function (key) {
        return d[rowOffset][headOb_[key]];
      });
    };
  
    /**
    * copy a column before
    * @param {string} header the column name 
    * @param {string} [newHeader] the name of the new column - not needed if no headers
    * @param {string} [insertBefore] name of the header to insert befire, undefined for end 
    * @return {Fiddler} self
    */
    self.copyColumn = function (header, newHeader, insertBefore) {
  
      // the headers
      var headers = self.getHeaders();
      var headerPosition = headers.indexOf(header);
  
      if (!header || headerPosition === -1) {
        throw new Error('must supply an existing header of column to move');
      }
  
      _insertColumn(newHeader, insertBefore);
  
      // copy the data
      self.mapColumns(function (values, properties) {
        return properties.name === newHeader ? self.getColumnValues(header) : values;
      });
  
      return self;
    };
  
    /**
     * given a sheet, will populate
     * @param {Sheet} sheet
     */
    self.populate = function (sheet) {
  
      // first set the default sheet
      self.setSheet(sheet);
  
      // get the range 
      var range = sheet.getDataRange();
  
      // set the values
      return self.setValues(range.getValues());
  
    };
  
    /**
     * dump values with default values 
     * @param {Sheet} [sheet=null] the start range to dump it to
     * @param {object} options {skipFormats:,skipValues}
     * @return self
     */
    function dump_values(sheet, options) {
  
      if (!sheet && !_sheet) throw 'sheet not found to dump values to';
      var range = (sheet || _sheet).getDataRange();
      if (!options.skipValues && !options.columnNames) range.clearContent();
  
      // if we're flattening then we need to do some fiddling with the data
      // TODO .. its a long story because of formatting 
      // do it in next major version
  
      // we only do something if there's anydata
      var r = self.getRange(range);
      var v = self.createValues();
  
      // we need to clear any formatting outside the ranges that may have been deleted
      if (_tidyFormats && !options.skipFormats) {
        var rtc = r.getNumColumns();
        var rtr = range.getNumRows();
        var atc = range.getNumColumns();
        var atr = range.getNumRows();
        var rc = atc > rtc && atr ?
          range.offset(0, rtc, atr, atc - rtc).getA1Notation() : "";
        var rr = atr > rtr && atc ?
          range.offset(rtr, 0, atr - rtr).getA1Notation() : "";
        var rl = [];
        if (rc) rl.push(rc);
        if (rr) rl.push(rr);
        if (rl.length) range.getSheet().getRangeList(rl).clearFormat();
      }
  
      // write out the sheet if there's anything
      if (!options.skipValues && v.length && v[0].length) {
        if (!options.columnNames) {
          r.setValues(v);
        } else {
          // we're doing selected ranges only
          self.dumpColumns(options.columnNames, sheet)
        }
      }
  
      // do header formats
      if (!options.skipFormats && v[0].length) self.applyHeaderFormat(range);
  
      // do column formats
      if (!options.skipFormats) self.applyColumnFormats(range);
  
      return self;
    };
    /**
    * dump values with default values 
    * @param {Sheet} [sheet=null] the start range to dump it to
    * @param {string[]} [columnNames] specific column names to apply
    */
    self.dumpValues = function (sheet, columnNames) {
      return dump_values(sheet, {
        skipFormats: false,
        skipValues: false,
        columnNames
      });
    };
    /**
    * dump values with default values 
    * @param {Sheet} [sheet=null] the start range to dump it to
    */
    self.dumpFormats = function (sheet) {
      return dump_values(sheet, {
        skipFormats: false,
        skipValues: true
      });
    };
  
    /**
     * get the header an index number
     * @param {string} the header
     * @return {number} the index
     */
    self.getHeaderIndex = function (header) {
      return self.getHeaders().indexOf(header);
    };
  
    /**
     * get the header by index number
     * @param {number} the index number (-1) the last one, -2 2nd last etc
     * @return {string} the header
     */
    self.getHeaderByIndex = function (index) {
      var headers = self.getHeaders();
      return index < 0 ? headers[headers.length + index] : headers[index];
    };
  
    self.getColumnsWithFormulas = () => {
      if (!self.getFormulaData()) throw new Error(`First use needFormulas() to bring in formulas before changing anything`)
  
      // now find which columns have any formulas
      return Array.from(self.getHeaders().reduce((p, c) => {
        if (self.getFormulaData().some(f => f[c])) p.add(c)
        return p
      }, new Set()))
    }
  
    /**
     * get a an a1 type range and add the sheet if required for a group of columns
     * @params {object} args
     * @param {sheet} args.sheet optional sheet if not for the current fiddler sheet
     * @param {string[]} [args.columnNames=*] default is all of them
     * @param {object} [args.options={rowOffset:1,numberOfRows:1,columnOffset:1,numberOfColumns:1}]
     * @param {boolean} [args.includeSheetName = false]
     * @returns {string[]}
     */
    self.getA1s = ({ columnNames, options, sheet, includeSheetName = false }) =>
      self.getRangeList(columnNames, options, sheet)
        .getRanges()
        .map(r => {
          return (includeSheetName ? `'${r.getSheet().getName()}'!` : '') + r.getA1Notation()
        })
  
    /**
     * get the names of columns occurring between start and finish
     * @param {string} [start=the first one] start column name (or the first one)
     * @param {string} [finish=the last one] finish column name (or the last one)
     * @return {[string]} the columns 
     */
    self.getHeadersBetween = function (start, finish) {
      start = start || self.getHeaderByIndex(0);
      finish = finish || self.getHeaderByIndex(-1);
      startIndex = self.getHeaderIndex(start);
      finishIndex = self.getHeaderIndex(finish);
      if (startIndex === -1) throw 'column ' + start + ' not found';
      if (finishIndex === -1) throw 'column ' + finish + ' not found';
      var [s, f] = [startIndex, finishIndex].sort((a, b) => a - b)
      var list = self.getHeaders().slice(s, f + 1);
      return startIndex > finishIndex ? list.reverse() : list;
    }
    /**
     * get the rangelist for a group of columns
     * @param {sheet} sheet 
     * @param {[string]} [columnNames=*] default is all of them
     * @param {object} [options={rowOffset:1,numberOfRows:1,columnOffset:1,numberOfColumns:1}]
     * @return {RangeList}
     */
    self.getRangeList = function (columnNames, options, sheet) {
      options = options || {};
      sheet = sheet || _sheet;
      if (!sheet) throw 'sheet must be provided to getRangeList';
      var range = self.getRange(sheet.getDataRange());
  
      // range will point at start point of data
      var atr = range.getNumRows();
      if (self.hasHeaders() && atr > 1) range = range.offset(1, 0, atr - 1);
  
  
      // default options are the whole datarange for each column
      var defOptions = { rowOffset: 0, numberOfRows: self.getNumRows(), columnOffset: 0, numberOfColumns: 1 };
  
      // set defaults and check all is good
      Object.keys(defOptions).forEach(function (d) {
        if (typeof options[d] === typeof undefined) options[d] = defOptions[d];
      });
      Object.keys(options).forEach(function (d) {
        if (typeof options[d] !== "number" || !defOptions.hasOwnProperty(d) || options[d] < 0) throw 'invalid property/value option ' + d + options[d] + 'to getRangeList ';
      });
  
      ///
  
      // get the columnnames and expand out as required
      var columnRanges = _patchColumnNames(columnNames)
        .map(function (d) {
          return range.offset(options.rowOffset, _headerOb[d] + options.columnOffset, options.numberOfRows || 2, options.numberOfColumns || 2).getA1Notation();
        })
        .map(function (d) {
          // need to treat number of rows (B1:B) or num of columns (c1:1) being 0
          if (options.numberOfRows && options.numberOfColumns) return d;
          if (options.numberOfRows < 1 && options.numberOfColumns < 1) throw 'must be a range of some size for rangeList ' + JSON.stringify(options);
          if (!options.numberOfRows) {
            //B1:b10 becoms b1:b
            return d.replace(/(\w+:)([^\d]+).*/, "$1$2");
          }
          if (!options.numberOfColumns) {
            return d.replace(/(\w+:).+?([\d]+).*/, "$1$2");
          }
        });
  
      // this will cause getRanges not to break if there are no ranges
      return columnRanges.length ?
        sheet.getRangeList(columnRanges) : {
          getRanges: function () {
            return [];
          }
        };
  
    };
    /**
    * @param {[Range]} ranges
    * @return {RangeList}
    */
    self.makeRangeList = function (ranges, options, sheet) {
  
      options = options || {};
      sheet = sheet || _sheet;
      if (!sheet) throw 'sheet must be provided to makeRangeList';
  
      // default options are the whole datarange for each column
      var defOptions = { rowOffset: 0, numberOfRows: self.getNumRows(), columnOffset: 0, numberOfColumns: 1 };
  
      // set defaults and check all is good
      Object.keys(defOptions).forEach(function (d) {
        if (typeof options[d] === typeof undefined) options[d] = defOptions[d];
      });
  
      Object.keys(options).forEach(function (d) {
        if (typeof options[d] !== "number" || !defOptions.hasOwnProperty(d) || options[d] < 0) throw 'invalid property/value option ' + d + options[d] + 'to makeRangeList ';
      });
  
      var r = (ranges || [])
        .map(function (d) {
          return d.getA1Notation();
        })
        .map(function (d) {       // need to treat number of rows (B1:B) or num of columns (c1:1) being 0
          if (options.numberOfRows && options.numberOfColumns) return d;
          if (options.numberOfRows < 1 && options.numberOfColumns < 1) throw 'must be a range of some size for rangeList ' + JSON.stringify(options);
          if (!options.numberOfRows) {
            //B1:b10 becoms b1:b
            return d.replace(/(\w+:)([^\d]+).*/, "$1$2");
          }
          if (!options.numberOfColumns) {
            return d.replace(/(\w+:).+?([\d]+).*/, "$1$2");
          }
  
        });
  
      // this will cause getRanges not to break if there are no ranges
      return r.length ?
        sheet.getRangeList(r) : {
          getRanges: function () {
            return [];
          }
        };
    };
  
  
    /**
    * get the range required to write the values starting at the given range
    * @param {Range} [range=null] the range
    * @return {Range} the range needed
    */
    self.getRange = function (range) {
      if (!range && !_sheet) throw 'must set a default sheet or specify a range';
      range = range || _sheet.getDataRange();
      // simulate a single cell range for a blank sheet
      return self.getNumColumns() ? range.offset(0, 0, self.getNumRows() + (self.hasHeaders() ? 1 : 0), self.getNumColumns()) : range.offset(0, 0, 1, 1);
    }
    /**
    * move a column before
    * @param {string} header the column name 
    * @param {string} [insertBefore] name of the header to insert befire, undefined for end 
    * @return {Fiddler} self
    */
    self.moveColumn = function (header, insertBefore) {
  
      // the headers
      var headers = self.getHeaders();
      var headerPosition = headers.indexOf(header);
  
      if (!header || headerPosition === -1) {
        throw new Error('must supply an existing header of column to move');
      }
  
      // remove from its existing place
      headers.splice(headerPosition, 1);
  
      // the output position
      var columnOffset = insertBefore ? headers.indexOf(insertBefore) : self.getNumColumns();
      // check that the thing is ok to insert before
      if (columnOffset < 0 || columnOffset > self.getNumColumns()) {
        throw new Error(header + ' doesnt exist to insert before');
      }
  
      // insert the column at the requested place
      headers.splice(columnOffset, 0, header);
  
      // adjust the positions
      _headerOb = headers.reduce(function (p, c) {
        p[c] = Object.keys(p).length;
        return p;
      }, {});
  
      return self;
    };
  
    /**
    * insert a column before
    * @param {string} [header] the column name - undefined if no headers
    * @param {string} [insertBefore] name of the header to insert befire, undefined for end 
    * @return {number} the offset if the column that was inserted
    */
    function _insertColumn(header, insertBefore) {
  
      // the headers
      var headers = self.getHeaders();
  
      // the position
      var columnOffset = insertBefore ? headers.indexOf(insertBefore) : self.getNumColumns();
  
      // check ok for header
      if (!self.hasHeaders() && header) {
        throw new Error('this fiddler has no headers - you cant insert a column with a header');
      }
  
      // make one up
      if (!self.hasHeaders()) {
        header = columnLabelMaker_(headers.length + 1);
      }
  
      if (!header) {
        throw new Error('must supply a header for an inserted column');
      }
      if (headers.indexOf(header) !== -1) {
        throw new Error('you cant insert a duplicate header ' + header);
      }
  
      // check that the thing is ok to insert before
      if (columnOffset < 0 || columnOffset > self.getNumColumns()) {
        throw new Error(insertBefore + ' doesnt exist to insert before');
      }
  
      // insert the column at the requested place
      headers.splice(columnOffset, 0, header);
  
      // adjust the positions
      _headerOb = headers.reduce(function (p, c) {
        p[c] = Object.keys(p).length;
        return p;
      }, {});
  
      // fill in the blanks in the data
      _dataOb.forEach(function (d) {
        d[header] = '';
      });
  
      // clear any formatting in that newly inserted column
      self.setColumnFormat(null, header);
      return columnOffset;
    }
    /**
    * insert a column before
    * @param {string} [header] the column name - undefined if no headers
    * @param {string} [insertBefore] name of the header to insert befire, undefined for end 
    * @return {Fiddler} self
    */
    self.insertColumn = function (header, insertBefore) {
  
      // the headers
      _insertColumn(header, insertBefore);
      return self;
  
    }
  
    /**
    * insert a row before
    * @param {number} [rowOffset] starting at 0, undefined for end 
    * @param {number} [numberofRows=1] to add
    * @param {[object]} [data] should be equal to number of Rows
    * @return {Fiddler} self
    */
    self.insertRows = function (rowOffset, numberOfRows, data) {
      if (typeof numberOfRows === typeof undefined) {
        numberOfRows = 1;
      }
  
      // if not defined insert at end
      if (typeof rowOffset === typeof undefined) {
        rowOffset = self.getNumRows();
      }
  
      if (rowOffset < 0 || rowOffset > self.getNumRows()) {
        throw new Error(rowOffset + ' is inalid row to insert before');
      }
  
      for (var i = 0, skeleton = [], apply = [rowOffset, 0]; i < numberOfRows; i++) {
        skeleton.push(makeEmptyObject_());
      }
  
      // maybe we have some data
      if (data) {
        data = _forceArray(data)
  
        if (data.length !== skeleton.length) {
          throw new Error(
            'number of data items ' + data.length +
            ' should equal number of rows ' + skeleton.length + ' to insert ');
        }
        // now merge with skeleton
        skeleton.forEach(function (e, i) {
  
          // override default values
          Object.keys(e).forEach(function (key) {
            if (data[i].hasOwnProperty(key)) {
              e[key] = data[i][key];
            }
          });
  
          // check that no rubbish was specified
          if (Object.keys(data[i]).some(function (d) {
            return !e.hasOwnProperty(d);
          })) {
            throw new Error('unknown columns in row data to insert:' + JSON.stringify(Object.keys(data[i])));
          }
  
        });
      }
      // insert the requested number of rows at the requested place
      _dataOb.splice.apply(_dataOb, apply.concat(skeleton));
  
      return self;
    }
  
    function makeEmptyObject_() {
      return self.getHeaders().reduce(function (p, c) {
        p[c] = ''; // in spreadsheet work empty === null string
        return p;
      }, {});
    }
  
    const _cwise = (func) => {
      // first transpose the data
      return Object.keys(_headerOb).reduce(function (tob, key) {
        tob[key] = func(key);
        return tob;
      }, {});
    }
    /**
    * create a column slice of values
    * @return {object} the column slice
    */
    const _columnWise = () => _cwise(self.getColumnValues)
    const _columnWiseFormula = () => _cwise(self.getColumnFormulaValues)
  
    /**
    * will create a new dataob with columns dropped that are not in newKeys
    * @param {string[]} newKeys the new headerob keys
    * @return {object[]} the new dataob
    */
    function dropColumns_(newKeys) {
  
      return _dataOb.map(function (row) {
        return Object.keys(row).filter(function (key) {
          return newKeys.indexOf(key) !== -1;
        })
          .reduce(function (p, c) {
            p[c] = row[c];
            return p;
          }, {});
      });
  
    };
  
    /**
    * return the number of rows
    * @return {number} the number of rows of data
    */
    self.getNumRows = function () {
      return _dataOb.length;
    };
  
    /**
    * return the number of columns
    * @return {number} the number of columns of data
    */
    self.getNumColumns = function () {
      return Object.keys(_headerOb).length;
    };
  
    /**
    * check that a variable is a function and throw if not
    * @param {function} [func] optional function to check
    * @return {function} the func
    */
    function checkAFunc(func) {
      if (func && typeof func !== 'function') {
        throw new Error('argument should be a function');
      }
      return func;
    }
  
    /**
    * make column item
    * @param {object} ob the column object
    * @param {string} key the key as returned from a .filter
    * @param {number} idx the index as returned from a .filter
    * @return {object} a columnwise item
    */
    function makeColItem_(ob, key, idx) {
      return {
        values: ob[key],
        columnOffset: idx,
        name: key
      };
    };
  
    /**
    * make row item
    * @param {object} row the row object as returned from a .filter
    * @param {number} idx the index as returned from a .filter
    * @return {object} a rowwise item
    */
    function makeRowItem_(row, idx) {
      return {
        values: Object.keys(_headerOb).map(function (k) {
          return row[k];
        }),
        rowOffset: idx,
        data: row,
        fiddler: self
      };
    };
  
    /**
    * return the headers
    * @return {string[]} the headers
    */
    self.getHeaders = function () {
      return Object.keys(_headerOb);
    };
  
    /**
    * return the data
    * @return {object[]} as rowwise kv pairs 
    */
    self.getData = function () {
      return _dataOb;
    };
  
    /**
    * return the formulas
    * @return {object[]} as rowwise kv pairs 
    */
    self.getFormulaData = function () {
      return _formulaOb;
    };
    /**
    * replace the current data in the fiddle
    * will also update the headerOb
    * @param {object[]} dataOb the new dataOb
    * @param {boolean} [preserveOrder] whether to attempt to preserve existing order of keys
    * @param {boolean} [resetFingerprints] whether to reset the fingerprint
    * @return {Fiddle} self
    */
    self.setData = function (dataOb, preserveOrder, resetFingerprints = true) {
  
      // need to calculate new headers
      const proposedHeader = (dataOb || []).reduce(function (hob, row) {
        Object.keys(row).forEach(function (key) {
          if (!Object.prototype.hasOwnProperty.call(hob, key)) {
            hob[key] = Object.keys(hob).length;
          }
        });
        return hob;
      }, {});
  
      // if the existing header contains the same keys as the original, 
      // then preserve the original order on request
      const ok = Object.keys(proposedHeader);
      const hk = _headerOb && Object.keys(_headerOb);
      if (!preserveOrder || !hk || hk.length !== ok.length || ok.some(function (t) { return hk.indexOf(t) === -1; })) {
        _headerOb = proposedHeader
      }
      // set the new data ob
      _dataOb = dataOb;
      _empty = false;
  
      // when the dataob is reset, we need to reset the fingerprints to be able to track dirtiness
      if (resetFingerprints) _resetFingerprints()
  
      return self;
    };
  
    /**
    * initialize the header ob and data on from a new values array
    * @return {Fiddle} self
    */
    self.init = function () {
      // how to handle multi level dataa
      self.setFlattener(_defaultFlat)
  
      if (_values) {
        _headerOb = make_headerOb();
        _dataOb = _makeDataOb();
        _empty = false
      } else {
        _headerOb = null;
        _dataOb = [];
        _empty = true;
      }
      return self;
    };
  
    self.isEmpty = () => _empty
  
    /**
    * @return {boolean} whether a fiddle has headers
    */
    self.hasHeaders = function () {
      return _hasHeaders;
    };
  
    /**
    * set whether a fiddle has headers
    * @param {boolean} headers whether it has
    * @return {Fiddler} self
    */
    self.setHasHeaders = function (headers) {
      _hasHeaders = !!headers
      return self.init();
    };
  
    /**
    * set a new values array
    * will also init a new dataob and header
    * @param {[[]]} values as returned from a sheet
    * @return {Fiddler} self
    */
    self.setValues = function (values) {
      _values = values
      self.init()
      _resetFingerprints()
      return self
    };
  
    /**
    * gets the original values stored with this fiddler
    * @return {[[]]} value as needed by setvalues
    */
    self.getValues = function () {
      return _values;
    };
  
    /**
    * gets the updated values derived from this fiddlers dataob
    * @return {[[]]} value as needed by setvalues
    */
    self.createValues = function () {
      return make_values();
    };
  
    /**
     * delete all the rows
     */
    self.removeAllRows = function () {
      _dataOb = [];
      return self;
    };
    /**
    * make a map with column labels to index
    * if there are no headers it will use column label as property key
    * @return {object} a header ob.
    */
    function make_headerOb() {
  
      // headers come from first row normally
      var firstRow = _values && _values.length ? _values[0] : [];
      // problem is that values in sheets will always be [[""]] for an empty sheet
      // so to avoid interpresting that as a single column with no header
      if (firstRow.length === 1 && firstRow[0] === "") firstRow = [];
  
      // create headers from firstrow (or generate if no headers)
      var rob = (self.hasHeaders() ?
        firstRow : firstRow.map(function (d, i) {
          return columnLabelMaker_(i + 1);
        }))
        .reduce(function (p, c) {
  
          var key = c.toString();
          if (_renameBlanks && !key) {
            // intercept blank name and use column a notation for it
            key = columnLabelMaker_(Object.keys(p).length + 1 + _blankOffset);
  
          }
          if (p.hasOwnProperty(key)) {
            if (!_renameDups) {
              throw 'duplicate column header ' + key;
            } else {
              // generate a unique name
              var nd = 1;
              while (p.hasOwnProperty(key + nd)) {
                nd++;
              }
              key = key + nd;
            }
          }
  
          p[key] = Object.keys(p).length;
          return p;
        }, {});
  
      return rob;
  
    }
  
    /**
    * make a map of data and formulas
    * @return {object} a data ob.
    */
    function _makeOb(values) {
  
      // get rid of the headers if there are any
      var vals = self.hasHeaders() ? values.slice(1) : values;
  
      // make an array of kv pairs
      return _headerOb ?
        ((vals || []).map(function (row) {
          return Object.keys(_headerOb).reduce(function (p, c) {
            p[c] = row[_headerOb[c]];
            return p;
          }, {})
        })) : null;
    }
  
    /**
    * make a map of data and formulas
    * @return {object} a data ob.
    */
    const _makeDataOb = () => _makeOb(_values)
    const _makeFormulaOb = () => _makeOb(_formulas)
  
  
  
    /**
    * make values from the dataOb
    * @return {object} a data ob.
    */
    function make_values() {
  
      // add the headers if there are any
      var vals = [self.hasHeaders() ? Object.keys(_headerOb) : []];
  
      // put the kv pairs back to values
      return _dataOb.reduce(function (p, row) {
        Array.prototype.push.apply(p, [vals[0].map(function (d) {
          return typeof row[d] === typeof undefined || row[d] === null ? "" : row[d];
        })]);
        return p;
      }, vals);
  
    }
  
    /**
    * create a column label for sheet address, starting at 1 = A, 27 = AA etc..
    * @param {number} columnNumber the column 
    * @param {string} [s] the recursive result
    * @return {string} the address label 
    */
    function columnLabelMaker_(columnNumber, s) {
      s = String.fromCharCode(((columnNumber - 1) % 26) + 'A'.charCodeAt(0)) + (s || '');
      return columnNumber > 26 ? columnLabelMaker_(Math.floor((columnNumber - 1) / 26), s) : s;
    }
  
    // constructor will populate if a sheet is given
    if (sheet) {
      self.populate(sheet);
    }
  
    else if (typeof sheet !== typeof undefined) {
      throw 'sheet was passed in constructor but could not be opened';
    }
  
  
    /**
     * @typdef JoinHand
     * @property {[*]} data the array of data to join
     * @property {function} [makeKey] function to take a row and make a key
     * @property {function} [makeColumnName] function to rename a column name - default is to retain (dups would be dropped)
     * 
     */
  
    /**
     * default function to compare keys
     * @param {*} a the first key
     * @param {*} b the second key
     * @returns {boolean} whether they should be treated as equal
     */
    const _defaultJoinCompareKeys = ((a, b) => a === b)
  
    /**
     * default function to make key 
     * @param {object} row the input row
     * @returns {*} the made key
     */
    const _defaultJoinMakeKey = (row) => {
      if (typeof row.id === typeof undefined) throw new Error('row.id was undefined using default _defaultJoinMakeKey')
      return row.id
    }
  
  
    const _joinTypes = ['inner', 'full', 'left', 'right']
  
    /**
     * merge 2 sets of data
     * @param {object} join
     * @param {JoinHand} join.left definition 
     * @param {JoinHand} join.right definition 
     * @param {function} [join.compareKeys] function to compare keys from makekey
     * @param {string} [join.joinType='inner'] 'inner' | 'outer' | 'left' | 'right'
     * @returns {object[]} a new set of data that can be used with getData() to create a new fiddler 
     */
  
    self.join = ({
      left,
      right,
      compareKeys = _defaultJoinCompareKeys,
      joinType = 'inner'
    }) => {
      const makeKey = (a, aRow) => (a.makeKey || _defaultJoinMakeKey)(aRow)
      const compare = (a, b, aRow, bRow) => compareKeys(makeKey(a, aRow), makeKey(b, bRow))
      const renamer = (a, aRow) => a.makeColumnName ? Object.keys(aRow).reduce((p, c) => {
        p[a.makeColumnName(c)] = aRow[c]
        return p
      }, {}) : aRow
  
      // TODO - rename column name clashes
      const pusher = (a, b, outer = false, reverse = false) => {
        return a.data.reduce((p, aRow) => {
          const matches = b.data.filter(bRow => reverse ? compare(b, a, bRow, aRow) : compare(a, b, aRow, bRow))
          if (matches.length) {
            matches.forEach(match => p.push({
              ...renamer(a, aRow),
              ...renamer(b, match)
            }))
          } else if (outer) {
            p.push({
              ...renamer(a, aRow)
            })
          }
          return p;
        }, [])
      }
  
  
      // todo - rename propertyname clash
      if (joinType === 'inner') {
        return pusher(left, right)
      }
  
      else if (joinType === 'left') {
        return pusher(left, right, true)
      }
  
      else if (joinType === 'right') {
        return pusher(right, left, true, true)
      }
  
      else if (joinType === 'full') {
        // first to a left join
        const p = pusher(left, right, true)
        // now we need to mop up the right who didn't make it
        return p.concat(right.data
          .filter(rightRow => !left.data.some(leftRow => compare(left, right, leftRow, rightRow)))
          .map(rightRow => ({
            ...renamer(right, rightRow)
          })))
      }
  
      else {
        throw new Error(`${joinType} should be one of ${_joinTypes.join(",")}`)
      }
  
    }
  
  };
  
//--end:Fiddler

  return {
    isDateObject,
    isEmail,
    getRandomSheetStrings,
    generateUniqueString,
    isUndefined,
    applyDefault,
    arbitraryString,
    randBetween,
    checksum,
    isObject,
    clone,
    rateLimitExpBackoff,
    errorStack,
    arrayAppend,
    escapeQuotes,
    getObjectsFromValues,
    arrayRank,
    showError,
    whereAmI,
    whatAmI,
    extend,
    replaceAll,
    makeSha1Hex,
    byteToHexString,
    padLeading,
    b64ToString,
    validateArgs,
    columnLabelMaker,
    traverseTree,
    timeFunction,
    unPadB64,
    encodeB64,
    TRYAGAIN,
    Utils,
    DriveUtils,
    SheetUtils,
    FetchUtils,
    Include,
    Squeeze,
    UserRegistration,
    DriveProper,
    RemoveAccents,
    Stopwords,
    Stemmer,
    Stubber,
    Rough,
    Images,
    Flattener,
    CrusherPluginDriveService,
    CrusherPluginCacheService,
    CrusherPluginPropertyService,
    Fetcheroo,
    Tester,
    Unnest,
    Maths,
    Fiddler
  }
}
//--end project:cUseful