let lastPage = null;

/*
 * Returns the duration since last called if the value has stayed the same
 */
export function valueConstantTicker(): (value?: any) => number {
  let oldValue = null;
  let lastTime = new Date().getTime();
  return value => {
    let now = new Date().getTime();
    let duration = 0;
    if (oldValue === value) {
      duration = (now - lastTime) / 1000;
    }
    lastTime = now;
    oldValue = value;
    return duration;
  };
}

export function sinceLastCall(): number {
  // Returns the time in seconds since last time the function was called.
  let now = new Date().getTime();
  lastPage = lastPage || now;

  let duration = (now - lastPage) / 1000;
  lastPage = now;
  return duration;
}
