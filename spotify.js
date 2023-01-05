const axios = require('axios');
require('dotenv').config();

class SpotifyApiHelper {
  constructor(clientId, clientSecret, token = null) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.token = token;
  }

  /**
   * Get access token.
   * Fetch if none available.
   *
   * @returns {string}
   */
  async getAccessToken() {
    if (!this.token) {
      await this.refreshAccessToken();
    }

    return this.token;
  }

  /**
   * Refresh access token.
   */
  async refreshAccessToken() {
    console.log('Refreshing access token...');

    const credentials64 = new Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString('base64');

    try {
      const res = await axios.post(
        'https://accounts.spotify.com/api/token',
        {
          grant_type: 'refresh_token',
          refresh_token: process.env.REFRESH_TOKEN,
        },
        {
          headers: {
            Authorization: `Basic ${credentials64}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.token = res.data.access_token;
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Set implicit access token.
   */
  async setImplicitToken() {
    const credentials64 = new Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString('base64');

    try {
      const res = await axios.post(
        'https://accounts.spotify.com/api/token',
        {
          grant_type: 'client_credentials',
        },
        {
          headers: {
            Authorization: `Basic ${credentials64}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.token = res.data.access_token;
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Helper function to wrap Spotify API calls.
   *
   * @param {string} method
   * @param {string} url
   * @param {Object|undefined} params
   * @param {Object|undefined} data
   * @param {boolean} retry
   * @returns {AxiosResponse}
   */
  async sendApiRequest(
    method,
    url,
    params = undefined,
    data = undefined,
    retry = false
  ) {
    const headers = {
      Authorization: `Bearer ${await this.getAccessToken()}`,
      'Content-Type': 'application/json',
    };

    try {
      return await axios({
        method,
        url,
        params,
        data,
        headers,
      });
    } catch (err) {
      if (err.response.status === 401 && !retry) {
        await this.refreshAccessToken();
        return await this.sendApiRequest(method, url, params, data, true);
      }
    }
  }

  /**
   * Get track URL.
   *
   * @param {string} title
   * @param {string|undefined} artist
   * @param {boolean} retry
   * @returns {string}
   */
  async search(title, artist = undefined) {
    const artistQuery = artist ? `%20artist:${encodeURIComponent(artist)}` : '';
    const query = `${title}${artistQuery}`;

    const res = await this.sendApiRequest(
      'get',
      'https://api.spotify.com/v1/search',
      {
        q: query,
        type: 'track',
        market: process.env.MARKET,
      }
    );

    return {
      internal: res.data.tracks.items[0].uri,
      external: res.data.tracks.items[0].external_urls.spotify,
    };
  }

  /**
   * Play track.
   *
   * @param {string} title
   * @param {string|undefined} artist
   * @param {string|undefined} deviceId
   */
  async playTrack(title, artist = undefined, deviceId = undefined) {
    // Determine track URL
    const url = await this.search(title, artist);

    if (!url) {
      return;
    }

    // Set device ID if any
    const params = {};

    if (deviceId) {
      params['deviceId'] = deviceId;
    } else if (process.env.DEVICE_ID) {
      params['deviceId'] = process.env.DEVICE_ID;
    }

    // Set track URL
    const data = {
      uris: [url.internal],
    };

    await this.sendApiRequest(
      'put',
      'https://api.spotify.com/v1/me/player/play',
      params,
      data
    );
  }

  /**
   * Resume playback on the currently active player.
   */
  async resumePlayback() {
    await this.sendApiRequest(
      'put',
      'https://api.spotify.com/v1/me/player/play'
    );
  }

  /**
   * Pause playback on the currently active player.
   */
  async pausePlayback() {
    await this.sendApiRequest(
      'put',
      'https://api.spotify.com/v1/me/player/pause'
    );
  }

  /**
   * Get a list of all known devices.
   *
   * @returns {Object}
   */
  async getDevices() {
    const res = await this.sendApiRequest(
      'get',
      'https://api.spotify.com/v1/me/player/devices'
    );

    const devices = {};

    if (res.data.devices) {
      for (const device of res.data.devices) {
        devices[device.name] = device.id;
      }
    }

    return devices;
  }
}

module.exports = SpotifyApiHelper;
