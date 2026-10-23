'use strict';

const Homey = require('homey');
const MODELS = require('../../lib/models');

class SqueezeboxDriver extends Homey.Driver {
  // The generic driver lists every player that doesn't have its own driver.
  matchesModel(model) {
    const own = MODELS[this.id];
    return own ? model === own : !Object.values(MODELS).includes(model);
  }

  async onPairListDevices() {
    const players = await this.homey.app.getClient().getPlayers();
    return players
      .filter((p) => this.matchesModel(p.model))
      .map((p) => ({
        name: p.name,
        data: { id: p.playerid },
        store: { model: p.modelname || p.model },
      }));
  }
}

module.exports = SqueezeboxDriver;
