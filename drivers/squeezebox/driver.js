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
    session.setHandler('get_server', async () => this.homey.app.getServer());
    session.setHandler('discover', async () => discover());
    session.setHandler('save_server', async (server) => {
      try {
        await this.homey.app.setServer(server);
      } catch (err) {
        throw new Error(this.homey.__('pair.connect_failed', { error: err.message }));
      }
    });
    session.setHandler('list_devices', async () => {
      const players = await this.homey.app.getClient().getPlayers();
      return players
        .filter((p) => this.matchesModel(p.model))
        .map((p) => ({
          name: p.name,
          data: { id: p.playerid },
          store: { model: p.modelname || p.model },
        }));
    });
  }
}

module.exports = SqueezeboxDriver;
