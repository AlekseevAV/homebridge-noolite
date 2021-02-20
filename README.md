# homebridge-noolite

NooLite plugin (via [USB MTRF-64](https://www.noo.com.by/mtrf-64-usb.html) or [МТRF-64](https://www.noo.com.by/mtrf-64.html) modules) for homebridge

Read this in other languages: [Русский](https://github.com/AlekseevAV/homebridge-noolite/blob/master/README.ru.md)

TG channel: https://t.me/Noolite (tg://t.me/Noolite)

## QuickStart

1. Install [homebridge](https://github.com/nfarina/homebridge)
2. Install homebridge-noolite plugin

        $ sudo npm install -g --unsafe-perm homebridge-noolite

3. Add settings to homebridge config.json

        ...
        "platforms": [
            {
              "platform": "NooLitePlatform",
              "serialPort": "/dev/tty.usbserial-AL032Z5U",
              "serverPort": "8080",
              "periodicAccessoryUpdate": 5,
              "requestTtl": 1000,
              "serialWriteDelayMs": 250,
              "immediatelyResponse": true
            }
          ]
        ...

    * `serialPort` - path to MTRF-64 serial port _required_
    * `serverPort` - web-ui port for add new noolite accessories _optional, default: 8080_
    * `periodicAccessoryUpdate` - periodically update NooLite-F accessories status (in seconds) _optional, default this feature is disabled_
    * `requestTtl` - waiting block response timeout in milliseconds
    * `serialWriteDelayMs` - delay between sending commands to blocks in milliseconds (if too short, MTRF adapter may not have enough time to process requests/responses)
    * `immediatelyResponse` - allows to respond immediately on HB request, this will allow to show *Home* tab with many device without response error (due to TTL). Devices will be updated in foreground (if something changed)
    
    See `sampleConfig.json` file for example.

4. Fix permission to MTRF (For USB)
`sudo usermod -a -G dialout `

5. Run homebridge

## Description

After successful start web interface will be available on address: `<device_ip>:8080`

On the main page, we can directly interact with the MTRF-64 adapter by sending commands presets or use raw bites,
according to [MTRF-64 manual](https://www.noo.com.by/assets/files/PDF/MTRF-64-USB.pdf).

There are 2 sections оn accessories page (`/acc`):

1. MTRF - interact with NooLite-F devices (SLF, SRF blocks) by channels (0 to 63)
2. HomeKit - interact with HomeKit accessories

## NooLite supported accessories

#### Blocks:
1. [SLF](https://www.noo.com.by/slf-1-300.html) block with NooLite-F protocol
2. [SUF](https://www.noo.com.by/silovoj-blok-suf-1-300.html) dimmable block with NooLite-F protocol
3. [SU](https://www.noo.com.by/su111-200.html) block
4. [SB](https://www.noo.com.by/silovoj-blok-sb111-150.html) block
5. [SR](https://www.noo.com.by/silovoj-blok-sr211-2k0.html) block
6. [SD](https://www.noo.com.by/silovoj-blok-SD111-180.html) RGB led strip block
7. [SRF-R](https://www.noo.com.by/silovoj-blok-srf-1-1000-r.html) block for garage and home doors, window and window coverages
8. [SRF-1-3000-T](https://www.noo.com.by/silovoj-blok-srf-1-3000-t.html) block for controlling electric heating systems

#### Sensors:
1. Motion sensor [PM112](https://www.noo.com.by/pm112-sensor.html)
2. Temperature sensor [PT112](https://www.noo.com.by/pt112.html)
3. Temperature and humidity sensor [PT111](https://www.noo.com.by/pt111.html)
4. Leak sensor [WS-1](https://www.noo.com.by/datchik-protechki-ws-1.html)
5. Contact sensor [DS-1](https://www.noo.com.by/datchik-otkryitiyazakryitiya-ds-1.html)

#### Custom accessories:
1. Garage Door accessory - based on SLF block, send 8 command (Power On by 1.5 seconds) to block on Open/Close action.
   Default setting is the interval of 1 second for the complete opening/closing of the door.

### TODO:
1. SLF configuration improvements
2. Web interface UI/UX
