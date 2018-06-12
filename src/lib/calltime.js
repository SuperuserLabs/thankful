'use strict';

let lastPage = null;
/*
 * Returns the duration since last called if the value has stayed the same
 */
export function valueConstantTicker() {
  let oldValue = null;
  let lastTime = new Date();
  return value => {
    let now = new Date();
    let duration = 0;
    if (oldValue === value) {
      duration = (now - lastTime) / 1000;
    }
    lastTime = now;
    oldValue = value;
    return duration;
  };
}

export function sinceLastCall() {
  // Returns the time in seconds since last time the function was called.
  let now = new Date();
  lastPage = lastPage || now;

  let duration = (now - lastPage) / 1000;
  lastPage = now;
  return duration;
}
