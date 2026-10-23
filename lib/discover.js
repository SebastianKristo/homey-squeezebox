'use strict';

const dgram = require('dgram');

// Lyrion answers UDP broadcasts on port 3483 (the same discovery the players use).
// Request: 'e' followed by tags with zero length; reply: 'E' followed by
// 4-char tag, 1-byte length, value.
function discover(timeout = 3000) {
  return new Promise((resolve) => {
    const found = new Map();
    const socket = dgram.createSocket('udp4');

    socket.on('message', (msg, rinfo) => {
      if (msg[0] !== 0x45) return;
      const info = { host: rinfo.address, port: 9000, name: rinfo.address, uuid: null };
      let i = 1;
      while (i + 5 <= msg.length) {
        const tag = msg.toString('ascii', i, i + 4);
        const len = msg[i + 4];
        const value = msg.toString('utf8', i + 5, i + 5 + len);
        if (tag === 'NAME') info.name = value;
        if (tag === 'JSON') info.port = Number(value) || 9000;
        if (tag === 'UUID') info.uuid = value;
        i += 5 + len;
      }
      found.set(info.host, info);
    });
    socket.on('error', () => {});

    socket.bind(() => {
      socket.setBroadcast(true);
      const req = Buffer.from('eIPAD\0NAME\0JSON\0UUID\0', 'ascii');
      socket.send(req, 3483, '255.255.255.255');
    });

    setTimeout(() => {
      try { socket.close(); } catch (err) { /* already closed */ }
      resolve([...found.values()]);
    }, timeout);
  });
}

module.exports = discover;
