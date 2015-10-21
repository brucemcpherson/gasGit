/**
 * @fileOverview This is to provide named lock capabilities for GAS, using the cache service
 * @author <a href="mailto:bruce@mcpher.com">Bruce McPherson</a>
 */
function getLibraryInfo () {

  return { 
    info: {
      name:'cNamedLock',
      version:'2.2.0',
      key:'Mpv7vUR0126U53sfSMXsAPai_d-phDA33',
    },
    dependencies:[cCacheHandler.getLibraryInfo()]
  }; 
}
/**
 * @name NamedLock
 * @constructor
 * @param {number} [optTimeout=120000] timeout of lock in milliseconds
 * @param {number} [optWaitTime=20000] time to wait for lock before giving up in milliseconds
 * @param {boolean} [optUseCache=true] whether to use cache (false will use properties) - now redunandt - always uses properties
 * @param {number} [optMinSleepTime=250] minimum time to sleep for between attempts
 * @return {NamedLock} self
 */ 
function NamedLock (optTimeOut,optWaitTime,optUseCache,optMinSleepTime) {
  
  var self = this;

  var SETTINGS = {
    capability:'nl',
    timeout: 120000,
    waitTime: 19000,
    useCache: true,
    minSleepTime: 618,
    who:'anon'
  }
  // default key

  var key_ = SETTINGS.capability  + 'lock';
  // keep the lock in cache for this number of seconds
  var timeout_ = optTimeOut || SETTINGS.timeout;
  var waitTime_ = optWaitTime || SETTINGS.waitTime;
  var cacheTime_ = Math.ceil(timeout_ /1000);
  var minSleepTime_ = optMinSleepTime || SETTINGS.minSleepTime;
  var id_ = generateUniqueString();
  var item_;
  var sameInstanceLocked_ = false;
  
  // get a handler
  var cache_ = new cCacheHandler.CacheHandler(cacheTime_,SETTINGS.capability,false,false,CacheService.getScriptCache());
  var cacheObject_ = cache_.getCacheObject();
  
  /**
   * whether to consider the same instance as being locked
   * @param {boolean} sameInstanceLocked if false, then the same instance is not locked out.
   * @return {cNamedLock} self
   */
  self.setSameInstanceLocked = function(sameInstanceLocked) {
    sameInstanceLocked_ = sameInstanceLocked;
    return self;
  };
  
  /**
   * delete all expired cache locks
   */
  self.cleanUp = function () {
    cache_.propertyHousekeeping();
  };
  
  /**
   * set a key for this lock
   * @param {...*} var_args any number of args/serializable types that can be combined to make a key
   * @return {NamedLock} self
   */
   self.setKey = function () {
     key_ = cache_.generateCacheKey(null, Array.prototype.slice.call(arguments));
     return self;
   };

  /**
   * get the key for this lock
   * @return {string} the key
   */
   self.getKey = function () {
     return key_;
   };
   
  /**
   * see if there is a current lock
   * @return {boolean} is there a lock?
   */
   self.isLocked = function () {
     var owner = getLockOwner_ (key_); 
     // if the requestor is the same instance as the holder, assume it not to be locked.
     return owner ? (!sameInstanceLocked_ && owner.id === id_ ? false : true) : false;
   };

   /**
    * take a lock out
    * @param {string} [optWho] optionally identify who/what took the lock out 
    * @return {NamedLock|null} the lock or failed
    */
    self.lock = function(optWho) {
      
      var who = optWho || 'anonymous';
      var startedTrying = new Date().getTime();
      var giveUp = new Date(startedTrying + timeout_);
      var roll;
      
      // try to get a cache lock
      while (Date.now() <= giveUp && !roll) {
      
        // wrap the whole thing up in a lockservice lock
        roll = gasLockProtect_ (who, function (g) {
          
          try {
            // see if someone has it
            var owner = getLockOwner_ (key_);
            
            if (!owner || (!sameInstanceLocked_ && owner.id === id_)) {
              // its free
             
              var now = new Date().getTime();
              setItem_ ( {id:id_, key:key_, when:now, who:who, expires:now+timeout_, waitedFor: now - startedTrying} );
              return self;
            }
            else {
            //Logger.log(id_ + JSON.stringify(owner) + ' has it');
            }
          }
          catch(e) {
            return null;
          }
        });
        
        // we didnt get one, so sleep for a bit.
        if (!roll) {
          var waitedFor = Math.floor(  minSleepTime_ + Math.random()*minSleepTime_ *.2 );
          Utilities.sleep(waitedFor);
        }
      }
      return roll;
    };

    function gasLockProtect_ (who, func) {
      var r, gasLock = LockService.getPublicLock();
      
      try {
        gasLock.waitLock (waitTime_);
      }
      catch (err) {
        throw 'failed on waitlock';
      }
      
      if (gasLock.hasLock()) {
        
        // do the work
        try {
          
          r = func(gasLock);
        }
        catch (err) {
          throw (err);
        }
        finally {
          gasLockRelease_(gasLock,who);
        }
      }
      else {
        throw 'unable to get a gasLock';
      }
      return r;
    }
    
      
    function gasLockRelease_(gasLock,who) {
      // drop the lock
      
      try {
        if (gasLock) {
          gasLock.releaseLock();
        }
        else {
          throw 'tried to release invalid gas lock for ' + who + ' ' + JSON.stringify(e);
        }
      }
      catch (e) {
        throw 'gas lock not released for ' + who + ' ' + JSON.stringify(e);
      }
    }  
    
    /**------------------
     * write the item to cache
     * @param {object} the item
     */
     
    function setItem_(item) {
      var now = Date.now();
      cacheObject_.put (key_,JSON.stringify(item));
      item_ = item;
      return item_;
    }
    
    /**--------------
     * return the lock object of the current owner or null if no valid lock
     * @param {string} key the key
     */
     
    function getLockOwner_ (key) {
      var sob = cacheObject_.get(key);
      if(sob) {
        var ob = JSON.parse(sob);
      }
      return ob && ob.expires > Date.now()  ? ob  : null;
    }
    
    /**----------------
     * delete the current lock
     */
    function removeItem_() {
      cacheObject_.remove(key_);
    }
    
   /**-----------------
    * get this lock info
    * @return {Object|null} lockinfo
    */
    self.getInfo = function() {
      return item_;
    };
    
   /**
    * release a lock
    * @return {NamedLock} self
    */
    self.unlock = function(optWho) {
      var who = optWho || SETTINGS.who;
      return gasLockProtect_ (who, function (g) {
          var n = self.getInfo ();
          if (!n) {
            // if no info, then there is no lock .. pass silently

          }
          else {
            if (n.id !== id_) {
              throw (id_ + ':caught trying to unlock someone elses lock '  + JSON.stringify(n) + ' decoded as ' + Utilities.base64Decode(n.key) + ' expired?' + n.expires > Date.now() );
            }
            removeItem_();
          }
          return self;
        });
      };
    
    /** 
     * protect a piece of code
     * @param {string} who is locking
     * @param {function} func what to run
     * @return {object} wresult of function and whether it ran
     */
    self.protect = function (who, func) {

      var lock = self.lock(who);
      var result = {locked:lock?true:false,result:null};

      if (lock) {
        try {
          
          result.result = func(lock);
          release();
          
        }
        catch(err) {
          release();
          throw JSON.stringify(err);
        }
      }
      else {
        throw (id_+':trying to grab cache lock for ' + who + ' :couldnt get a lock after trying for ' + timeout_);
      }
      
      function release () {

        try {
          if (lock) {
            lock.unlock();
          }
        }
        catch (e) {
          throw id_+':lock not released for ' + who + ' ' + JSON.stringify(e)  + (item_ ? JSON.stringify(item_) : 'no item')  + ' at ' + new Date().getTime();
        }

      }
      return result;
    };
  
    
  /** 
   * utilities - create a string of random characters
   * @param {number} length
   * @return {string} the random string
   */
  function arbitraryString (length) {
    var s = '';
    for (var i = 0; i < length; i++) {
      s += String.fromCharCode(randBetween ( 97,122));
    }
    return s;
  }
  
  /** 
   * utilities - create a random integer between 2 points
   * @param {number} min the minimum number
   * @param {number} max the maximum number  
   * @return {number} the random number
   */
  function randBetween (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  /** 
   * utilities - generate a unique string
   * @return {string} the unique string
   */
  function generateUniqueString () {
    return arbitraryString(2) + new Date().getTime().toString(36);
  };
  
   return self;
}
