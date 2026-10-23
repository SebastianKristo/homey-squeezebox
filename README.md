<p align="center"><img src="assets/readme-banner.png" alt="Lyrion" width="600"></p>

# Squeezebox (Lyrion) for Homey

> **Unofficial.** This app is not made, endorsed or supported by the Lyrion / LMS Community or by Logitech.

Controls Squeezebox Radio / Boom / Touch (and any other player) through Lyrion Music Server's JSON-RPC API.

## Install
    npm install -g homey
    homey login
    homey app install      # or `homey app run` for live logs

Then add a device (Squeezebox Radio, Boom, Touch or Other Squeezebox player). The app searches your network for Lyrion servers; pick one, or enter the address yourself (port 9000).

### Several Lyrion servers
Each player remembers which server it belongs to, so players can be spread over several servers (e.g. the Radio on one and the Touch on another). Add the players from each server separately. Servers can be edited or removed in the app settings. If a server gets a new IP address, or a player is moved to another server you have added, the app finds it again by itself.

## Features
- Separate device types for Squeezebox Radio, Boom and Touch (plus a generic one for other players)
- Alarms: on/off, active, snoozed, upcoming, next alarm (+ flow triggers)
- Bass, treble and brightness buttons
- Preset buttons 1–6 (and a "play preset" flow card)
- Power, play/pause, next/previous, volume, mute
- Now playing: artist, album, track, album art
- Flow trigger: track changed (tokens: track, artist, album)
- Flows: play favorite, play URL/stream, sync/unsync players
- Status polled every 5 s
- Automatic discovery of Lyrion servers, and support for several servers at once

## Publishing
    homey app version patch   # bump version and add a changelog entry
    homey app publish

Then finish the store listing at https://tools.developer.homey.app/apps.

## Credits
The Lyrion logo comes from the [Lyrion Music Server](https://github.com/LMS-Community/slimserver) project (`HTML/EN/html/images/lms.svg`) and belongs to the LMS Community. This app is not an official Lyrion or Logitech product. Squeezebox and Logitech are trademarks of Logitech.
