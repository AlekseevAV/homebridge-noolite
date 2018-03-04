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
    return 8;
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

        this.platform.serialPort.write(command.toBytes(), null, (err) => {
          if (err) {
            this.log('Error on write: ', err.message);
            callback(new Error('Error on write: ' + err.message));
            return;
          }
          this.log('message written in SET callback: ', command);
          callback();
        });
      });

    brightness
      .on('set', (value, callback) => {
        this.log("Set brightness characteristic to " + value);

        let command = new NooLiteRequest(this.nlChannel, 6, 0, 0, 0, 1, 28 + Math.ceil(125 / 100 * value));

        this.platform.serialPort.write(command.toBytes(), null, (err) => {
          if (err) {
            this.log('Error on write: ', err.message);
            callback(new Error('Error on write: ' + err.message));
            return;
          }
          this.log('message written in SET callback: ', command);
          callback();
        });
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
          brightness.updateValue(Math.ceil(nlCmd.d0 / (255 / 100)));
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
