const { NooLiteRequest, NooLiteResponse } = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class SufA extends AccessoryBase {
  static displayName() {
    return 'SUF-A';
  }
  static description() {
    return 'диммируемый блок с протоколом nooLite-F(новая прошивка)';
  }

  static getAccessoryCategory() {
    return 5;
  }

  createPeriodicTasks() {
    if (!this.platform.periodicAccessoryUpdate) return;
    
    setInterval(() => {
      this.log('send periodically update command');
      const command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));
      this.platform.sendCommand(command, (err, nlRes) => {})
    }, this.platform.periodicAccessoryUpdate * 1000);
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    const lightbulb = this.getOrCreateService(this.platform.Service.Lightbulb);
    const onCharacteristic = lightbulb.getCharacteristic(this.platform.Characteristic.On);
    
    this.state.on = onCharacteristic.value || false;
    
    onCharacteristic
      .on('set', this.setOnState.bind(this))
      .on('get', this.getOnState.bind(this));

    const brightness = lightbulb.getCharacteristic(this.platform.Characteristic.Brightness);

    this.state.brightness = brightness.value || false;

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

        this.state.on = nlCmd.d2 > 0;

        if (onCharacteristic.value !== this.state.on) {
          onCharacteristic.updateValue(this.state.on);
        }

        this.state.brightness = nlCmd.d3;

        if (this.state.brightness > 100) {
          this.state.brightness = 100;
        } else if (this.state.brightness < 0) {
          this.state.brightness = 0;
        }

        if (brightness.value !== this.state.brightness) {
          brightness.updateValue(this.state.brightness)
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

    if (this.platform.immediatelyResponse) {
      return callback(null, this.state.brightness);
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

      let brightnessValue = this.state.brightness;

      if (nlRes.isState() && nlRes.fmt === 0) {
        brightnessValue = nlRes.d3;
        if (brightnessValue > 100) {
          brightnessValue = 100;
        } else if (brightnessValue < 0) {
          brightnessValue = 0;
        }
      }

      return callback(null, brightnessValue);
    })

  }

  setBrightnessState(value, callback) {
    this.log("Set Brightness characteristic to " + value);
    let command = new NooLiteRequest(this.nlChannel, 6, 2, 0, 0, 0, value, 0, 0, 0, ...this.nlId.split(':'));

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
            'Model': 'SUF-A',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = SufA;
