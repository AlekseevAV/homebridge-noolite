const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class SrfTermostat extends AccessoryBase {
  static displayName() {
    return 'SRF-1-3000-T';
  }
  static description() {
    return 'термостат';
  }

  static getAccessoryCategory() {
    return 8;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    this.service = this.getOrCreateService(this.platform.Service.Thermostat);
    this.currentHeatingCoolingState = this.service.getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState);
    this.targetHeatingCoolingState = this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState);
    this.currentTemperature = this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature);
    this.targetTemperature = this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature);
    this.temperatureDisplayUnits = this.service.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits);

    // Режимы в которых будет работать термостат
    // currentHeatingCoolingState: 0 - Off, 1 - Heat, 2 - Cool, 3 - Auto
    this.targetHeatingCoolingState.setProps({validValues: [0, 3]})
    
    // Устанавливаем диапазон температур, которые можно будет выбрать
    this.targetTemperature.setProps({minValue: 5, maxValue: 50})

    // Устанавливаем хендлеры
    this.targetTemperature.on('set', this.setTargetTemperature.bind(this));
    this.currentTemperature.on('get', this.getCurrentTemperature.bind(this));
    this.targetHeatingCoolingState.on('set', this.setTargetHeatingCoolingState.bind(this));

    // Обработка поступивших команд от MTRF
    this.platform.serialPort.nlParser.on(`nlres:${this.nlChannel}`, (nlCmd) => {
      this.log('read data by CHANNEL: ', nlCmd);

      if (nlCmd.isState() && nlCmd.fmt === 0) {
        let termostatData = nlCmd.termostatData();
        if (termostatData.temp !== undefined) {
          this.currentTemperature.setValue(termostatData.temp);
        }
      }
    });
  }

  getCurrentTemperature(callback) {
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
        let termostatData = nlRes.termostatData();
        if (termostatData.temp !== undefined) {
          onValue = termostatData.temp;
        }
      }

      callback(null, onValue);
    })

  }

  setTargetTemperature(value, callback) {
    this.log("Set On characteristic to " + value);

    let command = new NooLiteRequest(this.nlChannel, 6, 2, 0, 0, 2, value, 1, 0, 0, ...this.nlId.split(':'));

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

  setTargetHeatingCoolingState(value, callback) {
    // value: 0 - Off, 1 - Heat, 2 - Cool, 3 - Auto
    this.log("Set On characteristic to " + value);
    let cmd = null;
    if (value === 0) {
      cmd = 0;
    } else {
      cmd = 2;
    }

    let command = new NooLiteRequest(this.nlChannel, cmd, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));

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
      this.currentHeatingCoolingState = value;
      callback();
    })
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'SrfTermostat',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = SrfTermostat;
