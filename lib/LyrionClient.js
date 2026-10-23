'use strict';

class LyrionClient {
  constructor({ host, port = 9000, username, password }) {
    this.host = host;
    this.port = port;
    this.auth = username ? 'Basic ' + Buffer.from(`${username}:${password || ''}`).toString('base64') : null;
  }

  get baseUrl() {
    return `http://${this.host}:${this.port}`;
  }

  async request(playerId, command) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.auth) headers.Authorization = this.auth;
    const res = await fetch(`${this.baseUrl}/jsonrpc.js`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: 1, method: 'slim.request', params: [playerId || '', command] }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Lyrion HTTP ${res.status}`);
    const json = await res.json();
    return json.result || {};
  }

  async getPlayers() {
    const r = await this.request('', ['players', 0, 100]);
    return r.players_loop || [];
  }

  async getStatus(playerId) {
    return this.request(playerId, ['status', '-', 1, 'tags:alJK']);
  }

  async getFavorites() {
    const r = await this.request('', ['favorites', 'items', 0, 200, 'want_url:1']);
    return (r.loop_loop || []).filter((f) => f.isaudio || f.type === 'audio');
  }

  coverUrl(playerId) {
    return `${this.baseUrl}/music/current/cover.jpg?player=${encodeURIComponent(playerId)}&t=${Date.now()}`;
  }
}

module.exports = LyrionClient;
