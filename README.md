# homebridge-noolite

NooLite plugin (via [USB MTRF-64](https://www.noo.com.by/mtrf-64-usb.html) or [МТRF-64](https://www.noo.com.by/mtrf-64.html) modules) for homebridge

Read this in other languages: [Русский](https://github.com/AlekseevAV/homebridge-noolite/blob/master/README.ru.md)

## QuickStart

1. Install [homebridge](https://github.com/nfarina/homebridge)
2. Install homebridge-noolite plugin 

        $ npm install homebridge-noolite
   
3. Add settings to homebridge config.json

        ...
        "platforms": [
            {
              "platform": "NooLitePlatform",
              "serialPort": "/dev/tty.usbserial-AL032Z5U"
            }
          ]
        ...
 
    Use `serialport-list` command to get list of available serial ports. There should be path to MTRF-64 serial port.
    See `sampleConfig.json` file for example.

4. Run homebridge

## Description

After successful start web interface will be available on address: `<device_ip>:8080`

On the main page, we can directly interact with the MTRF-64 adapter by sending commands presets or use raw bites, 
according to [MTRF-64 manual](https://www.noo.com.by/assets/files/PDF/MTRF-64-USB.pdf).

There are 2 sections оn accessories page (`/acc`):

1. MTRF - interact with NooLite-F devices (SLF, SRF blocks) by channels (0 to 63) 
2. HomeKit - interact with HomeKit accessories 

## NooLite supported accessories

1. [SLF](https://www.noo.com.by/slf-1-300.html) block with NooLite-F protocol
3. [SU](https://www.noo.com.by/silovoj-blok-sb111-150.html) block
4. [SD](https://www.noo.com.by/silovoj-blok-SD111-180.html) RGB led strip block



3. Motion sensor [PM112](https://www.noo.com.by/pm112-sensor.html)
4. Temperature sensor [PM112](https://www.noo.com.by/pm112-sensor.html)
5. Temperature sensor [PT112](https://www.noo.com.by/pt112.html)
6. Temperature and humidity sensor [PT111](https://www.noo.com.by/pt112.html)

