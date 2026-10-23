'use strict';

const LyrionClient = require('./lib/LyrionClient');

function devicesOn(homey, serverId) {
  return Object.values(homey.drivers.getDrivers())
    .flatMap((driver) => driver.getDevices())
    .filter((device) => device.getStoreValue('serverId') === serverId);
}

module.exports = {
  async getServers({ homey }) {
    return homey.app.getServers().map((s) => ({
      ...s, password: undefined, hasPassword: !!s.password, players: devicesOn(homey, s.id).length,
    }));
  },

  // Changing the address or login is tested before it's saved.
  async updateServer({ homey, params, body }) {
    const server = homey.app.getServer(params.id);
    if (!server) throw new Error('Unknown server');
    const updated = {
      ...server,
      host: body.host || server.host,
      port: Number(body.port) || server.port,
      username: body.username || '',
      password: body.password === undefined ? server.password : body.password,
    };
    await new LyrionClient(updated).getPlayers();
    homey.app.saveServer(updated);
  },

  async deleteServer({ homey, params }) {
    if (devicesOn(homey, params.id).length) throw new Error(homey.__('settings.in_use'));
    homey.settings.set('servers', homey.app.getServers().filter((s) => s.id !== params.id));
  },
};
