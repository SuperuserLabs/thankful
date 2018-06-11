'use strict';

let lastPage = null;

export function sinceLastCall() {
  // Returns the time in seconds since last time the function was called.
  let now = new Date();
  lastPage = lastPage || now;

  let duration = (now - lastPage) / 1000;
  lastPage = now;
  return duration;
}
