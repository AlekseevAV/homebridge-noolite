const { NooLiteRequest, NooLiteResponse } = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Suf extends AccessoryBase {
  static displayName() {
    return 'SUF';
  }
  static description() {
    return 'диммируемый блок с протоколом nooLite-F';
  }

  static getAccessoryCategory() {
    return 5;
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

    let lightbulb = this.getOrCreateService(this.platform.Service.Lightbulb);

    let onCharacteristic = lightbulb.getCharacteristic(this.platform.Characteristic.On);
    onCharacteristic
      .on('set', this.setOnState.bind(this))
      .on('get', this.getOnState.bind(this));

    let brightness = lightbulb.getCharacteristic(this.platform.Characteristic.Brightness);
    brightness
      .on('set', this.setBrightnessState.bind(this))
      .on('get', this.getBrightnessState.bind(this));
    
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

        let currentBrightness = this.valueConverter(nlCmd.d3, 255, 100);

        if (currentBrightness > 100) {
          currentBrightness = 100;
        } else if (currentBrightness < 0) {
          currentBrightness = 0;
        }

        if (brightness.value !== currentBrightness) {
          brightness.updateValue(currentBrightness)
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

  getBrightnessState(callback) {
    this.log("get brightness value");
    let acc = this.accessory;
    let self = this;

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

      let brightnessValue = acc.value;

      if (nlRes.isState() && nlRes.fmt === 0) {
        brightnessValue = self.valueConverter(nlRes.d3, 255, 100);
        if (brightnessValue > 100) {
          brightnessValue = 100;
        } else if (brightnessValue < 0) {
          brightnessValue = 0;
        }
      }

      callback(null, brightnessValue);
    })

  }

  setBrightnessState(value, callback) {
    this.log("Set Brightness characteristic to " + value);

    // Яркость устанавливается в диапазоне 35-155 (то есть 0-120 + 35). Из HomeKit приходит в 0-100
    let command = new NooLiteRequest(this.nlChannel, 6, 2, 0, 0, 0, this.valueConverter(value, 100, 255), 0, 0, 0, ...this.nlId.split(':'));

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

  valueConverter(value, from, to, offset) {
    // Конвертор значений одних диапазонов значений в другие
    // При отправке команды мы задаем яркость как значение 0-100, 
    // а получаем текущее значение в диапазоне 0-255
    value = Math.ceil((value / from) * to)
    
    if (offset) {
      value += offset
    }

    return value
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'SUF',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Suf;
