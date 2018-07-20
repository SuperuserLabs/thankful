export function formatSecs(secs, detail = 3) {
  secs = Math.round(secs);
  const times = [];
  if (secs >= 3600) {
    times.push(Math.floor(secs / 3600) + 'h');
    detail--;
  }
  if (secs >= 60 && detail > 0) {
    times.push(Math.floor((secs % 3600) / 60) + 'm');
    detail--;
  }
  if (detail > 0) {
    times.push((secs % 60) + 's');
  }
  return times.join(' ');
}
