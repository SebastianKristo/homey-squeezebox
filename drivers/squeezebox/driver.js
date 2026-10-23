'use strict';

const Homey = require('homey');
const MODELS = require('../../lib/models');
const discover = require('../../lib/discover');

class SqueezeboxDriver extends Homey.Driver {
  // The generic driver lists every player that doesn't have its own driver.
  matchesModel(model) {
    const own = MODELS[this.id];
    return own ? model === own : !Object.values(MODELS).includes(model);
  }

  async onPair(session) {
    let serverId = null;

    // Saved servers first, then any new ones found on the network.
    session.setHandler('get_servers', async () => {
      const saved = this.homey.app.getServers().map((s) => ({ ...s, password: undefined, saved: true }));
      const found = (await discover())
        .filter((f) => !saved.some((s) => s.id === f.uuid || (s.host === f.host && s.port === f.port)))
        .map((f) => ({ ...f, saved: false }));
      return [...saved, ...found];
    });

    session.setHandler('select_server', async (id) => {
      this.homey.app.getClientFor(id);
      serverId = id;
    });

    session.setHandler('add_server', async (server) => {
      try {
        serverId = await this.homey.app.addServer(server);
      } catch (err) {
        throw new Error(this.homey.__('pair.connect_failed', { error: err.message }));
      }
    });

    session.setHandler('list_devices', async () => {
      const players = await this.homey.app.getClientFor(serverId).getPlayers();
      const paired = this.getDevices().map((d) => d.getData().id);
      return players
        .filter((p) => this.matchesModel(p.model) && !paired.includes(p.playerid))
        .map((p) => ({
          name: p.name,
          data: { id: p.playerid },
          store: { serverId, model: p.modelname || p.model },
        }));
    });
  }
}

module.exports = SqueezeboxDriver;
