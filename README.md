# Spotify API Helper

## How to get started

1. Clone this repository
1. Rename `.env` to `.env.sample`
1. Adjust your `MARKET` country code accordingly
1. Create an app in your [Spotify Dashboard](https://developer.spotify.com/dashboard/applications)
1. Edit the app settings and add the `REDIRECT_URI` specified in `.env`
1. Add the app's `CLIENT_ID` and `CLIENT_SECRET` to `.env`
1. Run
   ```
   npm i
   ```
1. Run
   ```
   npm run setup
   ```
1. Open http://localhost:8080/auth in your webbrowser
1. Authenticate
1. Once successful, find the **Refresh Token** in your terminal output and add it to `.env`
1. (Optional) If you want to control a single device at all times, set the corresponding Device ID:
   - Open http://localhost:8080/devices in your webbrowser
   - Check console output for devices. You may use those IDs dynamically in your code or set a particular one as `DEVICE_ID` to `.env`

## Example Usage

```js
require('dotenv').config();
const SpotifyApiHelper = require('./spotify');

async function main() {
  const api = new SpotifyApiHelper(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  await api.playTrack('down with the sickness', 'disturbed');
}

main();
```
