const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class SuSwitch extends AccessoryBase {
  static displayName() {
    return 'SU-Switch';
  }
  static description() {
    return 'блок выключатель со старым протоколом nooLite';
  }

  static getAccessoryCategory() {
    return 8;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let switchService = this.getOrCreateService(this.platform.Service.Switch);
    let onCharacteristic = switchService.getCharacteristic(this.platform.Characteristic.On);

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
      }
    });
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'SU-Switch',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = SuSwitch;
