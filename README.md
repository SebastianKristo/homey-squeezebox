# Squeezebox (Lyrion) for Homey

Controls Squeezebox Radio / Boom / Touch (and any other player) through Lyrion Music Server's JSON-RPC API.

## Install
    npm install -g homey
    homey login
    homey app install      # or `homey app run` for live logs

Then open the app settings in Homey, enter the Lyrion server IP (port 9000), and add devices under *Squeezebox player*.

## Features
- Separate device types for Squeezebox Radio, Boom and Touch (plus a generic one for other players)
- Preset buttons 1–6 (and a "play preset" flow card)
- Power, play/pause, next/previous, volume, mute
- Now playing: artist, album, track, album art
- Flow trigger: track changed (tokens: track, artist, album)
- Flows: play favorite, play URL/stream, sync/unsync players
- Status polled every 5 s
