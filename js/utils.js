export const MAX_GUESSES = 5;
export const URL = window.location.href;
export const CENTER_COORDS = [37.3340062, -121.8917829];
export const STATES = { "WIN": "win", "LOSE": "lose", "PLAY": "play", "NEW": "new" };
export const mulberry32 = num => { // Seed function PRNG
    let t = num + 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
export const formatRouteName = routeName => routeName.trim().toLowerCase().replace(/\b\w/g, match => match.toUpperCase());
export const getRouteOfTheDay = (routeIDs, seed) => routeIDs[Math.floor(mulberry32(seed) * routeIDs.length)];
export const dateToSeed = (date = new Date()) => (date.getFullYear() % 100000) * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
