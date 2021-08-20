const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');
const constants = require("constants");


class SlfSwitchTemporaryOn extends AccessoryBase {
  static displayName() {
    return 'SlfSwitchTemporaryOn';
  }
  static description() {
    return 'SLF со временным включением блока. Отсылает команду 8 на SLF блок, который включатся на 3 секунды.';
  }

  static getAccessoryCategory() {
    return 8;
  }

  createPeriodicTasks() {}

  initOrCreateServices() {
    super.initOrCreateServices();

    this.onCharacteristic = this.getOrCreateService(this.platform.Service.Switch).getCharacteristic(this.platform.Characteristic.On);

    this.state.on = this.onCharacteristic.value || false;
    this.onDurationMs = 2550;

    this.onCharacteristic
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

        this.state.on = nlCmd.d2 > 0;

        if (this.onCharacteristic.value !== this.state.on) {
          this.onCharacteristic.updateValue(this.state.on);
        }
      }
    });
  }

  getOnState(callback) {
    this.log("get value");
    
    if (this.platform.immediatelyResponse){
      return callback(null, this.state.on);
    }

    const command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));
    this.platform.sendCommand(command, (err, nlRes) => {
      if (err) {
        this.log('Error on write: ', err.message);
        return callback(new Error('Error on write'));
      } else if (nlRes.isError()) {
        this.log('Error on response: ', nlRes);
        return callback(new Error('Error on response'));
      }

      let onValue = this.state.on;

      if (nlRes.isState() && nlRes.fmt === 0) {
        onValue = nlRes.d2 > 0;
      }

      return callback(null, onValue);  
    })

  }

  setOnState(value, callback) {
    this.log("Set On characteristic to " + value);

    if (value) {
      const timeToOn = Math.min(255, this.onDurationMs / 10)
      let command = new NooLiteRequest(this.nlChannel, 25, 2, 0, 0, 1, timeToOn, 0, 0, 0, ...this.nlId.split(':'));

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
        setTimeout(() => {
          this.onCharacteristic.setValue(false);
        }, this.onDurationMs);
      })
    } else {
      callback();
    }
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'SlfSwitchTemporaryOn',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = SlfSwitchTemporaryOn;
