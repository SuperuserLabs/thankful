export function formatSecs(secs) {
  secs = Math.floor(secs);
  if (secs < 60) {
    return `${secs} s`;
  } else if (secs < 3600) {
    let mins = Math.floor(secs / 60);
    secs = secs % 60;
    return `${mins}m ${secs}s`;
  } else {
    let hrs = Math.floor(secs / 3600);
    let mins = Math.floor((secs % 3600) / 60);
    secs = secs % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  }
}
