const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Sd extends AccessoryBase {
  static displayName() {
    return 'SD';
  }
  static description() {
    return 'RGB контроллер';
  }

  static getAccessoryCategory() {
    return 5;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let lightbulb = this.getOrCreateService(this.platform.Service.Lightbulb);
    let onCharacteristic = lightbulb.getCharacteristic(this.platform.Characteristic.On);
    let brightness = lightbulb.getCharacteristic(this.platform.Characteristic.Brightness)
    let hue = lightbulb.getCharacteristic(this.platform.Characteristic.Hue)
    let saturation = lightbulb.getCharacteristic(this.platform.Characteristic.Saturation)


    onCharacteristic
      .on('set', (value, callback) => {
        if (onCharacteristic.value === value) {
          callback();
          return;
        }

        this.log("Set On characteristic to " + value);

        let command = new NooLiteRequest(this.nlChannel, (value ? 2 : 0), 0);

        this.platform.sendCommand(command, (err, nlRes) => {
          if (err) {
            this.log('Error on write: ', err.message);
            callback(new Error('Error on write: ' + err.message));
            return;
          } else if (nlRes.isError()) {
            callback(new Error('Error on write: ' + nlRes));
            return;
          }

          callback();
        })

      });

    let setRGBValues = (rgbValues, callback) => {
      let command = new NooLiteRequest(this.nlChannel, 6, 0, 0, 0, 3, rgbValues.r, rgbValues.g, rgbValues.b);

      this.platform.sendCommand(command, (err, nlRes) => {
        if (err) {
          this.log('Error on write: ', err.message);
          callback(new Error('Error on write: ' + err.message));
          return;
        } else if (nlRes.isError()) {
          callback(new Error('Error on write: ' + nlRes));
          return;
        }

        callback();
      });
    };

    brightness
      .on('set', (value, callback) => {
        this.log("Set brightness characteristic to " + value);
        let rgbValues = this.hsvToRgb(hue.value, saturation.value, value);
        setRGBValues(rgbValues, callback);
      });
    
    hue
      .on('set', (value, callback) => {
        this.log("Set Hue characteristic to " + value);
        let rgbValues = this.hsvToRgb(value, saturation.value, brightness.value);
        setRGBValues(rgbValues, callback);
      });
    
    // Создает дополнительную кнопку запуска перелива цветов
    let rgbSwitch = this.getOrCreateService(this.platform.Service.Switch);
    rgbSwitch.setCharacteristic(this.platform.Characteristic.Name, `${this.accessory.displayName}: радуга`);
    let switchOn = rgbSwitch.getCharacteristic(this.platform.Characteristic.On);

    switchOn
      .on('set', (value, callback) => {
        this.log("Set switchOn characteristic to " + value);

        let command = new NooLiteRequest(this.nlChannel, (value ? 16 : 10), 0);

        this.platform.sendCommand(command, (err, nlRes) => {
          if (err) {
            this.log('Error on write: ', err.message);
            callback(new Error('Error on write: ' + err.message));
            return;
          } else if (nlRes.isError()) {
            callback(new Error('Error on write: ' + nlRes));
            return;
          }

          callback();
        })

      });


    // Обработка поступивших команд от MTRF
    this.platform.serialPort.nlParser.on(`nlres:${this.nlChannel}`, (nlCmd) => {
      this.log('read data by CHANNEL: ', nlCmd);
      
      // mode 0 - NooLite TX
      if (nlCmd.mode !== 0) {
        return;
      }

      switch (nlCmd.cmd) {
        case 0:
        case 1:
          onCharacteristic.updateValue(0);
          break;
        case 2:
        case 3:
          onCharacteristic.updateValue(1);
          break;
        case 4:
          onCharacteristic.updateValue(!onCharacteristic.value);
          break;
      }
    });
  }

 hsvToRgb(h, s, v) {
    let r, g, b, i, f, p, q, t;

    h /= 360;
    s /= 100;
    v /= 100;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return {r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255)};
}

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'SD',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Sd;
