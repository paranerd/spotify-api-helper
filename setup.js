const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const SpotifyApiHelper = require('./spotify');
require('dotenv').config();

const app = express();

app.get('/auth', function (req, res) {
  const state = crypto.randomBytes(16).toString('hex');
  const scope = 'user-read-playback-state user-modify-playback-state';
  const queryParams = {
    response_type: 'code',
    client_id: process.env.CLIENT_ID,
    scope: scope,
    redirect_uri: process.env.REDIRECT_URI.replace('{PORT}', process.env.PORT),
    state: state,
  };

  res.redirect(
    `https://accounts.spotify.com/authorize?${new URLSearchParams(queryParams)}`
  );
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const queryParams = {
    error: 'state_mismatch',
  };

  if (state === null) {
    res.redirect(`/#${new URLSearchParams(queryParams)}`);
  } else {
    const credentials64 = new Buffer.from(
      `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
    ).toString('base64');

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        {
          code: code,
          redirect_uri: process.env.REDIRECT_URI.replace(
            '{PORT}',
            process.env.PORT
          ),
          grant_type: 'authorization_code',
        },
        {
          headers: {
            Authorization: `Basic ${credentials64}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      process.env.REFRESH_TOKEN = response.data.refresh_token;

      console.log();
      console.log('--- Add REFRESH_TOKEN to your ENVIRONMENT ---');
      console.log(response.data.refresh_token);
      console.log();

      res.send('Check console output for token');
    } catch (err) {
      console.error(err);
      res.send('An error occurred. Check console output for details.');
    }
  }
});

app.get('/devices', async (req, res) => {
  const api = new SpotifyApiHelper(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  const devices = await api.getDevices();

  if (Object.keys(devices).length > 0) {
    console.log();
    console.log('--- Devices: ---');

    for (const name in devices) {
      console.log(`${name}: ${devices[name]}`);
    }

    console.log();
    res.send('Check console output for devices');
  } else {
    console.log('No devices found.');
    res.send('No devices found');
  }
});

app.listen(process.env.PORT, () => {
  console.log(
    `Open http://localhost:${process.env.PORT}/auth on your webbrowser`
  );
});
