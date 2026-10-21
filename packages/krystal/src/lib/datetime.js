// datetime.js — the local dates and wall-clock times the date and time controls read and write. A date
// is "YYYY-MM-DD", a time "HH:mm" and a moment both joined by "T" ("YYYY-MM-DDTHH:mm"): the forms a
// native date, time and datetime-local input hold, read on the person's own clock with no time zone.
// Keys of one form compare in time order as plain strings.

/** @param {number} n */
const pad2 = (n) => String(n).padStart(2, "0");

/**
 * A date's day as a key.
 * @param {Date} date
 * @returns {string} "YYYY-MM-DD"
 */
function dateKey(date) {
  return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
}

/**
 * A date's wall-clock time as a key, to the minute.
 * @param {Date} date
 * @returns {string} "HH:mm"
 */
function timeKey(date) {
  return pad2(date.getHours()) + ":" + pad2(date.getMinutes());
}

/**
 * A date as a moment key, to the minute.
 * @param {Date} date
 * @returns {string} "YYYY-MM-DDTHH:mm"
 */
function momentKey(date) {
  return dateKey(date) + "T" + timeKey(date);
}

/**
 * The local midnight a date key names, or null for anything that is not one.
 * @param {string | null | undefined} key
 * @returns {Date | null}
 */
function parseDate(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || "");
  if (!m) return null;
  const date = new Date(+m[1], +m[2] - 1, +m[3]);
  return date.getMonth() === +m[2] - 1 ? date : null;
}

/**
 * The local instant a moment key names, or null for anything that is not one.
 * @param {string | null | undefined} key
 * @returns {Date | null}
 */
function parseMoment(key) {
  const [day, time] = String(key || "").split("T");
  const date = parseDate(day);
  const minutes = minutesOf(time);
  if (!date || minutes == null) return null;
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

/**
 * Minutes after midnight for a time key, or null for anything that is not one.
 * @param {string | null | undefined} key
 * @returns {number | null}
 */
function minutesOf(key) {
  const m = /^(\d{2}):(\d{2})$/.exec(key || "");
  if (!m || +m[1] > 23 || +m[2] > 59) return null;
  return +m[1] * 60 + +m[2];
}

/**
 * The time key for minutes after midnight, wrapped into one day.
 * @param {number} minutes
 * @returns {string}
 */
function timeOf(minutes) {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  return pad2(Math.floor(m / 60)) + ":" + pad2(m % 60);
}

/**
 * The date key `days` away from another.
 * @param {string} key
 * @param {number} days
 * @returns {string}
 */
function addDays(key, days) {
  const date = parseDate(key) || new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

/**
 * The first step boundary after `from`: with a 30-minute step, 16:15 gives 16:30 and 16:30 gives 17:00.
 * Boundaries are counted from midnight, so a step that does not divide the day evenly restarts there.
 * @param {Date | number} [from] Now, when left out.
 * @param {number} [step] Minutes; 30 when left out.
 * @returns {Date}
 */
function nextStep(from = new Date(), step = 30) {
  const date = new Date(from);
  const minutes = date.getHours() * 60 + date.getMinutes();
  const next = (Math.floor(minutes / step) + 1) * step;
  date.setHours(0, 0, 0, 0);
  date.setMinutes(next);
  return date;
}

/**
 * The time keys from `from` to `to`, both included, `step` minutes apart.
 * @param {string} from
 * @param {string} to
 * @param {number} step
 * @returns {string[]}
 */
function timeRange(from, to, step) {
  const start = minutesOf(from), end = minutesOf(to);
  if (start == null || end == null || step <= 0) return [];
  const out = [];
  for (let m = start; m <= end; m += step) out.push(timeOf(m));
  return out;
}

export { addDays, dateKey, minutesOf, momentKey, nextStep, parseDate, parseMoment, timeKey, timeOf, timeRange };
