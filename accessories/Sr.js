const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Sr extends AccessoryBase {
  static displayName() {
    return 'SR';
  }
  static description() {
    return 'блок со старым протоколом nooLite';
  }

  static getAccessoryCategory() {
    return 8;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let onCharacteristic = this.getOrCreateService(this.platform.Service.Switch).getCharacteristic(this.platform.Characteristic.On);
    onCharacteristic
      .on('set', this.setOnState.bind(this));

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

  setOnState(value, callback) {
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
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'SR',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Sr;
