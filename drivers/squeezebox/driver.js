'use strict';

const Homey = require('homey');

class SqueezeboxDriver extends Homey.Driver {
  async onPairListDevices() {
    const players = await this.homey.app.getClient().getPlayers();
    return players.map((p) => ({
      name: p.name,
      data: { id: p.playerid },
      store: { model: p.modelname || p.model },
    }));
  }
}

module.exports = SqueezeboxDriver;
