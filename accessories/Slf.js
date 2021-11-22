const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Slf extends AccessoryBase {
  static displayName() {
    return 'SLF/SRF';
  }
  static description() {
    return 'блок с протоколом nooLite-F';
  }

  static getAccessoryCategory() {
    return 5;
  }

  createPeriodicTasks() {
    if (!this.platform.periodicAccessoryUpdate) return;

    setInterval(() => {
      this.log('send periodically update command');
      const command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));
      this.platform.sendCommand(command, () => {});
    }, this.platform.periodicAccessoryUpdate * 1000);
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    const onCharacteristic = this.getOrCreateService(this.platform.Service.Lightbulb).getCharacteristic(this.platform.Characteristic.On);

    this.state.on = onCharacteristic.value || false;

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

        this.state.on = nlCmd.d2 > 0;

        if (onCharacteristic.value !== this.state.on) {
            onCharacteristic.updateValue(this.state.on);
        }
      }
    });
  }


  updateOnValue(reject, resolve){
    
    const command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));
    this.platform.sendCommand(command, (err, nlRes) => {
      if (err) {
        this.log('Error on write: ', err.message);
        return reject('Error on write');
      } else if (nlRes.isError()) {
        this.log('Error on response: ', nlRes);
        return reject('Error on response');
      }

      let onValue = this.state.on;

      if (nlRes.isState() && nlRes.fmt === 0) {
        onValue = nlRes.d2 > 0;
      }

      resolve(onValue);
    })
  }

  getOnState(callback) {
    const onCharacteristic = this.getOrCreateService(this.platform.Service.Lightbulb).getCharacteristic(this.platform.Characteristic.On);
    const result = callback(null, this.state.on);
    new Promise((resolve, reject) => { this.updateOnValue(reject, resolve) })
        .then((value) => { onCharacteristic.updateValue(value); })
        .catch((err) => { this.log('Error on get value: ', err); });
    return result;
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
            'Model': 'SLF',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Slf;
