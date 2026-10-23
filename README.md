<p align="center"><img src="assets/readme-banner.png" alt="Lyrion" width="600"></p>

# Squeezebox (Lyrion) for Homey

Controls Squeezebox Radio / Boom / Touch (and any other player) through Lyrion Music Server's JSON-RPC API.

## Install
    npm install -g homey
    homey login
    homey app install      # or `homey app run` for live logs

Then open the app settings in Homey, enter the Lyrion server IP (port 9000), and add devices under *Squeezebox player*.

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

## Credits
The Lyrion logo comes from the [Lyrion Music Server](https://github.com/LMS-Community/slimserver) project (`HTML/EN/html/images/lms.svg`) and belongs to the LMS Community. This app is not an official Lyrion project.
