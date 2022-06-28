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
   * @param {number} [options.delay = 10] minimum delay in ms between each call
   * @param {function} [options.timeout] the setTimeout function (usuall setTimeout is the default)
   * @param {boolean} [options.throwError = true] whether to throw an error on rate limit problem
   * @param {boolean} [options.synch = true] synch or asynch rottle
   * @param {function} [options.sleep] a synch sleeping function (apps script - Utilities.sleep)
   * @param {boolean} [options.smooth = false] whether to smooth delay over a rate
   * @param {number} [options.smoothMinimum = 0.25] threshold for smoothing to kick in
   * @return {Rottler}
   */
  constructor({
    period = 60 * 1000,
    rate = 10,
    delay = 10,
    timeout,
    throwError = true,
    synch = true,
    sleep = Utilities.sleep,
    smooth = false,
    smoothMinimum = 0.25,
  } = {}) {
    this.period = period;
    this.rate = rate;
    this.delay = delay;
    this._entry = new RottlerEntry();
    this.throwError = throwError;
    this.synch = synch;
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

    // so a custom timeout can be passed over

    // this is a sleep function - required if synch is true
    this.sleep = sleep;
    if (this.synch && !sleep) {
      throw new Error("synch option needs a synch sleep function");
    }
 
    if (!this.synch) {
      this.setTimeout = timeout;
      if (!timeout && typeof setTimeout !== "undefined")
        this.setTimeout = setTimeout;
      _checkFunction(this.setTimeout);
    }
    // this is the threshold over which smoothing starts
    this.smoothMinimum = smoothMinimum;
    this.smooth = smooth;
    if (this.smoothMinimum < 0 || this.smoothMinimum > 1) {
      throw new Error("smoothMinimum should be a between 0 and 1");
    }
  }

  /**
   * @param {number} ms number of ms to wait before calling
   * @return {Promise} resolves to ms
   */
  waiter(ms) {
    return new Promise((resolve) => this.setTimeout(() => resolve(ms), ms));
  }

  /**
   * throw a sync/async error
   * @param {object} options
   * @param {string} options.msg message
   * @param {boolean} options.throwAsync whether to reject or throw
   */
  throw({ msg, throwAsync }) {
    const e = new Error(msg);
    if (throwAsync) {
      return Promise.reject(e);
    } else {
      throw e;
    }
    throw e;
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
   *
   * @param {object} options
   * @param {*[]} options.rows an array of data to iterate through
   * @param {function} [options.transformer] an optional function to apply to each row
   * @return {object} an iterator
   */
  rowIterator({ rows, transformer }) {
    const self = this;
    const getItem = ({ waitTime, async, index }) => {
      const value = {
        index,
        row: rows[index],
        rows,
        waitTime,
        transformation: null,
        async,
      };

      const item = {
        value,
        done: false,
      };
      // an optional transformation
      if (transformer) {
        value.transformation = transformer(value);
      }
      return item;
    };

    return {
      // will be selected in for await of..
      [Symbol.asyncIterator]() {
        return {
          rowNumber: 0,
          rows,
          hasNext() {
            return this.rowNumber < this.rows.length;
          },
          next() {
            if (!this.hasNext()) {
              return Promise.resolve({
                done: true,
              });
            } else {
              const waitTime = self.waitTime();
              return self.rottle().then(() => {
                return getItem({
                  waitTime,
                  index: this.rowNumber++,
                  async: true,
                });
              });
            }
          },
        };
      },
      // will be selected in for of...
      [Symbol.iterator]() {
        return {
          rowNumber: 0,
          rows,
          hasNext() {
            return this.rowNumber < this.rows.length;
          },
          next() {
            if (!this.hasNext()) {
              return {
                done: true,
              };
            } else {
              const waitTime = self.waitTime();
              // this#ll be a synchronous wait
              self.rottle();
              return getItem({
                waitTime,
                index: this.rowNumber++,
                async: false,
              });
            }
          },
        };
      },
    };
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
   * how many ms since first in scope attempt
   * @return {number} ms since last time
   */
  sinceFirst() {
    // first used will be have a first
    return this.entry.lastUsedAt ? this._now() - this.entry.uses[0] : Infinity;
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

    // if there hasnt been anything we're done - there's no need to wait
    if (!this.entry.lastUsedAt) return 0;

    // how long since the last thing happened
    const passed = this.sinceLast();
    
    // how long since the first time happened
    const passedSinceFirst = this.sinceFirst();

    // how long to wait before we move to the next period
    const nextPeriodWait = this.period - passedSinceFirst

    // do we have to wait till the next period anyway
    const available = this.available()
    const rateWait = available > 0 ? 0 : nextPeriodWait;

    // the delay is as provided minues how long since the last thing
    let delay = this.delay - passed;

    // but if we're smoothing, then we can adjust the delay, but not the ratewait
    // essentially a smooth is a modified delay
    const waitsLeft = available - 1;
    const left = waitsLeft / this.rate;
    /*
    console.log({
      passed,passedSinceFirst,nextPeriodWait,available,rateWait,delay,waitsLeft,left
    })
    */
    if (
      this.smooth &&
      !rateWait &&
      this.rate &&
      waitsLeft > 0 &&
      this.period &&
      left > this.smoothMinimum
    ) {
      // so dividing the time lefy to do it in - we get the delay
      // but it can never be greater than the min delay
      const x = delay
      delay = Math.max(delay, Math.ceil(nextPeriodWait / waitsLeft));
    }
    
    // the waitime applies to the delay - how long since the last thing happened
    // or it could be that we have to wait till the measurement period expires
    const waitTime = Math.max( rateWait , delay, 0)
    return waitTime;
  }

  // clear trackers
  reset() {
    this._entry = new RottlerEntry();
    return this.entry;
  }

  /**
   * this can be used to resolve once enough time has passed
   * @return {Promise|RottlerEntry} will be resolved when it's safe to go
   */
  rottle() {
    const wt = this.waitTime();

    if (this.synch) {
      // if we have a synch sleep function - ie apps script
      if (wt > 0) this.sleep(wt);
      return this.use({ waitTime: wt });
    } else {

      return wt > 0
        ? this.waiter(wt).then(() => this.useAsync({ waitTime: wt }))
        : this.useAsync({ waitTime: wt });
    }
  }

  /**
   * like use but promisified
   */
  useAsync(options) {
    return new Promise((resolve, reject) => {
      try {
        const entry = this.use(options);
        resolve(entry);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * test for quota left and update it if there is some
   * @param {object} [options]
   * @param {boolean} [options.throwsAsync] whether to reject ot throw
   * @param {boolean} [options.waitTime] how long waited before us for info
   * @return {RottlerEntry} the  entry if there is quota
   */
  use({ throwAsync = false, waitTime } = {}) {
    const now = this._now();
    const entry = this._cleanEntry();
    const sl = this.sinceLast()

    // if there's enough quota, then update it
    if (this.available() < 1) {
      if (this._events.rate.listener) {
        this._events.rate.listener();
      }
      if (this.throwError) {
        this.throw({
          msg: `Rate limit error - attempt to use  more than ${this.rate} times in ${this.period}ms`,
          throwAsync,
        });
      }
    } else if (sl < this.delay ) {
      if (this._events.delay.listener) {
        this._events.delay.listener();
      }
      if (this.throwError) {
        this.throw({
          msg: `Rate limit delay error - attempt to use ${this.sinceLast()}ms after last - min delay is ${
            this.delay
          }ms`,
          throwAsync,
        });
      }
    } else {
      entry.lastUsedAt = now;
      entry.uses.push(now);
    }
    return {
      ...entry,
      waitTime,
    };
  }

  ms(...args) {
    return this.constructor.ms(...args);
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



// because libraries dont really support calsses yet
function newRottler (options) {
  return new Rottler (options)
}
