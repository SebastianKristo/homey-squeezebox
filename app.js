'use strict';

const Homey = require('homey');
const LyrionClient = require('./lib/LyrionClient');
const discover = require('./lib/discover');

class SqueezeboxApp extends Homey.App {
  async onInit() {
    this.clients = new Map();
    this.homey.settings.on('set', (key) => { if (key === 'servers') this.clients.clear(); });
    this.migrateLegacySettings();

    const deviceArg = (args) => args.device;

    this.homey.flow.getActionCard('play_favorite')
      .registerRunListener(async (args) => deviceArg(args).playFavorite(args.favorite.id))
      .registerArgumentAutocompleteListener('favorite', async (query, args) => {
        const favs = await args.device.client.getFavorites();
        return favs
          .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
          .map((f) => ({ name: f.name, id: f.id }));
      });

    this.homey.flow.getActionCard('play_preset')
      .registerRunListener(async (args) => deviceArg(args).playPreset(Number(args.preset)));

    this.homey.flow.getActionCard('set_alarms_enabled')
      .registerRunListener(async (args) => deviceArg(args).setAlarmsEnabled(args.state === '1'));

    this.homey.flow.getActionCard('play_url')
      .registerRunListener(async (args) => deviceArg(args).command(['playlist', 'play', args.url]));

    this.homey.flow.getActionCard('sync_to')
      .registerRunListener(async (args) => deviceArg(args).command(['sync', args.target.id]))
      .registerArgumentAutocompleteListener('target', async (query, args) => {
        // Players can only be synced with players on the same server.
        const players = await args.device.client.getPlayers();
        const self = args.device.getData().id;
        return players
          .filter((p) => p.playerid !== self && p.name.toLowerCase().includes(query.toLowerCase()))
          .map((p) => ({ name: p.name, id: p.playerid }));
      });

    this.homey.flow.getActionCard('unsync')
      .registerRunListener(async (args) => deviceArg(args).command(['sync', '-']));

    this.log('Squeezebox app started');
  }

  // Servers are stored as [{ id, name, host, port, username, password }].
  // id is Lyrion's UUID when known, so a server can be found again if its IP changes.
  getServers() {
    return this.homey.settings.get('servers') || [];
  }

  getServer(id) {
    return this.getServers().find((s) => s.id === id);
  }

  saveServer(server) {
    const servers = this.getServers().filter((s) => s.id !== server.id);
    servers.push(server);
    this.homey.settings.set('servers', servers);
  }

  // Tests the connection, then adds or updates the server. Returns its id.
  async addServer({ uuid, name, host, port, username, password }) {
    port = Number(port) || 9000;
    const client = new LyrionClient({ host, port, username, password });
    await client.getPlayers();
    const id = uuid || `${host}:${port}`;
    const existing = this.getServer(id) || {};
    this.saveServer({
      ...existing, id, name: name || existing.name || host, host, port, username: username || '', password: password || '',
    });
    return id;
  }

  getClientFor(serverId) {
    const server = this.getServer(serverId);
    if (!server) throw new Error(this.homey.__('error.no_server'));
    const key = JSON.stringify(server);
    let entry = this.clients.get(serverId);
    if (!entry || entry.key !== key) {
      entry = { key, client: new LyrionClient(server) };
      this.clients.set(serverId, entry);
    }
    return entry.client;
  }

  // Searches the network again and updates the IP of servers that have moved.
  // Throttled, since every device calls this when its server is unreachable.
  async rediscover() {
    if (this.lastDiscover && Date.now() - this.lastDiscover < 60 * 1000) return;
    this.lastDiscover = Date.now();
    for (const found of await discover()) {
      const server = this.getServer(found.uuid);
      if (server && (server.host !== found.host || server.port !== found.port)) {
        this.log(`Server ${server.name} moved to ${found.host}:${found.port}`);
        this.saveServer({ ...server, host: found.host, port: found.port });
      }
    }
  }

  // Finds the server a player is connected to now, in case it was moved.
  async findPlayer(playerId) {
    for (const server of this.getServers()) {
      const players = await this.getClientFor(server.id).getPlayers().catch(() => []);
      if (players.some((p) => p.playerid === playerId)) return server.id;
    }
    return null;
  }

  // Version 1.0 had a single server in the settings host/port/username/password.
  migrateLegacySettings() {
    this.legacyServerId = this.homey.settings.get('legacyServerId');
    const host = this.homey.settings.get('host');
    if (!host) return;
    const port = Number(this.homey.settings.get('port')) || 9000;
    this.legacyServerId = `${host}:${port}`;
    this.homey.settings.set('legacyServerId', this.legacyServerId);
    if (!this.getServer(this.legacyServerId)) {
      this.saveServer({
        id: this.legacyServerId,
        name: host,
        host,
        port,
        username: this.homey.settings.get('username') || '',
        password: this.homey.settings.get('password') || '',
      });
    }
    ['host', 'port', 'username', 'password'].forEach((k) => this.homey.settings.unset(k));
  }
}

module.exports = SqueezeboxApp;
