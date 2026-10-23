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

  // Lists players from every Lyrion server: the ones already added, plus any
  // new servers found on the network. Servers with a password are added in
  // the app settings.
  async onPairListDevices() {
    const { app } = this.homey;
    for (const found of await discover()) {
      const known = app.getServers().some((s) => s.id === found.uuid || (s.host === found.host && s.port === found.port));
      if (!known) await app.addServer(found).catch((err) => this.log(`Skipping ${found.host}: ${err.message}`));
    }

    const servers = app.getServers();
    if (!servers.length) throw new Error(this.homey.__('pair.none_found'));

    const paired = this.getDevices().map((d) => d.getData().id);
    const devices = [];
    for (const server of servers) {
      const players = await app.getClientFor(server.id).getPlayers().catch((err) => {
        this.error(`Server ${server.name}:`, err.message);
        return [];
      });
      players
        .filter((p) => this.matchesModel(p.model) && !paired.includes(p.playerid))
        .forEach((p) => devices.push({
          name: servers.length > 1 ? `${p.name} (${server.name})` : p.name,
          data: { id: p.playerid },
          store: { serverId: server.id, model: p.modelname || p.model },
        }));
    }
    return devices;
  }
}

module.exports = SqueezeboxDriver;
