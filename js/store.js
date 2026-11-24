// Everything is stored only on this device, in the browser's localStorage. Nothing is ever sent anywhere.
import { addDays, localTodayISO } from './dates.js';

const KEY = 'ibd-diet-trial.v1';

export function emptyState() {
  return { settings: null, entries: {}, weekly: [], labs: [], weights: [], experiences: [], feedback: [], clockOffsetDays: 0 };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const s = { ...emptyState(), ...JSON.parse(raw) };
    for (const k of ['weekly', 'labs', 'weights', 'experiences', 'feedback']) if (!Array.isArray(s[k])) s[k] = [];
    if (!s.entries || typeof s.entries !== 'object' || Array.isArray(s.entries)) s.entries = {};
    if (s.settings && typeof s.settings !== 'object') s.settings = null;
    return s;
  } catch {
    return emptyState();
  }
}

// Browser storage is not guaranteed to last: a browser may evict it when the device runs low on
// space, and iOS Safari clears script-writable storage for sites left unvisited for a long stretch.
// Asking for persistent storage opts this app out of that, so a 12-week trial is not lost halfway.
// Best effort only: browsers without the Storage API, or that refuse, simply carry on unchanged.
let persistenceAsked = false;
export function requestPersistence() {
  if (persistenceAsked) return;
  persistenceAsked = true;
  try {
    const st = navigator.storage;
    if (!st || typeof st.persist !== 'function') return;
    Promise.resolve(typeof st.persisted === 'function' ? st.persisted() : false)
      .then((already) => (already ? null : st.persist()))
      .catch(() => { /* refused or unavailable */ });
  } catch { /* Storage API unavailable */ }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    requestPersistence();
    return true;
  } catch {
    return false;
  }
}

export function clearAll() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  return emptyState();
}

// "Today" can be shifted for demonstrations (About > Demo tools). Real use keeps the offset at 0.
export function today(state) {
  return addDays(localTodayISO(), state.clockOffsetDays || 0);
}
