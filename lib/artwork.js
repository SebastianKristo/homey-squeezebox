'use strict';

// Radio stations usually only send "Artist - Title" as text and no cover,
// so the cover is looked up in the iTunes Search API (free, no key).

// Lyrion's generic icons, e.g. html/images/radio.png, aren't real covers.
const PLACEHOLDER = /html\/images\/|\/plugins\/[^?]*\/(icon|logo)[^/]*\.(png|svg)/i;

function isPlaceholder(url) {
  return !url || PLACEHOLDER.test(url);
}

// Splits radio titles into artist and title. Handles "Artist - Title" and
// NRK's "Programme: Title, Artist".
function parseStreamTitle(text) {
  if (!text) return null;
  let t = text.trim();
  const dash = t.split(' - ');
  if (dash.length === 2) return { artist: dash[0].trim(), title: dash[1].trim() };
  const colon = t.indexOf(': ');
  if (colon > 0) t = t.slice(colon + 2);
  const comma = t.lastIndexOf(', ');
  if (comma > 0) return { title: t.slice(0, comma).trim(), artist: t.slice(comma + 2).trim() };
  return null;
}

const cache = new Map();

async function lookupCover(artist, title) {
  const key = `${artist}|${title}`.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  let url = null;
  try {
    const term = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`, {
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    const hit = json.results && json.results[0];
    if (hit && hit.artworkUrl100) url = hit.artworkUrl100.replace('100x100bb', '600x600bb');
  } catch (err) {
    // no cover found; fall back to Lyrion's
  }
  if (cache.size > 500) cache.clear();
  cache.set(key, url);
  return url;
}

module.exports = { isPlaceholder, parseStreamTitle, lookupCover };
