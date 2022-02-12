const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Su extends AccessoryBase {
  static displayName() {
    return 'SU';
  }
  static description() {
    return 'диммируемый блок со старым протоколом nooLite';
  }

  static getAccessoryCategory() {
    return 5;
  }

  minBrightness = 41;
  maxBrightness = 152;

  percentToBrightnessValue(percent) {
    const diff = this.maxBrightness - this.minBrightness;
    if (percent <= 0) return 0
    return Math.ceil((diff/100) * percent + this.minBrightness)
  }

  brightnessValueToPercent(brightnessValue) {
    const diff = this.maxBrightness - this.minBrightness;
    const brightnessFromZero = brightnessValue - this.minBrightness;
    if (brightnessValue === 0) return 0
    return Math.round(brightnessFromZero / (diff / 100))
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let lightbulb = this.getOrCreateService(this.platform.Service.Lightbulb);
    let onCharacteristic = lightbulb.getCharacteristic(this.platform.Characteristic.On);
    let brightness = lightbulb.getCharacteristic(this.platform.Characteristic.Brightness);

    onCharacteristic
      .on('set', (value, callback) => {
        this.log("Set On characteristic to " + value);

        let command = new NooLiteRequest(this.nlChannel, (value ? 2 : 0), 0);

        this.platform.sendCommand(command, (err, nlRes) => {
          if (err) {
            this.log('Error on write: ', err.message);
            callback(new Error('Error on write'));
            return;
          } else if (nlRes.isError()) {
            this.log('Error on response: ', nlRes);
            callback(new Error('Error on response'));
            return;
          }

          callback();
        })
      });

    brightness
      .on('set', (value, callback) => {
        let brightnessValue = this.percentToBrightnessValue(value);
        this.log(`Set brightness characteristic to ${value}% -> ${brightnessValue}`);

        let command = new NooLiteRequest(this.nlChannel, 6, 0, 0, 0, 1, brightnessValue);

        this.platform.sendCommand(command, (err, nlRes) => {
          if (err) {
            this.log('Error on write: ', err.message);
            callback(new Error('Error on write'));
            return;
          } else if (nlRes.isError()) {
            this.log('Error on response: ', nlRes);
            callback(new Error('Error on response'));
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
          onCharacteristic.updateValue(0);
          break;
        case 2:
          onCharacteristic.updateValue(1);
          break;
        case 6:
          const brightnessPercent = this.brightnessValueToPercent(nlCmd.d0)
          this.log(`Update acc brightness ${nlCmd.d0} -> ${brightnessPercent}%`);
          brightness.updateValue(brightnessPercent);
          break;
      }
    });
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'SU',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Su;
