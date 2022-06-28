const Utils = (() => {

  /**
   * test a string is an email address
   * from http://www.regular-expressions.info/email.html
   * @param {string} emailAddress the address to be tested
   * @return {boolean} whether it is and email address
   */
  const isEmail = (emailAddress) => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailAddress);
  }

  /** 
   * isObject
   * check if an item is an object
   * @param {object} obj an item to be tested
   * @return {boolean} whether its an object
   */
  const isObject = (obj) => {
    return obj === Object(obj);
  }

  /** 
   * check if item is undefined
   * @param {*} item the item to check
   * @return {boolean} whether it is undefined
   */
  const isUndefined = (item) => {
    return typeof item === typeof undefined;
  }

  const applyDefault = (item, defaultValue) => {
    return isUndefined(item) ? defaultValue : item;
  }

  /** 
   * clone
   * clone an object by parsing/stringifyig
   * @param {object} o object to be cloned
   * @return {object} the clone
   */
  const clone = (o) => {
    return o ? JSON.parse(JSON.stringify(o)) : null;
  }

  /**
  * b64 and unpad an item suitable for jwt consumptions
  * @param {string} itemString the item to be encoded
  * @return {string}  the encoded
  */
  const encodeB64 = (itemString) => {
    return unPadB64(Utilities.base64EncodeWebSafe(itemString));
  }

  /**
  * remove padding from base 64 as per JWT spec
  * @param {string} b64 the encoded string
  * @return {string} padding removed
  */
  const unPadB64 = (b64) => {
    return b64 ? b64.split("=")[0] : b64;
  }

  /** 
  * generateUniqueString
  * get a unique string
  * @param {number} optAbcLength the length of the alphabetic prefix
  * @return {string} a unique string
  */
  const generateUniqueString = (optAbcLength) => {
    var abcLength = isUndefined(optAbcLength) ? 3 : optAbcLength;
    return (new Date().getTime()).toString(36) + arbitraryString(abcLength);
  };

  /** 
  * get an arbitrary alpha string
  * @param {number} length of the string to generate
  * @return {string} an alpha string
  */
  const arbitraryString = (length) => {
    var s = '';
    for (var i = 0; i < length; i++) {
      s += String.fromCharCode(randBetween(97, 122));
    }
    return s;
  };
  /** 
    * randBetween
    * get an random number between x and y
    * @param {number} min the lower bound
    * @param {number} max the upper bound
    * @return {number} the random number
  */
  const randBetween =  (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  //exports
  return {
    randBetween,
    generateUniqueString,
    arbitraryString,
    unPadB64,
    encodeB64,
    clone,
    isEmail,
    isObject,
    applyDefault,
    isUndefined
  }
})()
