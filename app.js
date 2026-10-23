'use strict';

const Homey = require('homey');
const LyrionClient = require('./lib/LyrionClient');

class SqueezeboxApp extends Homey.App {
  async onInit() {
    this.homey.settings.on('set', () => { this._client = null; });

    const deviceArg = (args) => args.device;

    this.homey.flow.getActionCard('play_favorite')
      .registerRunListener(async (args) => deviceArg(args).playFavorite(args.favorite.id))
      .registerArgumentAutocompleteListener('favorite', async (query) => {
        const favs = await this.getClient().getFavorites();
        return favs
          .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
          .map((f) => ({ name: f.name, id: f.id }));
      });

    this.homey.flow.getActionCard('play_preset')
      .registerRunListener(async (args) => deviceArg(args).playPreset(Number(args.preset)));

    this.homey.flow.getActionCard('play_url')
      .registerRunListener(async (args) => deviceArg(args).command(['playlist', 'play', args.url]));

    this.homey.flow.getActionCard('sync_to')
      .registerRunListener(async (args) => deviceArg(args).command(['sync', args.target.id]))
      .registerArgumentAutocompleteListener('target', async (query, args) => {
        const players = await this.getClient().getPlayers();
        const self = args.device && args.device.getData().id;
        return players
          .filter((p) => p.playerid !== self && p.name.toLowerCase().includes(query.toLowerCase()))
          .map((p) => ({ name: p.name, id: p.playerid }));
      });

    this.homey.flow.getActionCard('unsync')
      .registerRunListener(async (args) => deviceArg(args).command(['sync', '-']));

    this.log('Squeezebox app started');
  }

  getClient() {
    if (!this._client) {
      const host = this.homey.settings.get('host');
      if (!host) throw new Error(this.homey.__('error.no_server'));
      this._client = new LyrionClient({
        host,
        port: Number(this.homey.settings.get('port')) || 9000,
        username: this.homey.settings.get('username'),
        password: this.homey.settings.get('password'),
      });
    }
    return this._client;
  }
}

module.exports = SqueezeboxApp;
