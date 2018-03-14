const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Slf extends AccessoryBase {
  static displayName() {
    return 'SLF';
  }
  static description() {
    return 'блок с протоколом nooLite-F';
  }

  static getAccessoryCategory() {
    return 5;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let onCharacteristic = this.getOrCreateService(this.platform.Service.Lightbulb).getCharacteristic(this.platform.Characteristic.On);
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

    let nlRespListener = (nlCmd) => {
      clearTimeout(responseTimer);
      this.log('once read data in GET callback:', nlCmd);
      if (nlCmd.isError()) {
        callback(new Error('Error on write: ' + nlCmd));
        return;
      }

      let onValue = acc.value;

      if (nlCmd.isState() && nlCmd.fmt === 0) {
        onValue = nlCmd.d2 > 0;
      }

      callback(null, onValue);
    };

    this.platform.serialPort.nlParser.once(`nlres:${this.nlId}`, nlRespListener);

    let command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));

    this.platform.serialPort.write(command.toBytes(), null, (err) => {
      if (err) {
        return this.log('Error on write: ', err.message);
      }
      this.log('message written in GET callback', command);
    });

    let responseTimer = setTimeout(() => {
        this.log('Wating response timeout. Return cached state: ', acc.value);
        this.platform.serialPort.nlParser.removeListener(`nlres:${this.nlId}`, nlRespListener);
        callback(null, acc.value);
    }, 1000);

  }

  setOnState(value, callback) {
    this.log("Set On characteristic to " + value);

    this.platform.serialPort.nlParser.once(`nlres:${this.nlId}`, (nlCmd) => {
      this.log('once read data in SET callback:', nlCmd);
      if (nlCmd.isError()) {
        callback(new Error('Error on write: ' + nlCmd));
        return;
      }
      callback();
    });

    let command = new NooLiteRequest(this.nlChannel, (value ? 2 : 0), 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));

    this.platform.serialPort.write(command.toBytes(), null, (err) => {
      if (err) {
        this.log('Error on write: ', err.message);
        callback(new Error('Error on write: ' + err.message));
        return;
      }
      this.log('message written in SET callback: ', command);
    });
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
