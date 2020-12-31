const _checkFunction = (func, fail = true) => {
  const t = typeof func;
  if (t === "function") return true;
  if (fail) throw new Error(`Expected function but got ${t}`);
  return false;
};

class RottlerEntry {
  constructor() {
    const now = new Date().getTime();
    this.startedAt = now;
    this.lastUsedAt = 0;
    this.uses = [];
  }
}

// a rate limiter tester
class Rottler {
  /**
   * A convenience function for conversion to ms from various units
   * @param {string} [name='seconds'] the name of the period units - like hours, minutes etc
   * @param {number} [value=1] how many
   * @return number of ms.
   */
  static ms(name = "seconds", value = 1) {
    const seconds = 1000;
    const minutes = seconds * 60;
    const hours = minutes * 60;
    const days = hours * 24;
    const weeks = days * 7;
    return (
      {
        // convert into ms from these
        seconds,
        minutes,
        hours,
        days,
        weeks,
        // convert from ms to these
        msSeconds: 1 / seconds,
        msMinutes: 1 / minutes,
        msHours: 1 / hours,
        msDays: 1 / days,
        msWeeks: 1 / weeks,
      }[name] * value
    );
  }

  /**
   *
   * @param {object} options
   * @param {number} [options.period = 60000] measure period in ms
   * @param {number} [options.rate = 10] how many calls allowed in that period
   * @param {number} [options.delay = 5] delay in ms between each call
   * @param {function} [options.timeout] the setTimeout function (usuall setTimeout is the default)
   * @param {boolean} [options.throwError = true] whether to throw an error on rate limit problem
   * @return {Rottler}
   */
  constructor({
    period = 60 * 1000,
    rate = 10,
    delay = 5,
    timeout,
    throwError = true,
  } = {}) {
    this.period = period;
    this.rate = rate;
    this.delay = delay;
    this._entry = new RottlerEntry();
    this.throwError = throwError;
    this._events = {
      rate: {
        name: "rate",
        listener: null,
      },
      delay: {
        name: "delay",
        listener: null,
      },
    };
    // this is needed because apps script doesnt have a setTimeout
    // so a custom timeout can be passed over
    this.setTimeout = timeout || setTimeout;
    _checkFunction(this.setTimeout);

    /**
     *
     * @param {number} ms number of ms to wait before calling
     * @return {Promise} resolves to ms
     */
    this.waiter = (ms) =>
      new Promise((resolve) => this.setTimeout(() => resolve(ms), ms));
  }

  /**
   * gets the entry
   * @return {RottlerEntry}
   */
  get entry() {
    return this._entry;
  }

  /**
   * clean any uses that have expired from this entry
   * @return {RottlerEntry} the cleaned entry
   */
  _cleanEntry() {
    // they'll be sorted in ascending order
    const entry = this.entry;
    const expired = this._now() - Math.max(this.period, this.delay);
    entry.uses = entry.uses.filter((f) => f > expired);
    return entry;
  }

  /**
   * @return {number} the time now
   */
  _now() {
    return new Date().getTime();
  }

  /**
   * how many ms since last attempt
   * @return {number} ms since last time
   */
  sinceLast() {
    return this.entry.lastUsedAt
      ? this._now() - this.entry.lastUsedAt
      : Infinity;
  }

  /**
   * is it too soon to do another?
   * @return {boolean} whether its too soon
   */
  tooSoon() {
    return this.sinceLast() < this.delay;
  }

  /**
   * how many have been done in period
   * @return {number} number in period
   */
  size() {
    return this.entry.uses.length;
  }

  /**
   * how can we do before end of period
   * @return {number} number available in period
   */
  available() {
    return this.rate - this.size();
  }

  /**
   * how long to wait before we can go again
   * @return {number} number available in period
   */
  waitTime() {
    // how long to wait till next rate becomes available?
    const passed = this.sinceLast();
    // passed can never be infinity if avaiable > 0
    const rateWait = this.available() > 0 ?  0 : this.period - passed;
    // how long to wait before delay is expired ?
    return this.tooSoon() ? Math.max(this.delay - passed, rateWait) : rateWait;
  }

  // clear trackers
  reset() {
    this._entry = new RottlerEntry();
    return this.entry;
  }

  /**
   * this can be used to resolve once enough time has passed
   * @return {Promise} will be resolved when it's safe to go
   */
  rottle() {
    return this.waiter(this.waitTime());
  }

  /**
   * like use but promisified
   */
  useAsync() { 
    return new Promise((resolve, reject) => { 
      try {
        resolve(this.use())
      }
      catch (err) { 
        reject (err)
      }
    })
  }
  
  /**
   * test for quota left and update it if there is some
   * @return {RottlerEntry} the  entry if there is quota
   */
  use() {
    const entry = this._cleanEntry();
    const now = this._now();

    // if there's enough quota, then update it
    if (this.available() < 1) {
      if (this._events.rate.listener) {
        this._events.rate.listener();
      }
      if (this.throwError) {
        throw new Error(
          `Rate limit error - attempt to use  more than ${this.rate} times in ${this.period}ms`
        );
      }
    } else if (this.waitTime() > 0) {
      if (this._events.delay.listener) {
        this._events.delay.listener();
      }
      if (this.throwError) {
        throw new Error(
          `Rate limit delay error - attempt to use ${this.sinceLast()}ms after last - min delay is ${
            this.delay
          }ms`
        );
      }
    } else {
      entry.uses.push(now);
      entry.lastUsedAt = now;
    }
    return entry;
  }

  /**
   * set listeners
   */
  on(name, func) {
    if (!this._events[name]) {
      throw new Error(`event ${name} doesnt exist`);
    }
    _checkFunction(func);
    this._events[name].listener = () => func();
  }

  off(name) {
    if (!this._events[name]) {
      throw new Error(`event ${name} doesnt exist`);
    }
    this._events[name].listener = null;
  }
}


