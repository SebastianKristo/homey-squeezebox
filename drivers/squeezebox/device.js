'use strict';

const Homey = require('homey');

const POLL_INTERVAL = 5000;

class SqueezeboxDevice extends Homey.Device {
  async onInit() {
    this.playerId = this.getData().id;

    this.registerCapabilityListener('onoff', (v) => this.command(['power', v ? 1 : 0]));
    this.registerCapabilityListener('speaker_playing', (v) => this.command(v ? ['play'] : ['pause', 1]));
    this.registerCapabilityListener('speaker_next', () => this.command(['playlist', 'index', '+1']));
    this.registerCapabilityListener('speaker_prev', () => this.command(['playlist', 'index', '-1']));
    this.registerCapabilityListener('volume_set', (v) => this.command(['mixer', 'volume', Math.round(v * 100)]));
    this.registerCapabilityListener('volume_mute', (v) => this.command(['mixer', 'muting', v ? 1 : 0]));

    this.image = await this.homey.images.createImage();
    this.image.setUrl(null);
    await this.setAlbumArtImage(this.image);
    this.lastCoverKey = null;
    this.lastTrackKey = null;

    this.poll();
    this.pollTimer = this.homey.setInterval(() => this.poll(), POLL_INTERVAL);
  }

  get client() {
    return this.homey.app.getClient();
  }

  async command(cmd) {
    await this.client.request(this.playerId, cmd);
    this.homey.setTimeout(() => this.poll(), 500);
  }

  async playFavorite(id) {
    await this.command(['favorites', 'playlist', 'play', `item_id:${id}`]);
  }

  async poll() {
    try {
      const s = await this.client.getStatus(this.playerId);
      if (s.player_connected === 0) {
        await this.setUnavailable(this.homey.__('error.disconnected'));
        return;
      }
      if (!this.getAvailable()) await this.setAvailable();

      const track = (s.playlist_loop && s.playlist_loop[0]) || {};
      const meta = s.remoteMeta || {};
      const vol = Number(s['mixer volume']) || 0;

      await this.set('onoff', s.power === 1);
      await this.set('speaker_playing', s.mode === 'play');
      await this.set('volume_set', Math.abs(vol) / 100);
      await this.set('volume_mute', vol < 0);
      const tokens = {
        track: meta.title || track.title || s.current_title || '',
        artist: meta.artist || track.artist || '',
        album: meta.album || track.album || '',
      };
      await this.set('speaker_track', tokens.track);
      await this.set('speaker_artist', tokens.artist);
      await this.set('speaker_album', tokens.album);

      const trackKey = `${tokens.track}|${tokens.artist}|${tokens.album}`;
      // Skip the first poll so restarting the app doesn't fire the trigger.
      if (this.lastTrackKey !== null && trackKey !== this.lastTrackKey && tokens.track) {
        this.homey.flow.getDeviceTriggerCard('track_changed')
          .trigger(this, tokens)
          .catch(this.error);
      }
      this.lastTrackKey = trackKey;

      const coverKey = `${track.id}|${track.coverid}|${meta.title}|${track.artwork_url}`;
      if (coverKey !== this.lastCoverKey) {
        this.lastCoverKey = coverKey;
        let art = track.artwork_url || meta.artwork_url;
        if (art && !/^https?:/.test(art)) art = this.client.baseUrl + (art.startsWith('/') ? '' : '/') + art;
        this.image.setUrl(art && art.startsWith('https') ? art : null);
        if (!art || !art.startsWith('https')) {
          // Homey requires https for setUrl; fall back to streaming the cover from the local server.
          this.image.setStream(async (stream) => {
            const res = await fetch(art || this.client.coverUrl(this.playerId));
            if (!res.ok) throw new Error('No cover');
            const buf = Buffer.from(await res.arrayBuffer());
            stream.end(buf);
          });
        }
        await this.image.update();
      }
    } catch (err) {
      this.error('Poll failed:', err.message);
      await this.setUnavailable(err.message).catch(() => {});
    }
  }

  async set(cap, value) {
    if (this.getCapabilityValue(cap) !== value) await this.setCapabilityValue(cap, value).catch(this.error);
  }

  async onDeleted() {
    this.homey.clearInterval(this.pollTimer);
  }

  async onUninit() {
    this.homey.clearInterval(this.pollTimer);
  }
}

module.exports = SqueezeboxDevice;
