const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class SlfSwitch extends AccessoryBase {
  static displayName() {
    return 'SLFSwitch';
  }
  static description() {
    return 'блок выключатель с протоколом nooLite-F';
  }

  static getAccessoryCategory() {
    return 8;
  }

  createPeriodicTasks() {
    super.initOrCreateServices();
    if (this.platform.periodicAccessoryUpdate) {
      setInterval(() => {
        this.log('send periodically update command');
        let command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));
        this.platform.sendCommand(command, (err, nlRes) => {})
      }, this.platform.periodicAccessoryUpdate * 1000);
    }
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let onCharacteristic = this.getOrCreateService(this.platform.Service.Switch).getCharacteristic(this.platform.Characteristic.On);
    onCharacteristic
      .on('set', this.setOnState.bind(this))
      .on('get', this.getOnState.bind(this));

    // Обработка поступивших команд от MTRF
    this.platform.serialPort.nlParser.on(`nlres:${this.nlId}`, (nlCmd) => {
      this.log('read data by ID: \n', nlCmd);
      if (nlCmd.isState() && nlCmd.fmt === 0) {
        // fmt 0 - Информация о силовом блоке
        // d0 - Код типа устройства
        // d1 - Версия микропрограммы устройства
        // d2 - Состояние устройства:
        //      0 – выключено
        //      1 – включено
        //      2 – временное включение
        // d3 - Текущая яркость (0-255)

        let onValue = nlCmd.d2 > 0;

        if (onCharacteristic.value !== onValue) {
            onCharacteristic.updateValue(onValue);
        }
      }
    });
  }

  getOnState(callback) {
    this.log("get value");
    let acc = this.accessory;

    let command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));

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

      let onValue = acc.value;

      if (nlRes.isState() && nlRes.fmt === 0) {
        onValue = nlRes.d2 > 0;
      }

      callback(null, onValue);
    })

  }

  setOnState(value, callback) {
    this.log("Set On characteristic to " + value);

    let command = new NooLiteRequest(this.nlChannel, (value ? 2 : 0), 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));

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
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'SLFSwitch',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = SlfSwitch;
