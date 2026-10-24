'use strict';

// Small wrapper around Node's http/https. Node's built-in fetch loads undici,
// which costs several MB of memory on Homey for something this simple.
const http = require('http');
const https = require('https');

const agents = {
  'http:': new http.Agent({ keepAlive: true, maxSockets: 4 }),
  'https:': new https.Agent({ keepAlive: true, maxSockets: 2 }),
};

const MAX_BODY = 3 * 1024 * 1024;

function request(url, { method = 'GET', headers = {}, body, timeout = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(u, { method, headers, agent: agents[u.protocol], timeout }, (res) => {
      // Follow redirects (image proxies and the iTunes CDN use them).
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(request(new URL(res.headers.location, u).href, { headers, timeout }));
        return;
      }
      const chunks = [];
      let size = 0;
      res.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY) req.destroy(new Error('Response too large'));
        else chunks.push(c);
      });
      res.on('end', () => resolve({
        status: res.statusCode,
        type: res.headers['content-type'] || '',
        body: Buffer.concat(chunks),
      }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

module.exports = { request };
